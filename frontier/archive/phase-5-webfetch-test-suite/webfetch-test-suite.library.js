// Frontier WebFetch Test Suite - AI Dungeon Library
// Paste this entire file into an AI Dungeon scenario Library.
//
// Pair with webfetch-test-suite.output-modifier.js.
//
// The suite writes:
//   frontier:out
//   frontier:test:webfetch
//
// Approve the WebFetch consent prompts for:
//   https://example.com
//   https://api.duckduckgo.com
//
// Optional denied-consent check after the suite passes:
//   deny https://example.org in DevTools or the prompt, type "wf deny",
//   then confirm manualDeniedPass is true in frontier:test:webfetch.

state.frontierWebFetchSuite = state.frontierWebFetchSuite || {
  runId: null,
  turn: 0,
  seq: 0,
  outSeq: 0,
  pending: {},
  completed: {},
  acked: {},
  ackAttempts: {},
  events: [],
  consumedCommands: {},
  fetchId: null,
  unsafeMethodId: null,
  blockedId: null,
  invalidId: null,
  searchId: null,
  manualDeniedId: null,
  phase: 'boot'
};

function wfNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function wfRunId() {
  if (!state.frontierWebFetchSuite.runId) {
    state.frontierWebFetchSuite.runId = 'webfetch-' + wfNow().toString(36);
  }
  return state.frontierWebFetchSuite.runId;
}

function wfCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function wfFindCard(title) {
  var cards = wfCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function wfCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function wfReadJson(title) {
  var found = wfFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(wfCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function wfWriteCard(title, value, type) {
  var found = wfFindCard(title);
  var cardType = type || 'Frontier';

  if (found.card && found.index >= 0 && typeof updateStoryCard === 'function') {
    var existing = found.card;
    updateStoryCard(
      found.index,
      existing.keys || existing.key || title,
      value,
      existing.type || cardType
    );
    return true;
  }

  if (typeof addStoryCard === 'function') {
    addStoryCard(title, value, cardType);
    return true;
  }

  return false;
}

function wfLiveKey() {
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function wfLog(event, detail) {
  var suite = state.frontierWebFetchSuite;
  suite.events = suite.events || [];
  suite.events.push({
    at: wfNow(),
    turn: suite.turn,
    liveKey: wfLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 40) suite.events.shift();
}

function wfHeartbeat() {
  return wfReadJson('frontier:heartbeat');
}

function wfHasOp(moduleId, opName) {
  var heartbeat = wfHeartbeat();
  var frontier = heartbeat && heartbeat.frontier;
  if (!frontier || frontier.protocol !== 1 || frontier.profile !== 'full') return false;

  var modules = heartbeat.modules;
  if (!Array.isArray(modules)) return false;
  for (var i = 0; i < modules.length; i++) {
    var mod = modules[i];
    if (!mod || mod.id !== moduleId) continue;
    var ops = Array.isArray(mod.ops) ? mod.ops : [];
    return ops.indexOf(opName) !== -1;
  }
  return false;
}

function wfPendingRequestsArray() {
  var suite = state.frontierWebFetchSuite;
  var out = [];
  for (var id in suite.pending) {
    if (Object.prototype.hasOwnProperty.call(suite.pending, id)) {
      out.push(suite.pending[id]);
    }
  }
  return out;
}

function wfWriteOut() {
  var suite = state.frontierWebFetchSuite;
  var payload = {
    v: 1,
    requests: wfPendingRequestsArray(),
    acks: suite._acks || [],
    debugSeq: ++suite.outSeq,
    debugWrittenAt: wfNow()
  };
  suite._acks = [];
  wfWriteCard('frontier:out', JSON.stringify(payload), 'Frontier');
}

function wfQueueAck(requestId, reason) {
  var suite = state.frontierWebFetchSuite;
  suite._acks = suite._acks || [];
  suite.acked = suite.acked || {};
  suite.ackAttempts = suite.ackAttempts || {};

  var attempts = Number(suite.ackAttempts[requestId] || 0);
  if (attempts >= 6) return false;

  suite.acked[requestId] = true;
  suite.ackAttempts[requestId] = attempts + 1;
  suite._acks.push(requestId);
  wfLog(attempts === 0 ? 'ack' : 'ack-retry', requestId + (reason ? ' - ' + reason : ''));
  return true;
}

function wfQueueRequest(opName, args) {
  var suite = state.frontierWebFetchSuite;
  var id = wfLiveKey() + '-webfetch-' + (++suite.seq);
  if (suite.pending[id] || suite.completed[id]) return id;

  suite.pending[id] = {
    id: id,
    module: 'webfetch',
    op: opName,
    args: args || {},
    ts: wfNow()
  };
  wfLog('queued', id + ' -> webfetch.' + opName);
  wfWriteOut();
  return id;
}

function wfIsTerminal(response) {
  return response && (response.status === 'ok' || response.status === 'err' || response.status === 'timeout');
}

function wfPollResponses() {
  var suite = state.frontierWebFetchSuite;
  var card = wfReadJson('frontier:in:webfetch');
  var foundTerminal = false;
  if (!card || !card.responses) return;

  for (var requestId in card.responses) {
    if (!Object.prototype.hasOwnProperty.call(card.responses, requestId)) continue;
    var response = card.responses[requestId];
    if (!wfIsTerminal(response)) continue;

    if (!suite.completed[requestId]) {
      suite.completed[requestId] = {
        status: response.status,
        data: response.data || null,
        error: response.error || null,
        seenAt: wfNow()
      };
      wfLog('completed', requestId + ' -> ' + response.status);
    }

    delete suite.pending[requestId];
    if (!suite.acked[requestId]) {
      foundTerminal = wfQueueAck(requestId, 'terminal response') || foundTerminal;
    } else if (Number(suite.ackAttempts[requestId] || 0) < 6) {
      foundTerminal = wfQueueAck(requestId, 'response still present') || foundTerminal;
    }
  }

  if (foundTerminal) wfWriteOut();
}

function wfTextIncludes(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function wfRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.frontierWebFetchSuite.turn, text: String(outputText || '') }];
  var entries = Array.isArray(history) ? history : [];
  var start = Math.max(0, entries.length - 6);
  for (var i = start; i < entries.length; i++) {
    var entry = entries[i];
    if (!entry) continue;
    sources.push({
      id: 'history:' + i,
      text: String(entry.text || '') + '\n' + String(entry.rawText || '')
    });
  }
  return sources;
}

function wfConsumeCommand(kind, outputText, needles) {
  var suite = state.frontierWebFetchSuite;
  suite.consumedCommands = suite.consumedCommands || {};
  var sources = wfRecentSources(outputText);

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!wfTextIncludes(source.text, needles)) continue;
    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;
    suite.consumedCommands[signature] = wfNow();
    return true;
  }
  return false;
}

function wfResetSuite() {
  state.frontierWebFetchSuite = {
    runId: 'webfetch-' + wfNow().toString(36),
    turn: 0,
    seq: 0,
    outSeq: 0,
    pending: {},
    completed: {},
    acked: {},
    ackAttempts: {},
    events: [],
    consumedCommands: {},
    fetchId: null,
    unsafeMethodId: null,
    blockedId: null,
    invalidId: null,
    searchId: null,
    manualDeniedId: null,
    phase: 'reset'
  };
  wfWriteCard('frontier:out', JSON.stringify({ v: 1, requests: [], acks: [] }), 'Frontier');
  wfWriteTrace();
}

function wfDrivePlan(outputText) {
  var suite = state.frontierWebFetchSuite;

  if (wfConsumeCommand('reset', outputText, ['wf reset', '[[wf:reset]]'])) {
    wfResetSuite();
    return;
  }

  if (!wfHasOp('webfetch', 'fetch') || !wfHasOp('webfetch', 'search')) {
    suite.phase = 'waiting for webfetch heartbeat';
    return;
  }

  if (!suite.manualDeniedId && wfConsumeCommand('deny', outputText, ['wf deny', '[[wf:deny]]'])) {
    suite.phase = 'waiting for denied consent';
    suite.manualDeniedId = wfQueueRequest('fetch', {
      url: 'https://example.org/frontier-denied',
      method: 'GET',
      timeoutMs: 15000
    });
    return;
  }

  if (!suite.fetchId) {
    suite.phase = 'waiting for fetch';
    suite.fetchId = wfQueueRequest('fetch', {
      url: 'https://example.com/',
      method: 'GET',
      timeoutMs: 15000,
      maxBodyBytes: 30000
    });
    return;
  }

  if (suite.fetchId && suite.completed[suite.fetchId] && !suite.unsafeMethodId) {
    suite.phase = 'waiting for unsafe method';
    suite.unsafeMethodId = wfQueueRequest('fetch', {
      url: 'https://example.com/frontier-post-blocked',
      method: 'POST',
      body: { shouldNotSend: true }
    });
    return;
  }

  if (suite.unsafeMethodId && suite.completed[suite.unsafeMethodId] && !suite.blockedId) {
    suite.phase = 'waiting for blocked scheme';
    suite.blockedId = wfQueueRequest('fetch', { url: 'file:///frontier-webfetch-blocked' });
    return;
  }

  if (suite.blockedId && suite.completed[suite.blockedId] && !suite.invalidId) {
    suite.phase = 'waiting for invalid args';
    suite.invalidId = wfQueueRequest('fetch', {});
    return;
  }

  if (suite.invalidId && suite.completed[suite.invalidId] && !suite.searchId) {
    suite.phase = 'waiting for search';
    suite.searchId = wfQueueRequest('search', {
      query: 'AI Dungeon Frontier web access',
      maxResults: 3,
      timeoutMs: 15000
    });
    return;
  }

  suite.phase = wfAllChecksPass() ? 'complete' : 'waiting';
}

function wfAllChecksPass() {
  var suite = state.frontierWebFetchSuite;
  var fetched = suite.fetchId && suite.completed[suite.fetchId];
  var unsafe = suite.unsafeMethodId && suite.completed[suite.unsafeMethodId];
  var blocked = suite.blockedId && suite.completed[suite.blockedId];
  var invalid = suite.invalidId && suite.completed[suite.invalidId];
  var search = suite.searchId && suite.completed[suite.searchId];

  return !!(
    wfHasOp('webfetch', 'fetch') &&
    wfHasOp('webfetch', 'search') &&
    fetched && fetched.status === 'ok' && fetched.data && fetched.data.status === 200 &&
    String(fetched.data.body || '').indexOf('Example Domain') !== -1 &&
    unsafe && unsafe.status === 'err' && unsafe.error && unsafe.error.code === 'invalid_args' &&
    blocked && blocked.status === 'err' && blocked.error && blocked.error.code === 'scheme_blocked' &&
    invalid && invalid.status === 'err' && invalid.error && invalid.error.code === 'invalid_args' &&
    search && search.status === 'ok' && search.data && search.data.provider === 'duckduckgo' && search.data.status === 200
  );
}

function wfWriteTrace() {
  var suite = state.frontierWebFetchSuite;
  var manualDenied = suite.manualDeniedId && suite.completed[suite.manualDeniedId];
  var trace = {
    v: 1,
    runId: wfRunId(),
    turn: suite.turn,
    liveKey: wfLiveKey(),
    phase: suite.phase,
    heartbeatFull: !!(wfHeartbeat() && wfHeartbeat().frontier && wfHeartbeat().frontier.profile === 'full'),
    webfetchFetchAdvertised: wfHasOp('webfetch', 'fetch'),
    webfetchSearchAdvertised: wfHasOp('webfetch', 'search'),
    pendingIds: Object.keys(suite.pending || {}),
    ackedIds: Object.keys(suite.acked || {}),
    ackAttempts: suite.ackAttempts || {},
    manualDeniedId: suite.manualDeniedId,
    manualDeniedPass: !!(
      manualDenied &&
      manualDenied.status === 'err' &&
      manualDenied.error &&
      manualDenied.error.code === 'consent_denied'
    ),
    completed: suite.completed,
    checksPass: wfAllChecksPass(),
    events: suite.events || []
  };
  wfWriteCard('frontier:test:webfetch', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function frontierWebFetchStep(outputText) {
  var suite = state.frontierWebFetchSuite;
  wfRunId();
  suite.turn += 1;
  wfPollResponses();
  wfDrivePlan(outputText);
  wfWriteTrace();
  return true;
}
