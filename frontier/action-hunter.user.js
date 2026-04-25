// ==UserScript==
// @name         Frontier Hunter
// @namespace    frontier
// @match        https://play.aidungeon.com/*
// @match        https://*.aidungeon.com/*
// @run-at       document-start
// @grant        none
// @version      0.3
// ==/UserScript==

// Frontier-side instrumentation for AI Dungeon.
//
// Phase 8 update:
// AI Dungeon now groups Story Cards by collapsible type sections, including
// custom types. We no longer need manual UI filtering for reserved Frontier
// cards. This hunter now focuses on:
//   - New Story Cards DOM shape: tabs, category sections, card badges.
//   - GraphQL operation drift: HTTP fetch, XHR, and WS operation names.
//   - Story Card mutation shape: SaveQueueStoryCard or renamed equivalents.
//   - Heartbeat failure diagnosis: is frontier:heartbeat absent because the
//     write template was not captured, the card response shape changed, or the
//     UI simply moved it into a custom category?
//
// Useful console helpers:
//   __frontierActions.summary()
//   __frontierActions.cardSummary()
//   __frontierActions.domSummary()
//   __frontierActions.graphqlSummary()
//   __frontierActions.storyCardOps()
//   __frontierActions.diagnoseHeartbeat()
//   __frontierActions.scanDom()

(function () {
  if (window.__frontierActionHunterInstalled) {
    console.warn('[ActionHunter] already installed');
    return;
  }
  window.__frontierActionHunterInstalled = true;

  const tag = '[Hunter]';
  const css = {
    ctx: 'color:#03a9f4;font-weight:bold',
    create: 'color:#4caf50;font-weight:bold',
    edit: 'color:#ff9800;font-weight:bold',
    undo: 'color:#f44336;font-weight:bold',
    redo: 'color:#9c27b0;font-weight:bold',
    retry: 'color:#e91e63;font-weight:bold;font-size:1.05em',
    card: 'color:#bfa5ff;font-weight:bold',
    dom: 'color:#7dd3fc;font-weight:bold',
    gql: 'color:#00bcd4;font-weight:bold',
    client: 'color:#00bcd4',
    event: 'color:#888',
    warn: 'color:#fbc02d;font-weight:bold',
    err: 'color:#ef4444;font-weight:bold',
  };

  const RESERVED_PREFIXES = ['frontier:', 'scripture:', 'bd:'];
  const GRAPHQL_PATH_HINT = 'graphql';
  const MAX_HISTORY = 500;
  const MAX_SAMPLES_PER_OP = 4;
  const MAX_DOM_HISTORY = 20;

  const state = {
    actions: new Map(),
    tail: null,
    liveCount: 0,
    cards: new Map(),
    history: [],
    byKey: new Map(),
    storyCardOpStats: Object.create(null),
    templates: Object.create(null),
    templatesByCard: Object.create(null),
    graphql: {
      wsOpenUrls: [],
      wsInbound: Object.create(null),
      wsOutbound: Object.create(null),
      fetch: makeTransportStats(),
      xhr: makeTransportStats(),
      errors: [],
    },
    dom: {
      latest: null,
      history: [],
      observerStarted: false,
    },
    config: {
      logAllGraphql: false,
      logDomChanges: true,
      logCardChanges: true,
      logStoryCardOps: true,
    },
  };

  window.__frontierActions = state;

  function makeTransportStats() {
    return {
      total: 0,
      graphql: 0,
      posts: 0,
      opNames: Object.create(null),
      samples: Object.create(null),
      storyCardOps: Object.create(null),
    };
  }

  function record(ev) {
    ev.t = Date.now();
    state.history.push(ev);
    if (state.history.length > MAX_HISTORY) state.history.shift();
    if (ev.key) {
      let bucket = state.byKey.get(ev.key);
      if (!bucket) {
        bucket = [];
        state.byKey.set(ev.key, bucket);
      }
      bucket.push(ev);
    }
  }

  function safeJson(text) {
    if (typeof text !== 'string' || !text) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  function payloadsFromBody(bodyText) {
    const parsed = safeJson(bodyText);
    if (!parsed) return [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed];
  }

  function opNameFromPayload(p) {
    if (!p || typeof p !== 'object') return null;
    if (typeof p.operationName === 'string' && p.operationName) return p.operationName;
    if (typeof p.query === 'string') {
      const m = p.query.match(/\b(?:mutation|query|subscription)\s+([_A-Za-z][_0-9A-Za-z]*)/);
      if (m) return m[1];
    }
    return null;
  }

  function opKindFromPayload(p) {
    if (typeof p?.query !== 'string') return 'unknown';
    const m = p.query.match(/\b(mutation|query|subscription)\b/);
    return m ? m[1] : 'unknown';
  }

  function isStoryCardOp(opName, payload) {
    const haystack = [
      opName || '',
      payload?.query || '',
      JSON.stringify(payload?.variables || {}),
    ].join('\n');
    return /story\s*card|storycard/i.test(haystack);
  }

  function summarizeVariables(variables) {
    if (!variables || typeof variables !== 'object') {
      return { variableKeys: [], inputKeys: [], input: null };
    }
    const input = variables.input && typeof variables.input === 'object'
      ? variables.input
      : null;
    return {
      variableKeys: Object.keys(variables).sort(),
      inputKeys: input ? Object.keys(input).sort() : [],
      input: input ? summarizeInput(input) : null,
    };
  }

  function summarizeInput(input) {
    const out = {};
    for (const key of ['id', 'shortId', 'contentType', 'type', 'title', 'keys', 'description', 'useForCharacterCreation']) {
      if (key in input) out[key] = input[key];
    }
    if (typeof input.value === 'string') {
      out.valueLen = input.value.length;
      out.valuePreview = input.value.slice(0, 120);
    }
    return out;
  }

  function bumpOp(stats, opName, sample) {
    const name = opName || '<unknown>';
    stats.opNames[name] = (stats.opNames[name] || 0) + 1;
    if (!stats.samples[name]) stats.samples[name] = [];
    if (stats.samples[name].length < MAX_SAMPLES_PER_OP && sample) {
      stats.samples[name].push(sample);
    }
  }

  function bumpGlobalStoryCardOp(opName, transport, sample) {
    const name = opName || '<unknown>';
    if (!state.storyCardOpStats[name]) {
      state.storyCardOpStats[name] = {
        count: 0,
        transports: Object.create(null),
        samples: [],
        lastSeenAt: null,
      };
    }
    const entry = state.storyCardOpStats[name];
    entry.count++;
    entry.transports[transport] = (entry.transports[transport] || 0) + 1;
    entry.lastSeenAt = new Date().toISOString();
    if (entry.samples.length < MAX_SAMPLES_PER_OP && sample) {
      entry.samples.push(sample);
    }
  }

  function inspectGraphqlRequest(transport, stats, url, bodyText) {
    stats.total++;
    if (!String(url || '').includes(GRAPHQL_PATH_HINT)) return [];

    stats.graphql++;
    const payloads = payloadsFromBody(bodyText);
    if (bodyText) stats.posts++;

    const seen = [];
    for (const p of payloads) {
      const opName = opNameFromPayload(p);
      const kind = opKindFromPayload(p);
      const variableSummary = summarizeVariables(p.variables);
      const sample = {
        kind,
        variableKeys: variableSummary.variableKeys,
        inputKeys: variableSummary.inputKeys,
        input: variableSummary.input,
        hasQuery: typeof p.query === 'string',
        queryPreview: typeof p.query === 'string' ? p.query.slice(0, 220) : null,
      };
      bumpOp(stats, opName, sample);
      seen.push({ opName, kind, sample, payload: p });

      if (isStoryCardOp(opName, p)) {
        stats.storyCardOps[opName || '<unknown>'] = (stats.storyCardOps[opName || '<unknown>'] || 0) + 1;
        bumpGlobalStoryCardOp(opName, transport, sample);
        storeTemplate(opName || '<unknown>', transport, url, bodyText, p, sample);
        if (state.config.logStoryCardOps) {
          console.groupCollapsed(`%c${tag} ${transport} StoryCard op ${opName || '<unknown>'}`, css.gql);
          console.log(sample);
          console.log('variables:', p.variables || null);
          console.groupEnd();
        }
      } else if (state.config.logAllGraphql) {
        console.log(`%c${tag} ${transport} GraphQL ${opName || '<unknown>'}`, css.client, sample);
      }
    }
    return seen;
  }

  function storeTemplate(opName, transport, url, bodyText, payload, sample) {
    const entry = {
      op: opName,
      transport,
      url,
      body: bodyText,
      capturedAt: Date.now(),
      sample,
    };
    state.templates[opName] = entry;

    const input = payload?.variables?.input;
    const cardId = input && (typeof input.id === 'string' || typeof input.id === 'number')
      ? String(input.id)
      : null;
    if (cardId) {
      if (!state.templatesByCard[cardId]) state.templatesByCard[cardId] = Object.create(null);
      state.templatesByCard[cardId][opName] = entry;
    }
  }

  function inspectGraphqlResponse(transport, opInfos, responseJson) {
    if (!responseJson) return;
    const payloads = Array.isArray(responseJson) ? responseJson : [responseJson];

    payloads.forEach((reply, index) => {
      if (reply?.errors?.length) {
        state.graphql.errors.push({
          transport,
          opName: opInfos[index]?.opName || null,
          errors: reply.errors,
          t: Date.now(),
        });
        console.warn(`${tag} ${transport} GraphQL errors`, opInfos[index]?.opName, reply.errors);
      }

      const data = reply?.data;
      if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        const opName = opInfos[index]?.opName || keys[0] || '<unknown>';
        const template = state.templates[opName];
        if (template && !template.responseKeys) template.responseKeys = keys;
        scanGraphqlTreeForCards(data, `${transport}:${opName}`);
      }
    });
  }

  function looksLikeCard(x) {
    return x && typeof x === 'object' &&
      x.id != null &&
      (typeof x.title === 'string' || typeof x.value === 'string' || typeof x.type === 'string');
  }

  function looksLikeCardArray(arr) {
    if (!Array.isArray(arr)) return false;
    if (arr.length === 0) return true;
    return looksLikeCard(arr[0]);
  }

  function scanGraphqlTreeForCards(root, source) {
    if (!root || typeof root !== 'object') return;
    const seen = new WeakSet();
    const stack = [{ node: root, depth: 0 }];
    while (stack.length) {
      const { node, depth } = stack.pop();
      if (!node || typeof node !== 'object' || seen.has(node) || depth > 8) continue;
      seen.add(node);

      if (Array.isArray(node)) {
        for (const child of node) stack.push({ node: child, depth: depth + 1 });
        continue;
      }

      if (Array.isArray(node.storyCards) && looksLikeCardArray(node.storyCards)) {
        onCardsSnapshot(node.storyCards, `${source}:storyCards`, true);
      }
      if (looksLikeCard(node.storyCard)) {
        onCardsSnapshot([node.storyCard], `${source}:storyCard`, false);
      }
      if (looksLikeCard(node)) {
        const keys = Object.keys(node);
        if (keys.includes('title') && keys.includes('value')) {
          onCardsSnapshot([node], `${source}:cardObject`, false);
        }
      }

      for (const key of Object.keys(node)) {
        const child = node[key];
        if (child && typeof child === 'object') stack.push({ node: child, depth: depth + 1 });
      }
    }
  }

  function cardInfo(card) {
    const title = String(card?.title || '');
    const type = String(card?.type || '');
    const reservedPrefix = RESERVED_PREFIXES.find(prefix => title.startsWith(prefix)) || null;
    return {
      id: card?.id != null ? String(card.id) : '',
      title,
      type,
      keys: card?.keys || '',
      valueLen: typeof card?.value === 'string' ? card.value.length : 0,
      reserved: !!reservedPrefix,
      reservedPrefix,
    };
  }

  function onCardsSnapshot(cards, source, fullSnapshot) {
    if (!Array.isArray(cards)) return;

    const changes = [];
    const seenIds = new Set();
    for (const c of cards) {
      const info = cardInfo(c);
      if (!info.id) continue;
      seenIds.add(info.id);
      const prev = state.cards.get(info.id);
      if (!prev) {
        changes.push({ kind: 'added', ...info });
      } else if (
        prev.title !== c.title ||
        prev.type !== c.type ||
        prev.keys !== c.keys ||
        prev.value !== c.value
      ) {
        changes.push({
          kind: 'changed',
          ...info,
          from: cardInfo(prev),
        });
      }
      state.cards.set(info.id, c);
    }

    if (fullSnapshot) {
      for (const [id, prev] of [...state.cards.entries()]) {
        if (!seenIds.has(id)) {
          changes.push({ kind: 'removed', ...cardInfo(prev) });
          state.cards.delete(id);
        }
      }
    }

    record({ kind: fullSnapshot ? 'cardsSnapshot' : 'cardsUpsert', source, changes: changes.length, total: state.cards.size });

    if (changes.length && state.config.logCardChanges) {
      console.groupCollapsed(`%c${tag} cards ${changes.length} change(s) via ${source}`, css.card);
      changes.forEach(change => console.log(change.kind, change));
      console.groupEnd();
    }
  }

  function onCardsUpdate(payload) {
    const cards = payload?.storyCards;
    if (!Array.isArray(cards)) return;
    onCardsSnapshot(cards, 'ws:adventureStoryCardsUpdate', true);
  }

  function onContextUpdate(payload) {
    const prevTail = state.tail;
    state.tail = payload?.actionId ?? null;
    record({ kind: 'contextUpdate', key: payload?.key, actionId: state.tail });
    if (prevTail !== state.tail) {
      console.log(`%c${tag} contextUpdate tail=${state.tail}${prevTail ? ` (was ${prevTail})` : ''}`, css.ctx);
    }
  }

  function diffAction(prev, next) {
    const diffs = [];
    if (!prev) {
      diffs.push('NEW');
      return diffs;
    }
    if ((prev.undoneAt ?? null) !== (next.undoneAt ?? null)) {
      diffs.push(next.undoneAt ? 'undone' : 'restored');
    }
    if (prev.text !== next.text) diffs.push(`text (${prev.text?.length || 0}->${next.text?.length || 0})`);
    if ((prev.retriedActionId ?? null) !== (next.retriedActionId ?? null)) {
      diffs.push(`retriedActionId=${next.retriedActionId}`);
    }
    return diffs;
  }

  function onActionUpdates(payload) {
    const { type, key, actions, retriedActionId } = payload || {};
    const perAction = [];
    let anyRetry = retriedActionId != null;

    for (const a of actions || []) {
      const prev = state.actions.get(a.id);
      const diffs = diffAction(prev, a);
      if (a.retriedActionId) anyRetry = true;
      state.actions.set(a.id, {
        id: a.id,
        text: a.text,
        undoneAt: a.undoneAt ?? null,
        retriedActionId: a.retriedActionId ?? null,
        type: a.type,
        updatedAt: a.updatedAt,
      });
      if (diffs.length) perAction.push({ id: a.id, diffs, preview: (a.text || '').slice(0, 60) });
    }

    const prevLive = state.liveCount;
    state.liveCount = [...state.actions.values()].filter(a => !a.undoneAt).length;
    record({ kind: 'actionUpdates', key, type, retriedActionId, perAction, count: actions?.length || 0, liveCount: state.liveCount });

    const label = anyRetry ? 'RETRY' : (type || 'update').toUpperCase();
    const style = anyRetry ? css.retry : (type === 'create' ? css.create : css.edit);
    console.groupCollapsed(`%c${tag} actionUpdates ${label} n=${actions?.length || 0} live=${prevLive}->${state.liveCount}`, style);
    perAction.forEach(item => console.log(item));
    console.groupEnd();
  }

  function classifyTab(tab) {
    const aria = tab.getAttribute('aria-label') || '';
    const text = (tab.textContent || '').replace(/\s+/g, ' ').trim();
    return {
      ariaLabel: aria,
      text,
      selected: /^selected/i.test(aria) || tab.getAttribute('aria-selected') === 'true',
    };
  }

  function closestButton(el) {
    return el?.closest?.('[role="button"],button');
  }

  function scanStoryCardDom({ log = true } = {}) {
    const tabs = [...document.querySelectorAll('[role="tab"]')].map(classifyTab);
    const searchBoxes = [...document.querySelectorAll('[role="searchbox"]')].map(el => ({
      placeholder: el.getAttribute('placeholder') || '',
      valueLen: (el.value || '').length,
    }));

    const categoryButtons = [...document.querySelectorAll('[role="button"][aria-label]')]
      .filter(btn => /\bstory cards section$/i.test(btn.getAttribute('aria-label') || ''));
    const categories = categoryButtons.map(btn => {
      const aria = btn.getAttribute('aria-label') || '';
      const label = aria.replace(/\s+story cards section$/i, '').trim();
      const textParts = [...btn.querySelectorAll('.is_Text,span,h1,h2,h3')]
        .map(el => (el.textContent || '').trim())
        .filter(Boolean);
      const numeric = textParts.find(t => /^\d+$/.test(t));
      return {
        label,
        ariaLabel: aria,
        expanded: btn.getAttribute('aria-expanded') === 'true',
        count: numeric ? Number(numeric) : null,
        text: textParts.join(' | ').slice(0, 200),
      };
    });

    const cardButtons = [...document.querySelectorAll('[role="button"]')]
      .filter(btn => btn.querySelector('h1[role="heading"],h1'));
    const cards = cardButtons.map(btn => {
      const heading = btn.querySelector('h1[role="heading"],h1');
      const typeBadge = btn.querySelector('span[aria-label^="type:"]');
      return {
        title: (heading?.textContent || '').trim(),
        type: (typeBadge?.getAttribute('aria-label') || '').replace(/^type:\s*/i, '').trim(),
        ariaLabel: btn.getAttribute('aria-label') || '',
      };
    }).filter(c => c.title);

    const controls = [...document.querySelectorAll('[role="button"],button')]
      .map(btn => btn.getAttribute('aria-label') || btn.textContent?.trim() || '')
      .filter(label => /story card|grid view|list view|compact view|create story card|add plot component/i.test(label));

    const snapshot = {
      at: Date.now(),
      url: location.href,
      tabs,
      selectedTabs: tabs.filter(t => t.selected),
      searchBoxes,
      categories,
      cards,
      controls,
    };

    const prev = state.dom.latest;
    state.dom.latest = snapshot;
    state.dom.history.push(snapshot);
    if (state.dom.history.length > MAX_DOM_HISTORY) state.dom.history.shift();

    const signature = JSON.stringify({
      tabs: snapshot.selectedTabs.map(t => t.ariaLabel || t.text),
      categories: snapshot.categories.map(c => `${c.label}:${c.count}:${c.expanded}`),
      cards: snapshot.cards.map(c => `${c.type}:${c.title}`),
    });
    const prevSignature = prev ? JSON.stringify({
      tabs: prev.selectedTabs.map(t => t.ariaLabel || t.text),
      categories: prev.categories.map(c => `${c.label}:${c.count}:${c.expanded}`),
      cards: prev.cards.map(c => `${c.type}:${c.title}`),
    }) : null;

    if (log && state.config.logDomChanges && signature !== prevSignature) {
      console.groupCollapsed(`%c${tag} Story Cards DOM: ${categories.length} categories, ${cards.length} visible cards`, css.dom);
      console.table(categories);
      if (cards.length) console.table(cards);
      console.log('selected tabs:', snapshot.selectedTabs);
      console.log('controls:', controls);
      console.groupEnd();
    }

    return snapshot;
  }

  function startDomObserver() {
    if (state.dom.observerStarted) return;
    state.dom.observerStarted = true;
    let timer = null;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => scanStoryCardDom({ log: true }), 500);
    };
    const observer = new MutationObserver(schedule);
    const start = () => {
      observer.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'aria-expanded', 'role'] });
      schedule();
    };
    if (document.documentElement) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
    state.dom.observer = observer;
  }

  function installWebSocketShim() {
    const NativeWebSocket = window.WebSocket;
    window.WebSocket = class FrontierHunterWebSocket extends NativeWebSocket {
      constructor(url, protocols) {
        super(url, protocols);
        const urlText = typeof url === 'string' ? url : (url?.toString?.() || '');
        if (urlText.includes(GRAPHQL_PATH_HINT)) {
          state.graphql.wsOpenUrls.push(urlText);
          console.log(`%c${tag} WS opened ${urlText}`, css.event);

          const nativeSend = this.send.bind(this);
          this.send = (data) => {
            try {
              if (typeof data === 'string') {
                const msg = safeJson(data);
                const payload = msg?.payload;
                const opName = opNameFromPayload(payload);
                if (opName) {
                  const sample = {
                    type: msg.type,
                    kind: opKindFromPayload(payload),
                    variableSummary: summarizeVariables(payload?.variables),
                  };
                  state.graphql.wsOutbound[opName] = (state.graphql.wsOutbound[opName] || 0) + 1;
                }
              }
            } catch (err) {
              console.warn(`${tag} WS send inspection failed`, err);
            }
            return nativeSend(data);
          };
        }

        this.addEventListener('message', (event) => {
          let msg;
          try { msg = JSON.parse(event.data); } catch { return; }
          if (msg.type !== 'next' && msg.type !== 'data') return;
          const data = msg.payload?.data ?? msg.data;
          if (!data || typeof data !== 'object') return;

          for (const opName of Object.keys(data)) {
            state.graphql.wsInbound[opName] = (state.graphql.wsInbound[opName] || 0) + 1;
          }

          if (data.adventureStoryCardsUpdate) onCardsUpdate(data.adventureStoryCardsUpdate);
          if (data.contextUpdate) onContextUpdate(data.contextUpdate);
          if (data.actionUpdates) onActionUpdates(data.actionUpdates);
          scanGraphqlTreeForCards(data, 'ws:inbound');
        });
      }
    };

    for (const key of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) {
      if (NativeWebSocket[key] !== undefined) window.WebSocket[key] = NativeWebSocket[key];
    }
  }

  function installFetchShim() {
    const NativeFetch = window.fetch;
    window.fetch = function frontierHunterFetch(input, init) {
      const url = typeof input === 'string' ? input : (input?.url || '');
      const method = (init?.method || input?.method || 'GET').toUpperCase();
      const bodyText = method === 'POST' && typeof init?.body === 'string' ? init.body : null;
      const opInfos = inspectGraphqlRequest('fetch', state.graphql.fetch, url, bodyText);

      const result = NativeFetch.apply(this, arguments);
      if (!String(url).includes(GRAPHQL_PATH_HINT)) return result;

      return result.then(async response => {
        if (!response || !response.clone) return response;
        try {
          const text = await response.clone().text();
          inspectGraphqlResponse('fetch', opInfos, safeJson(text));
        } catch (err) {
          if (err?.name !== 'AbortError') console.warn(`${tag} fetch response inspection failed`, err);
        }
        return response;
      });
    };
  }

  function installXhrShim() {
    const proto = XMLHttpRequest.prototype;
    const nativeOpen = proto.open;
    const nativeSend = proto.send;

    proto.open = function frontierHunterXhrOpen(method, url) {
      this.__frontierHunter = {
        method: typeof method === 'string' ? method.toUpperCase() : 'GET',
        url: typeof url === 'string' ? url : (url?.toString?.() || ''),
        opInfos: [],
      };
      return nativeOpen.apply(this, arguments);
    };

    proto.send = function frontierHunterXhrSend(body) {
      const meta = this.__frontierHunter;
      if (meta) {
        const bodyText = meta.method === 'POST' && typeof body === 'string' ? body : null;
        meta.opInfos = inspectGraphqlRequest('xhr', state.graphql.xhr, meta.url, bodyText);
        if (meta.url.includes(GRAPHQL_PATH_HINT)) {
          this.addEventListener('readystatechange', () => {
            if (this.readyState !== 4) return;
            let text = '';
            try {
              text = this.responseText;
            } catch {
              return;
            }
            inspectGraphqlResponse('xhr', meta.opInfos, safeJson(text));
          });
        }
      }
      return nativeSend.apply(this, arguments);
    };
  }

  function rowsFromCards() {
    return [...state.cards.values()].map(card => cardInfo(card));
  }

  function groupByType(cards) {
    const out = Object.create(null);
    for (const info of cards) {
      const key = info.type || '<blank>';
      if (!out[key]) out[key] = [];
      out[key].push(info.title);
    }
    return out;
  }

  state.summary = () => {
    const live = [...state.actions.values()].filter(a => !a.undoneAt);
    const undone = [...state.actions.values()].filter(a => a.undoneAt);
    console.table(live.map(a => ({
      id: a.id,
      type: a.type,
      retriedActionId: a.retriedActionId,
      textLen: (a.text || '').length,
      updatedAt: a.updatedAt,
    })));
    console.log(`tail=${state.tail} liveCount=${state.liveCount} live=${live.length} undone=${undone.length} total=${state.actions.size} cards=${state.cards.size}`);
  };

  state.cardSummary = () => {
    const rows = rowsFromCards();
    console.table(rows);
    console.log('by type:', groupByType(rows));
    return rows;
  };

  state.domSummary = () => {
    const snap = scanStoryCardDom({ log: false });
    console.table(snap.categories);
    console.table(snap.cards);
    console.log('selected tabs:', snap.selectedTabs);
    console.log('controls:', snap.controls);
    return snap;
  };

  state.graphqlSummary = () => {
    const summary = {
      wsOpenUrls: state.graphql.wsOpenUrls,
      wsInbound: state.graphql.wsInbound,
      wsOutbound: state.graphql.wsOutbound,
      fetchOps: state.graphql.fetch.opNames,
      xhrOps: state.graphql.xhr.opNames,
      storyCardOps: Object.keys(state.storyCardOpStats),
      errors: state.graphql.errors,
    };
    console.log(summary);
    return summary;
  };

  state.storyCardOps = () => {
    console.log(state.storyCardOpStats);
    return state.storyCardOpStats;
  };

  state.diagnoseHeartbeat = () => {
    const cards = rowsFromCards();
    const heartbeat = cards.find(c => c.title === 'frontier:heartbeat') || null;
    const frontierCards = cards.filter(c => c.reserved || c.type === 'frontier');
    const dom = scanStoryCardDom({ log: false });
    const result = {
      heartbeatPresent: !!heartbeat,
      heartbeat,
      frontierCards,
      storyCardOps: Object.keys(state.storyCardOpStats),
      hasSaveQueueStoryCard: !!state.storyCardOpStats.SaveQueueStoryCard,
      templates: Object.keys(state.templates),
      templatesByCardCount: Object.keys(state.templatesByCard).length,
      graphqlErrors: state.graphql.errors,
      domFrontierCategories: dom.categories.filter(c => /frontier/i.test(c.label)),
      domCardsWithFrontierType: dom.cards.filter(c => /frontier/i.test(c.type) || /^frontier:/.test(c.title)),
      likelyIssue: null,
    };

    if (!result.heartbeatPresent) {
      if (!result.storyCardOps.length) {
        result.likelyIssue = 'No Story Card GraphQL operations observed. Open Story Cards tab or edit/create a card to prime mutation capture.';
      } else if (!result.hasSaveQueueStoryCard) {
        result.likelyIssue = 'Story Card operations exist, but SaveQueueStoryCard was not observed. AI Dungeon may have renamed the mutation; inspect storyCardOps().';
      } else if (result.graphqlErrors.length) {
        result.likelyIssue = 'GraphQL errors were observed. Inspect graphqlErrors and mutation response keys.';
      } else {
        result.likelyIssue = 'Write template appears captured but heartbeat card is absent. Inspect BetterDungeon console for Frontier/core heartbeat write failure.';
      }
    } else {
      result.likelyIssue = 'Heartbeat card exists. If scripts cannot see it, check script-side card lookup and type/category assumptions.';
    }

    console.log(result);
    return result;
  };

  state.scanDom = () => scanStoryCardDom({ log: true });
  state.lastTurn = () => {
    const keys = [...state.byKey.keys()];
    const last = keys[keys.length - 1];
    return last ? { key: last, events: state.byKey.get(last) } : null;
  };

  installWebSocketShim();
  installFetchShim();
  installXhrShim();
  startDomObserver();

  console.log(`%c${tag} installed v0.3. Try: __frontierActions.diagnoseHeartbeat()`, css.ctx);
})();
