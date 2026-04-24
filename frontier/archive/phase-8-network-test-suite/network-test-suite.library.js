// Frontier Network Test Suite - AI Dungeon Library
// Paste this entire file into an AI Dungeon scenario Library.
//
// Pair with network-test-suite.output-modifier.js.
//
// The suite writes:
//   frontier:out
//   frontier:test:network

state.frontierNetworkSuite = state.frontierNetworkSuite || {
  runId: null,
  turn: 0,
  seq: 0,
  outSeq: 0,
  pending: {},
  completed: {},
  acked: {},
  ackAttempts: {},
  events: [],
  statusId: null,
  invalidArgsId: null,
  phase: 'boot'
};

function netNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function netRunId() {
  if (!state.frontierNetworkSuite.runId) {
    state.frontierNetworkSuite.runId = 'network-' + netNow().toString(36);
  }
  return state.frontierNetworkSuite.runId;
}

function netCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function netFindCard(title) {
  var cards = netCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function netCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function netReadJson(title) {
  var found = netFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(netCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function netWriteCard(title, value, type) {
  var found = netFindCard(title);
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

function netLiveKey() {
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function netLog(event, detail) {
  var suite = state.frontierNetworkSuite;
  suite.events = suite.events || [];
  suite.events.push({
    at: netNow(),
    turn: suite.turn,
    liveKey: netLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 40) suite.events.shift();
}

function netHeartbeat() {
  return netReadJson('frontier:heartbeat');
}

function netHasOp(moduleId, opName) {
  var heartbeat = netHeartbeat();
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

function netPendingRequestsArray() {
  var suite = state.frontierNetworkSuite;
  var out = [];
  for (var id in suite.pending) {
    if (Object.prototype.hasOwnProperty.call(suite.pending, id)) {
      out.push(suite.pending[id]);
    }
  }
  return out;
}

function netWriteOut() {
  var suite = state.frontierNetworkSuite;
  var payload = {
    v: 1,
    requests: netPendingRequestsArray(),
    acks: suite._acks || [],
    debugSeq: ++suite.outSeq,
    debugWrittenAt: netNow()
  };
  suite._acks = [];
  netWriteCard('frontier:out', JSON.stringify(payload), 'Frontier');
}

function netQueueAck(requestId, reason) {
  var suite = state.frontierNetworkSuite;
  suite._acks = suite._acks || [];
  suite.acked = suite.acked || {};
  suite.ackAttempts = suite.ackAttempts || {};

  var attempts = Number(suite.ackAttempts[requestId] || 0);
  if (attempts >= 6) return false;

  suite.acked[requestId] = true;
  suite.ackAttempts[requestId] = attempts + 1;
  suite._acks.push(requestId);
  netLog(attempts === 0 ? 'ack' : 'ack-retry', requestId + (reason ? ' - ' + reason : ''));
  return true;
}

function netQueueRequest(opName, args) {
  var suite = state.frontierNetworkSuite;
  var id = netLiveKey() + '-network-' + (++suite.seq);
  if (suite.pending[id] || suite.completed[id]) return id;

  suite.pending[id] = {
    id: id,
    module: 'network',
    op: opName,
    args: args || {},
    ts: netNow()
  };
  netLog('queued', id + ' -> network.' + opName);
  netWriteOut();
  return id;
}

function netIsTerminal(response) {
  return response && (response.status === 'ok' || response.status === 'err' || response.status === 'timeout');
}

function netPollResponses() {
  var suite = state.frontierNetworkSuite;
  var card = netReadJson('frontier:in:network');
  var foundTerminal = false;
  if (!card || !card.responses) return;

  for (var requestId in card.responses) {
    if (!Object.prototype.hasOwnProperty.call(card.responses, requestId)) continue;
    var response = card.responses[requestId];
    if (!netIsTerminal(response)) continue;

    if (!suite.completed[requestId]) {
      suite.completed[requestId] = {
        status: response.status,
        data: response.data || null,
        error: response.error || null,
        seenAt: netNow()
      };
      netLog('completed', requestId + ' -> ' + response.status);
    }

    delete suite.pending[requestId];
    if (!suite.acked[requestId]) {
      foundTerminal = netQueueAck(requestId, 'terminal response') || foundTerminal;
    } else if (Number(suite.ackAttempts[requestId] || 0) < 6) {
      foundTerminal = netQueueAck(requestId, 'response still present') || foundTerminal;
    }
  }

  if (foundTerminal) netWriteOut();
}

function netTextIncludes(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function netRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.frontierNetworkSuite.turn, text: String(outputText || '') }];
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

function netConsumeCommand(kind, outputText, needles) {
  var suite = state.frontierNetworkSuite;
  suite.consumedCommands = suite.consumedCommands || {};
  var sources = netRecentSources(outputText);

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!netTextIncludes(source.text, needles)) continue;
    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;
    suite.consumedCommands[signature] = netNow();
    return true;
  }
  return false;
}

function netResetSuite() {
  state.frontierNetworkSuite = {
    runId: 'network-' + netNow().toString(36),
    turn: 0,
    seq: 0,
    outSeq: 0,
    pending: {},
    completed: {},
    acked: {},
    ackAttempts: {},
    events: [],
    consumedCommands: {},
    statusId: null,
    invalidArgsId: null,
    phase: 'reset'
  };
  netWriteCard('frontier:out', JSON.stringify({ v: 1, requests: [], acks: [] }), 'Frontier');
  netWriteTrace();
}

function netDrivePlan(outputText) {
  var suite = state.frontierNetworkSuite;

  if (netConsumeCommand('reset', outputText, ['network reset', 'net reset', '[[network:reset]]'])) {
    netResetSuite();
    return;
  }

  if (!netHasOp('network', 'status')) {
    suite.phase = 'waiting for network heartbeat';
    return;
  }

  if (!suite.statusId) {
    suite.phase = 'waiting for status';
    suite.statusId = netQueueRequest('status', {});
    return;
  }

  if (suite.statusId && suite.completed[suite.statusId] && !suite.invalidArgsId) {
    suite.phase = 'waiting for invalid args';
    suite.invalidArgsId = netQueueRequest('status', 'bad-args');
    return;
  }

  suite.phase = netAllChecksPass() ? 'complete' : 'waiting';
}

function netValidStatusResponse(result) {
  var validQuality = {
    offline: true,
    constrained: true,
    limited: true,
    good: true,
    unknown: true
  };

  return !!(
    result &&
    (typeof result.online === 'boolean' || result.online === null) &&
    validQuality[result.quality] &&
    typeof result.checkedAt === 'number' &&
    typeof result.checkedAtIso === 'string' &&
    typeof result.connectionSupported === 'boolean' &&
    (typeof result.effectiveType === 'string' || result.effectiveType === null) &&
    (typeof result.downlinkMbps === 'number' || result.downlinkMbps === null) &&
    (typeof result.rttMs === 'number' || result.rttMs === null) &&
    (typeof result.saveData === 'boolean' || result.saveData === null)
  );
}

function netAllChecksPass() {
  var suite = state.frontierNetworkSuite;
  var status = suite.statusId && suite.completed[suite.statusId];
  var invalidArgs = suite.invalidArgsId && suite.completed[suite.invalidArgsId];

  return !!(
    netHasOp('network', 'status') &&
    status && status.status === 'ok' && netValidStatusResponse(status.data) &&
    invalidArgs && invalidArgs.status === 'err' && invalidArgs.error && invalidArgs.error.code === 'invalid_args'
  );
}

function netWriteTrace() {
  var suite = state.frontierNetworkSuite;
  var trace = {
    v: 1,
    runId: netRunId(),
    turn: suite.turn,
    liveKey: netLiveKey(),
    phase: suite.phase,
    heartbeatFull: !!(netHeartbeat() && netHeartbeat().frontier && netHeartbeat().frontier.profile === 'full'),
    networkStatusAdvertised: netHasOp('network', 'status'),
    pendingIds: Object.keys(suite.pending || {}),
    ackedIds: Object.keys(suite.acked || {}),
    ackAttempts: suite.ackAttempts || {},
    completed: suite.completed,
    checksPass: netAllChecksPass(),
    events: suite.events || []
  };
  netWriteCard('frontier:test:network', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function frontierNetworkStep(outputText) {
  var suite = state.frontierNetworkSuite;
  netRunId();
  suite.turn += 1;
  netPollResponses();
  netDrivePlan(outputText);
  netWriteTrace();
  return true;
}
