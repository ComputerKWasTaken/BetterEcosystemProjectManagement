// ==UserScript==
// @name         Frontier Hunter
// @namespace    frontier
// @match        https://play.aidungeon.com/*
// @match        https://*.aidungeon.com/*
// @run-at       document-start
// @grant        none
// @version      0.2
// ==/UserScript==

// Comprehensive Frontier-side instrumentation for AI Dungeon. Install via
// Violentmonkey / Tampermonkey. Reload the adventure, exercise normal turn /
// edit / undo / rewind / delete / retry, and watch the console.
//
// What it captures:
//   - WS server -> client:
//       * adventureStoryCardsUpdate  (card list; diffed turn-over-turn)
//       * contextUpdate              (actionId for the upcoming turn + key)
//       * actionUpdates              (actions[] with id/undoneAt/retriedActionId + key)
//   - fetch client -> server:
//       * UpdateActions              (edit, undo, rewind, delete)
//       * SendEvent                  (erase_button_pressed, edit-action,
//                                     rewind-to-here, retry, etc.)
//
// Correlation: the shared `key` (UUID) on contextUpdate + actionUpdates links
// them to the same turn. The `key` on client mutations is echoed back by the
// server, so we can trace: "user clicked X -> server broadcast Y".
//
// Live state is exposed on window.__frontierActions:
//   - actions:    Map<id, Action>       latest snapshot of every action we've seen
//   - tail:       string | null         current tail actionId (from last contextUpdate)
//   - liveCount:  number                actions.filter(!undoneAt).length
//   - cards:      Map<cardId, Card>     latest snapshot of every story card
//   - history:    Event[]               ordered transcript of every event observed
//   - byKey:      Map<uuid, Event[]>    events grouped by correlation key

(function () {
  if (window.__frontierActionHunterInstalled) {
    console.warn('[ActionHunter] already installed');
    return;
  }
  window.__frontierActionHunterInstalled = true;

  const state = {
    actions: new Map(),   // id -> { id, text, undoneAt, retriedActionId, type, updatedAt }
    tail: null,
    liveCount: 0,
    cards: new Map(),     // cardId -> Card
    history: [],
    byKey: new Map(),
  };
  window.__frontierActions = state;

  const tag = '[Hunter]';
  const css = {
    ctx:     'color:#03a9f4;font-weight:bold',
    create:  'color:#4caf50;font-weight:bold',
    edit:    'color:#ff9800;font-weight:bold',
    undo:    'color:#f44336;font-weight:bold',
    redo:    'color:#9c27b0;font-weight:bold',
    retry:   'color:#e91e63;font-weight:bold;font-size:1.05em',
    card:    'color:#bfa5ff;font-weight:bold',
    client:  'color:#00bcd4',
    event:   'color:#888',
    warn:    'color:#fbc02d;font-weight:bold',
  };

  function record(ev) {
    ev.t = Date.now();
    state.history.push(ev);
    if (ev.key) {
      let bucket = state.byKey.get(ev.key);
      if (!bucket) { bucket = []; state.byKey.set(ev.key, bucket); }
      bucket.push(ev);
    }
  }

  // ---------- adventureStoryCardsUpdate ----------
  function onCardsUpdate(payload) {
    const cards = payload?.storyCards;
    if (!Array.isArray(cards)) return;

    const changes = [];
    const seen = new Set();
    for (const c of cards) {
      seen.add(c.id);
      const prev = state.cards.get(c.id);
      if (!prev) {
        changes.push({ kind: 'added', id: c.id, title: c.title, keys: c.keys, value: c.value });
      } else if (prev.value !== c.value || prev.title !== c.title || prev.keys !== c.keys) {
        changes.push({
          kind: 'changed', id: c.id, title: c.title, keys: c.keys,
          from: prev.value?.slice(0, 80), to: c.value?.slice(0, 80),
        });
      }
      state.cards.set(c.id, c);
    }
    for (const id of [...state.cards.keys()]) {
      if (!seen.has(id)) {
        changes.push({ kind: 'removed', id, title: state.cards.get(id).title });
        state.cards.delete(id);
      }
    }

    record({ kind: 'cardsUpdate', changes: changes.length, total: cards.length });

    if (changes.length) {
      console.groupCollapsed(`%c${tag} cards ${changes.length} change(s) / ${cards.length} total`, css.card);
      changes.forEach(c => console.log(c.kind, c));
      console.groupEnd();
    } else {
      console.log(`%c${tag} cards (no changes, ${cards.length} total)`, css.event);
    }
  }

  // ---------- contextUpdate ----------
  function onContextUpdate(payload) {
    const prevTail = state.tail;
    state.tail = payload.actionId ?? null;
    record({ kind: 'contextUpdate', key: payload.key, actionId: state.tail });

    if (prevTail !== state.tail) {
      console.log(
        `%c${tag} contextUpdate tail=${state.tail}%s`,
        css.ctx,
        prevTail ? ` (was ${prevTail})` : ''
      );
    } else {
      console.log(`%c${tag} contextUpdate tail=${state.tail} (unchanged)`, css.event);
    }
  }

  // ---------- actionUpdates ----------
  function diffAction(prev, next) {
    const diffs = [];
    if (!prev) { diffs.push('NEW'); return diffs; }
    if ((prev.undoneAt ?? null) !== (next.undoneAt ?? null)) {
      diffs.push(next.undoneAt ? 'undone' : 'restored');
    }
    if (prev.text !== next.text) diffs.push(`text (${prev.text?.length}->${next.text?.length})`);
    if ((prev.retriedActionId ?? null) !== (next.retriedActionId ?? null)) {
      diffs.push(`retriedActionId=${next.retriedActionId}`);
    }
    return diffs;
  }

  function onActionUpdates(payload) {
    const { type, key, actions, retriedActionId } = payload;
    const perAction = [];
    let anyRetry = retriedActionId != null;
    const seenIds = new Set();

    for (const a of actions ?? []) {
      seenIds.add(a.id);
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

    // Did any previously-known actions drop out of this frame? (actionUpdates
    // normally sends only the recent window; we don't treat absence as deletion.)
    const droppedFromFrame = [];
    for (const [id] of state.actions) {
      if (!seenIds.has(id)) droppedFromFrame.push(id);
    }

    // Recompute liveCount from the full known actions map (not just this frame).
    const prevLive = state.liveCount;
    state.liveCount = [...state.actions.values()].filter(a => !a.undoneAt).length;

    record({ kind: 'actionUpdates', key, type, retriedActionId, perAction, count: actions?.length ?? 0, liveCount: state.liveCount });

    const label = anyRetry ? 'RETRY' : (type || 'update').toUpperCase();
    const style = anyRetry ? css.retry : (type === 'create' ? css.create : css.edit);
    const liveTag = state.liveCount !== prevLive
      ? ` liveCount=${prevLive}->${state.liveCount}`
      : ` liveCount=${state.liveCount}`;
    console.groupCollapsed(
      `%c${tag} actionUpdates ${label} %cn=${actions?.length ?? 0} key=${key?.slice(0,8)}${liveTag}`,
      style, 'color:inherit;font-weight:normal'
    );
    if (retriedActionId) console.log(`%ctop-level retriedActionId=${retriedActionId}`, css.retry);
    for (const { id, diffs, preview } of perAction) {
      const hasUndo = diffs.includes('undone');
      const hasRestore = diffs.includes('restored');
      const style = hasUndo ? css.undo : hasRestore ? css.redo : diffs[0] === 'NEW' ? css.create : css.edit;
      console.log(`%cid=${id} [${diffs.join(', ')}]`, style, preview ? `"${preview}..."` : '');
    }
    if (droppedFromFrame.length) {
      console.log(`%cnot in frame (window truncation, not deletion): ${droppedFromFrame.length} ids`, css.event);
    }
    console.groupEnd();
  }

  // ---------- WS shim ----------
  const NativeWebSocket = window.WebSocket;
  window.WebSocket = class extends NativeWebSocket {
    constructor(url, protocols) {
      super(url, protocols);
      if (typeof url === 'string' && url.includes('graphql')) {
        console.log(`%c${tag} WS opened ${url}`, css.event);
      }
      this.addEventListener('message', (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (msg.type !== 'next' && msg.type !== 'data') return;
        const data = msg.payload?.data ?? msg.data;
        if (!data) return;
        if (data.adventureStoryCardsUpdate) onCardsUpdate(data.adventureStoryCardsUpdate);
        if (data.contextUpdate) onContextUpdate(data.contextUpdate);
        if (data.actionUpdates) onActionUpdates(data.actionUpdates);
      });
    }
  };

  // ---------- fetch shim ----------
  const NativeFetch = window.fetch;
  window.fetch = function (...args) {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input?.url;
    if (url && url.includes('graphql') && init?.body && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        const payloads = Array.isArray(body) ? body : [body];
        for (const p of payloads) {
          if (p.operationName === 'UpdateActions') {
            const input = p.variables?.input;
            const actions = input?.actions ?? [];
            record({
              kind: 'UpdateActions',
              key: input?.key,
              clientActions: actions.map(a => ({
                id: a.id,
                undoneAt: a.undoneAt ?? null,
                textLen: (a.text || '').length,
              })),
            });
            console.groupCollapsed(`%c${tag} -> UpdateActions (client)`, css.client);
            console.log(`key=${input?.key?.slice(0,8)} adventureId=${input?.adventureId}`);
            for (const a of actions) {
              console.log(`  id=${a.id} undoneAt=${a.undoneAt ?? 'null'} textLen=${(a.text || '').length}`);
            }
            console.groupEnd();
          } else if (p.operationName === 'SendEvent') {
            const input = p.variables?.input;
            const meta = input?.metadata?.clientInfo ?? {};
            record({ kind: 'SendEvent', eventName: input?.eventName, meta });
            console.log(
              `%c${tag} -> SendEvent ${input?.eventName}`, css.client,
              meta.actionId ? `actionId=${meta.actionId}` : '',
              meta.actionType ? `actionType=${meta.actionType}` : '',
              meta.position != null ? `position=${meta.position}` : ''
            );
          }
        }
      } catch { /* not JSON; ignore */ }
    }
    return NativeFetch.apply(this, args);
  };

  // ---------- convenience helpers ----------
  window.__frontierActions.summary = () => {
    const live = [...state.actions.values()].filter(a => !a.undoneAt);
    const undone = [...state.actions.values()].filter(a => a.undoneAt);
    console.table(live.map(a => ({
      id: a.id, type: a.type, retriedActionId: a.retriedActionId,
      textLen: (a.text || '').length, updatedAt: a.updatedAt,
    })));
    console.log(`tail=${state.tail} liveCount=${state.liveCount} live=${live.length} undone=${undone.length} total=${state.actions.size} cards=${state.cards.size}`);
  };
  window.__frontierActions.cardSummary = () => {
    console.table([...state.cards.values()].map(c => ({
      id: c.id, title: c.title, keys: c.keys, valueLen: (c.value || '').length,
    })));
  };
  window.__frontierActions.lastTurn = () => {
    // Return every event under the most recent correlation key.
    const keys = [...state.byKey.keys()];
    const last = keys[keys.length - 1];
    return last ? { key: last, events: state.byKey.get(last) } : null;
  };

  console.log(`%c${tag} installed. Try: __frontierActions.summary()`, css.ctx);
})();
