// Frontier Full Protocol Test Suite - AI Dungeon Library
// Paste this entire file into an AI Dungeon scenario Library.
//
// Pair with full-frontier-test-suite.output-modifier.js.
//
// The suite writes:
//   frontier:out
//   frontier:test:full
//
// It expects BetterDungeon Phase 4 to advertise the built-in `test.echo` op.

state.frontierPhase4Suite = state.frontierPhase4Suite || {
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
  echoId: null,
  echoAckWatchId: null,
  echoAckPassed: false,
  unknownOpId: null,
  unknownModuleId: null,
  duplicateId: null,
  delayId: null,
  phase: 'boot'
};

function ffNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function ffRunId() {
  if (!state.frontierPhase4Suite.runId) {
    state.frontierPhase4Suite.runId = 'full-' + ffNow().toString(36);
  }
  return state.frontierPhase4Suite.runId;
}

function ffCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function ffFindCard(title) {
  var cards = ffCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function ffCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function ffReadJson(title) {
  var found = ffFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(ffCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function ffWriteCard(title, value, type) {
  var found = ffFindCard(title);
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

function ffLiveKey() {
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function ffLog(event, detail) {
  var suite = state.frontierPhase4Suite;
  suite.events = suite.events || [];
  suite.events.push({
    at: ffNow(),
    turn: suite.turn,
    liveKey: ffLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 30) suite.events.shift();
}

function ffHeartbeat() {
  return ffReadJson('frontier:heartbeat');
}

function ffHasOp(moduleId, opName) {
  var heartbeat = ffHeartbeat();
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

function ffPendingRequestsArray() {
  var suite = state.frontierPhase4Suite;
  var out = [];
  for (var id in suite.pending) {
    if (Object.prototype.hasOwnProperty.call(suite.pending, id)) {
      out.push(suite.pending[id]);
    }
  }
  return out;
}

function ffWriteOut(extraRequests) {
  var suite = state.frontierPhase4Suite;
  var requests = ffPendingRequestsArray();
  if (Array.isArray(extraRequests)) {
    for (var i = 0; i < extraRequests.length; i++) requests.push(extraRequests[i]);
  }
  var payload = {
    v: 1,
    requests: requests,
    acks: suite._acks || [],
    debugSeq: ++suite.outSeq,
    debugWrittenAt: ffNow()
  };
  suite._acks = [];
  ffWriteCard('frontier:out', JSON.stringify(payload), 'Frontier');
}

function ffQueueAck(requestId, reason) {
  var suite = state.frontierPhase4Suite;
  suite._acks = suite._acks || [];
  suite.acked = suite.acked || {};
  suite.ackAttempts = suite.ackAttempts || {};

  var attempts = Number(suite.ackAttempts[requestId] || 0);
  if (attempts >= 6) return false;

  suite.acked[requestId] = true;
  suite.ackAttempts[requestId] = attempts + 1;
  suite._acks.push(requestId);
  ffLog(attempts === 0 ? 'ack' : 'ack-retry', requestId + (reason ? ' - ' + reason : ''));
  return true;
}

function ffQueueRequest(moduleId, opName, args, fixedId) {
  var suite = state.frontierPhase4Suite;
  var id = fixedId || (ffLiveKey() + '-' + moduleId + '-' + (++suite.seq));
  if (suite.pending[id] || suite.completed[id]) return id;

  suite.pending[id] = {
    id: id,
    module: moduleId,
    op: opName,
    args: args || {},
    ts: ffNow()
  };
  ffLog('queued', id + ' -> ' + moduleId + '.' + opName);
  ffWriteOut();
  return id;
}

function ffQueueDuplicateEcho() {
  var suite = state.frontierPhase4Suite;
  var id = ffLiveKey() + '-test-duplicate';
  var request = {
    id: id,
    module: 'test',
    op: 'echo',
    args: { duplicate: true, runId: ffRunId() },
    ts: ffNow()
  };

  suite.pending[id] = request;
  suite.duplicateId = id;
  ffLog('queued', id + ' twice');
  ffWriteOut([request]);
  return id;
}

function ffIsTerminal(response) {
  return response && (response.status === 'ok' || response.status === 'err' || response.status === 'timeout');
}

function ffPollResponses() {
  var suite = state.frontierPhase4Suite;
  var cards = ffCards();
  var foundTerminal = false;
  suite._acks = suite._acks || [];

  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card || typeof card.title !== 'string') continue;
    if (card.title.indexOf('frontier:in:') !== 0) continue;

    var moduleId = card.title.slice('frontier:in:'.length);
    var parsed = null;
    try {
      parsed = JSON.parse(ffCardText(card) || '{}');
    } catch (err) {
      ffLog('parse-error', card.title);
      continue;
    }

    var responses = parsed && parsed.responses;
    if (!responses || typeof responses !== 'object') continue;

    for (var requestId in responses) {
      if (!Object.prototype.hasOwnProperty.call(responses, requestId)) continue;
      var response = responses[requestId];
      if (!ffIsTerminal(response)) continue;
      if (!suite.completed[requestId]) {
        suite.completed[requestId] = {
          module: moduleId,
          status: response.status,
          data: response.data || null,
          error: response.error || null,
          seenAt: ffNow()
        };
        ffLog('completed', requestId + ' -> ' + response.status);
      }
      delete suite.pending[requestId];
      if (!suite.acked[requestId]) {
        foundTerminal = ffQueueAck(requestId, 'terminal response') || foundTerminal;
      } else if (suite.ackAttempts && Number(suite.ackAttempts[requestId] || 0) < 6) {
        foundTerminal = ffQueueAck(requestId, 'response still present') || foundTerminal;
      }
    }
  }

  if (foundTerminal) ffWriteOut();
}

function ffResponseStillPresent(requestId) {
  var cards = ffCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card || typeof card.title !== 'string') continue;
    if (card.title.indexOf('frontier:in:') !== 0) continue;
    var parsed = null;
    try {
      parsed = JSON.parse(ffCardText(card) || '{}');
    } catch (err) {
      continue;
    }
    if (parsed && parsed.responses && parsed.responses[requestId]) return true;
  }
  return false;
}

function ffTextIncludes(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function ffRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.frontierPhase4Suite.turn, text: String(outputText || '') }];
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

function ffConsumeCommand(kind, outputText, needles) {
  var suite = state.frontierPhase4Suite;
  suite.consumedCommands = suite.consumedCommands || {};
  var sources = ffRecentSources(outputText);

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!ffTextIncludes(source.text, needles)) continue;
    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;
    suite.consumedCommands[signature] = ffNow();
    return true;
  }
  return false;
}

function ffResetSuite() {
  state.frontierPhase4Suite = {
    runId: 'full-' + ffNow().toString(36),
    turn: 0,
    seq: 0,
    outSeq: 0,
    pending: {},
    completed: {},
    acked: {},
    ackAttempts: {},
    events: [],
    consumedCommands: {},
    echoId: null,
    echoAckWatchId: null,
    echoAckPassed: false,
    unknownOpId: null,
    unknownModuleId: null,
    duplicateId: null,
    delayId: null,
    phase: 'reset'
  };
  ffWriteCard('frontier:out', JSON.stringify({ v: 1, requests: [], acks: [] }), 'Frontier');
  ffWriteTrace();
}

function ffDrivePlan(outputText) {
  var suite = state.frontierPhase4Suite;

  if (ffConsumeCommand('reset', outputText, ['ff reset', '[[ff:reset]]'])) {
    ffResetSuite();
    return;
  }

  if (ffConsumeCommand('duplicate', outputText, ['ff duplicate', '[[ff:duplicate]]']) && !suite.duplicateId) {
    ffQueueDuplicateEcho();
  }

  if (ffConsumeCommand('delay', outputText, ['ff delay', '[[ff:delay]]']) && !suite.delayId) {
    suite.phase = 'queue delayed echo';
    suite.delayId = ffQueueRequest('test', 'delayEcho', { delayMs: 15000, runId: ffRunId() });
    return;
  }

  if (!ffHasOp('test', 'echo')) {
    suite.phase = 'waiting for test.echo heartbeat';
    return;
  }

  if (!suite.echoId) {
    suite.phase = 'queue echo';
    suite.echoId = ffQueueRequest('test', 'echo', { hello: 'world', runId: ffRunId() });
    return;
  }

  if (suite.echoId && suite.completed[suite.echoId] && !suite.echoAckWatchId && !suite.echoAckPassed) {
    suite.phase = 'wait echo ack tombstone';
    suite.echoAckWatchId = suite.echoId;
    return;
  }

  if (suite.echoAckWatchId && !ffResponseStillPresent(suite.echoAckWatchId)) {
    suite.echoAckPassed = true;
    suite.echoAckWatchId = null;
    ffLog('passed', 'echo ack tombstone');
  }

  if (suite.echoAckPassed && !suite.unknownOpId) {
    suite.phase = 'queue unknown op';
    suite.unknownOpId = ffQueueRequest('test', 'missingOp', { runId: ffRunId() });
    return;
  }

  if (suite.unknownOpId && suite.completed[suite.unknownOpId] && !suite.unknownModuleId) {
    suite.phase = 'queue unknown module';
    suite.unknownModuleId = ffQueueRequest('missingmodule', 'echo', { runId: ffRunId() });
    return;
  }

  if (suite.unknownModuleId && suite.completed[suite.unknownModuleId] && !suite.duplicateId) {
    suite.phase = 'queue duplicate id';
    ffQueueDuplicateEcho();
    return;
  }

  suite.phase = ffAllChecksPass() ? 'complete' : 'waiting';
}

function ffAllChecksPass() {
  var suite = state.frontierPhase4Suite;
  var echo = suite.echoId && suite.completed[suite.echoId];
  var unknownOp = suite.unknownOpId && suite.completed[suite.unknownOpId];
  var unknownModule = suite.unknownModuleId && suite.completed[suite.unknownModuleId];
  var duplicate = suite.duplicateId && suite.completed[suite.duplicateId];

  return !!(
    ffHasOp('test', 'echo') &&
    echo && echo.status === 'ok' && echo.data && echo.data.got && echo.data.got.hello === 'world' &&
    suite.echoAckPassed &&
    unknownOp && unknownOp.status === 'err' && unknownOp.error && unknownOp.error.code === 'unknown_op' &&
    unknownModule && unknownModule.status === 'err' && unknownModule.error && unknownModule.error.code === 'unknown_module' &&
    duplicate && duplicate.status === 'ok'
  );
}

function ffWriteTrace() {
  var suite = state.frontierPhase4Suite;
  var outCard = ffReadJson('frontier:out');
  var trace = {
    v: 1,
    runId: ffRunId(),
    turn: suite.turn,
    liveKey: ffLiveKey(),
    phase: suite.phase,
    heartbeatFull: !!(ffHeartbeat() && ffHeartbeat().frontier && ffHeartbeat().frontier.profile === 'full'),
    testEchoAdvertised: ffHasOp('test', 'echo'),
    pendingIds: Object.keys(suite.pending || {}),
    ackedIds: Object.keys(suite.acked || {}),
    ackAttempts: suite.ackAttempts || {},
    outCardAcks: outCard && Array.isArray(outCard.acks) ? outCard.acks : [],
    outCardDebugSeq: outCard && outCard.debugSeq,
    echoAckWatchId: suite.echoAckWatchId,
    echoAckPassed: !!suite.echoAckPassed,
    echoResponseStillPresent: suite.echoId ? ffResponseStillPresent(suite.echoId) : null,
    completed: suite.completed,
    checksPass: ffAllChecksPass(),
    events: suite.events || []
  };
  ffWriteCard('frontier:test:full', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function frontierPhase4Step(outputText) {
  var suite = state.frontierPhase4Suite;
  ffRunId();
  suite.turn += 1;
  ffPollResponses();
  ffDrivePlan(outputText);
  ffWriteTrace();
  return true;
}
