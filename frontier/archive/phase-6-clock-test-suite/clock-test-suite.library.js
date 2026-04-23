// Frontier Clock Test Suite - AI Dungeon Library
// Paste this entire file into an AI Dungeon scenario Library.
//
// Pair with clock-test-suite.output-modifier.js.
//
// The suite writes:
//   frontier:out
//   frontier:test:clock

state.frontierClockSuite = state.frontierClockSuite || {
  runId: null,
  turn: 0,
  seq: 0,
  outSeq: 0,
  pending: {},
  completed: {},
  acked: {},
  ackAttempts: {},
  events: [],
  nowId: null,
  tzId: null,
  formatId: null,
  invalidTzId: null,
  invalidFormatId: null,
  invalidTsId: null,
  phase: 'boot'
};

function clkNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function clkRunId() {
  if (!state.frontierClockSuite.runId) {
    state.frontierClockSuite.runId = 'clock-' + clkNow().toString(36);
  }
  return state.frontierClockSuite.runId;
}

function clkCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function clkFindCard(title) {
  var cards = clkCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function clkCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function clkReadJson(title) {
  var found = clkFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(clkCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function clkWriteCard(title, value, type) {
  var found = clkFindCard(title);
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

function clkLiveKey() {
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function clkLog(event, detail) {
  var suite = state.frontierClockSuite;
  suite.events = suite.events || [];
  suite.events.push({
    at: clkNow(),
    turn: suite.turn,
    liveKey: clkLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 40) suite.events.shift();
}

function clkHeartbeat() {
  return clkReadJson('frontier:heartbeat');
}

function clkHasOp(moduleId, opName) {
  var heartbeat = clkHeartbeat();
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

function clkPendingRequestsArray() {
  var suite = state.frontierClockSuite;
  var out = [];
  for (var id in suite.pending) {
    if (Object.prototype.hasOwnProperty.call(suite.pending, id)) {
      out.push(suite.pending[id]);
    }
  }
  return out;
}

function clkWriteOut() {
  var suite = state.frontierClockSuite;
  var payload = {
    v: 1,
    requests: clkPendingRequestsArray(),
    acks: suite._acks || [],
    debugSeq: ++suite.outSeq,
    debugWrittenAt: clkNow()
  };
  suite._acks = [];
  clkWriteCard('frontier:out', JSON.stringify(payload), 'Frontier');
}

function clkQueueAck(requestId, reason) {
  var suite = state.frontierClockSuite;
  suite._acks = suite._acks || [];
  suite.acked = suite.acked || {};
  suite.ackAttempts = suite.ackAttempts || {};

  var attempts = Number(suite.ackAttempts[requestId] || 0);
  if (attempts >= 6) return false;

  suite.acked[requestId] = true;
  suite.ackAttempts[requestId] = attempts + 1;
  suite._acks.push(requestId);
  clkLog(attempts === 0 ? 'ack' : 'ack-retry', requestId + (reason ? ' - ' + reason : ''));
  return true;
}

function clkQueueRequest(opName, args) {
  var suite = state.frontierClockSuite;
  var id = clkLiveKey() + '-clock-' + (++suite.seq);
  if (suite.pending[id] || suite.completed[id]) return id;

  suite.pending[id] = {
    id: id,
    module: 'clock',
    op: opName,
    args: args || {},
    ts: clkNow()
  };
  clkLog('queued', id + ' -> clock.' + opName);
  clkWriteOut();
  return id;
}

function clkIsTerminal(response) {
  return response && (response.status === 'ok' || response.status === 'err' || response.status === 'timeout');
}

function clkPollResponses() {
  var suite = state.frontierClockSuite;
  var card = clkReadJson('frontier:in:clock');
  var foundTerminal = false;
  if (!card || !card.responses) return;

  for (var requestId in card.responses) {
    if (!Object.prototype.hasOwnProperty.call(card.responses, requestId)) continue;
    var response = card.responses[requestId];
    if (!clkIsTerminal(response)) continue;

    if (!suite.completed[requestId]) {
      suite.completed[requestId] = {
        status: response.status,
        data: response.data || null,
        error: response.error || null,
        seenAt: clkNow()
      };
      clkLog('completed', requestId + ' -> ' + response.status);
    }

    delete suite.pending[requestId];
    if (!suite.acked[requestId]) {
      foundTerminal = clkQueueAck(requestId, 'terminal response') || foundTerminal;
    } else if (Number(suite.ackAttempts[requestId] || 0) < 6) {
      foundTerminal = clkQueueAck(requestId, 'response still present') || foundTerminal;
    }
  }

  if (foundTerminal) clkWriteOut();
}

function clkTextIncludes(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function clkRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.frontierClockSuite.turn, text: String(outputText || '') }];
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

function clkConsumeCommand(kind, outputText, needles) {
  var suite = state.frontierClockSuite;
  suite.consumedCommands = suite.consumedCommands || {};
  var sources = clkRecentSources(outputText);

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!clkTextIncludes(source.text, needles)) continue;
    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;
    suite.consumedCommands[signature] = clkNow();
    return true;
  }
  return false;
}

function clkResetSuite() {
  state.frontierClockSuite = {
    runId: 'clock-' + clkNow().toString(36),
    turn: 0,
    seq: 0,
    outSeq: 0,
    pending: {},
    completed: {},
    acked: {},
    ackAttempts: {},
    events: [],
    consumedCommands: {},
    nowId: null,
    tzId: null,
    formatId: null,
    invalidTzId: null,
    invalidFormatId: null,
    invalidTsId: null,
    phase: 'reset'
  };
  clkWriteCard('frontier:out', JSON.stringify({ v: 1, requests: [], acks: [] }), 'Frontier');
  clkWriteTrace();
}

function clkDrivePlan(outputText) {
  var suite = state.frontierClockSuite;

  if (clkConsumeCommand('reset', outputText, ['clock reset', 'clk reset', '[[clock:reset]]'])) {
    clkResetSuite();
    return;
  }

  if (!clkHasOp('clock', 'now') || !clkHasOp('clock', 'tz') || !clkHasOp('clock', 'format')) {
    suite.phase = 'waiting for clock heartbeat';
    return;
  }

  if (!suite.nowId) {
    suite.phase = 'waiting for now';
    suite.nowId = clkQueueRequest('now', {});
    return;
  }

  if (suite.nowId && suite.completed[suite.nowId] && !suite.tzId) {
    suite.phase = 'waiting for tz';
    suite.tzId = clkQueueRequest('tz', {
      timeZone: 'America/Chicago',
      ts: 0
    });
    return;
  }

  if (suite.tzId && suite.completed[suite.tzId] && !suite.formatId) {
    suite.phase = 'waiting for format';
    suite.formatId = clkQueueRequest('format', {
      ts: 0,
      format: 'YYYY-MM-DD'
    });
    return;
  }

  if (suite.formatId && suite.completed[suite.formatId] && !suite.invalidTzId) {
    suite.phase = 'waiting for invalid timezone';
    suite.invalidTzId = clkQueueRequest('tz', {
      timeZone: 'Mars/Olympus_Mons',
      ts: 0
    });
    return;
  }

  if (suite.invalidTzId && suite.completed[suite.invalidTzId] && !suite.invalidFormatId) {
    suite.phase = 'waiting for invalid format';
    suite.invalidFormatId = clkQueueRequest('format', {
      ts: 0
    });
    return;
  }

  if (suite.invalidFormatId && suite.completed[suite.invalidFormatId] && !suite.invalidTsId) {
    suite.phase = 'waiting for invalid ts';
    suite.invalidTsId = clkQueueRequest('format', {
      ts: 'not-a-real-date',
      format: 'YYYY-MM-DD'
    });
    return;
  }

  suite.phase = clkAllChecksPass() ? 'complete' : 'waiting';
}

function clkValidNowResponse(result) {
  return !!(
    result &&
    typeof result.ts === 'number' &&
    typeof result.iso === 'string' &&
    typeof result.timeZone === 'string' &&
    typeof result.offsetMinutes === 'number' &&
    typeof result.offset === 'string' &&
    typeof result.local === 'string' &&
    typeof result.date === 'string' &&
    typeof result.time === 'string'
  );
}

function clkValidTzResponse(result) {
  return !!(
    result &&
    result.ts === 0 &&
    result.requestedTimeZone === 'America/Chicago' &&
    result.timeZone === 'America/Chicago' &&
    result.date === '1969-12-31' &&
    result.time === '18:00:00' &&
    result.offset === '-06:00'
  );
}

function clkAllChecksPass() {
  var suite = state.frontierClockSuite;
  var now = suite.nowId && suite.completed[suite.nowId];
  var tz = suite.tzId && suite.completed[suite.tzId];
  var format = suite.formatId && suite.completed[suite.formatId];
  var invalidTz = suite.invalidTzId && suite.completed[suite.invalidTzId];
  var invalidFormat = suite.invalidFormatId && suite.completed[suite.invalidFormatId];
  var invalidTs = suite.invalidTsId && suite.completed[suite.invalidTsId];

  return !!(
    clkHasOp('clock', 'now') &&
    clkHasOp('clock', 'tz') &&
    clkHasOp('clock', 'format') &&
    now && now.status === 'ok' && clkValidNowResponse(now.data) &&
    tz && tz.status === 'ok' && clkValidTzResponse(tz.data) &&
    format && format.status === 'ok' && format.data === '1970-01-01' &&
    invalidTz && invalidTz.status === 'err' && invalidTz.error && invalidTz.error.code === 'invalid_args' &&
    invalidFormat && invalidFormat.status === 'err' && invalidFormat.error && invalidFormat.error.code === 'invalid_args' &&
    invalidTs && invalidTs.status === 'err' && invalidTs.error && invalidTs.error.code === 'invalid_args'
  );
}

function clkWriteTrace() {
  var suite = state.frontierClockSuite;
  var trace = {
    v: 1,
    runId: clkRunId(),
    turn: suite.turn,
    liveKey: clkLiveKey(),
    phase: suite.phase,
    heartbeatFull: !!(clkHeartbeat() && clkHeartbeat().frontier && clkHeartbeat().frontier.profile === 'full'),
    clockNowAdvertised: clkHasOp('clock', 'now'),
    clockTzAdvertised: clkHasOp('clock', 'tz'),
    clockFormatAdvertised: clkHasOp('clock', 'format'),
    pendingIds: Object.keys(suite.pending || {}),
    ackedIds: Object.keys(suite.acked || {}),
    ackAttempts: suite.ackAttempts || {},
    completed: suite.completed,
    checksPass: clkAllChecksPass(),
    events: suite.events || []
  };
  clkWriteCard('frontier:test:clock', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function frontierClockStep(outputText) {
  var suite = state.frontierClockSuite;
  clkRunId();
  suite.turn += 1;
  clkPollResponses();
  clkDrivePlan(outputText);
  clkWriteTrace();
  return true;
}
