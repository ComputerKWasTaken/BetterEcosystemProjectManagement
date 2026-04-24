// Frontier System Test Suite - AI Dungeon Library
// Paste this entire file into an AI Dungeon scenario Library.
//
// Pair with system-test-suite.output-modifier.js.
//
// The suite writes:
//   frontier:out
//   frontier:test:system

state.frontierSystemSuite = state.frontierSystemSuite || {
  runId: null,
  turn: 0,
  seq: 0,
  outSeq: 0,
  pending: {},
  completed: {},
  acked: {},
  ackAttempts: {},
  events: [],
  infoId: null,
  powerId: null,
  invalidArgsId: null,
  phase: 'boot'
};

function sysNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function sysRunId() {
  if (!state.frontierSystemSuite.runId) {
    state.frontierSystemSuite.runId = 'system-' + sysNow().toString(36);
  }
  return state.frontierSystemSuite.runId;
}

function sysCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function sysFindCard(title) {
  var cards = sysCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function sysCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function sysReadJson(title) {
  var found = sysFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(sysCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function sysWriteCard(title, value, type) {
  var found = sysFindCard(title);
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

function sysLiveKey() {
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function sysLog(event, detail) {
  var suite = state.frontierSystemSuite;
  suite.events = suite.events || [];
  suite.events.push({
    at: sysNow(),
    turn: suite.turn,
    liveKey: sysLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 40) suite.events.shift();
}

function sysHeartbeat() {
  return sysReadJson('frontier:heartbeat');
}

function sysHasOp(moduleId, opName) {
  var heartbeat = sysHeartbeat();
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

function sysPendingRequestsArray() {
  var suite = state.frontierSystemSuite;
  var out = [];
  for (var id in suite.pending) {
    if (Object.prototype.hasOwnProperty.call(suite.pending, id)) {
      out.push(suite.pending[id]);
    }
  }
  return out;
}

function sysWriteOut() {
  var suite = state.frontierSystemSuite;
  var payload = {
    v: 1,
    requests: sysPendingRequestsArray(),
    acks: suite._acks || [],
    debugSeq: ++suite.outSeq,
    debugWrittenAt: sysNow()
  };
  suite._acks = [];
  sysWriteCard('frontier:out', JSON.stringify(payload), 'Frontier');
}

function sysQueueAck(requestId, reason) {
  var suite = state.frontierSystemSuite;
  suite._acks = suite._acks || [];
  suite.acked = suite.acked || {};
  suite.ackAttempts = suite.ackAttempts || {};

  var attempts = Number(suite.ackAttempts[requestId] || 0);
  if (attempts >= 6) return false;

  suite.acked[requestId] = true;
  suite.ackAttempts[requestId] = attempts + 1;
  suite._acks.push(requestId);
  sysLog(attempts === 0 ? 'ack' : 'ack-retry', requestId + (reason ? ' - ' + reason : ''));
  return true;
}

function sysQueueRequest(opName, args) {
  var suite = state.frontierSystemSuite;
  var id = sysLiveKey() + '-system-' + (++suite.seq);
  if (suite.pending[id] || suite.completed[id]) return id;

  suite.pending[id] = {
    id: id,
    module: 'system',
    op: opName,
    args: args === undefined ? {} : args,
    ts: sysNow()
  };
  sysLog('queued', id + ' -> system.' + opName);
  sysWriteOut();
  return id;
}

function sysIsTerminal(response) {
  return response && (response.status === 'ok' || response.status === 'err' || response.status === 'timeout');
}

function sysPollResponses() {
  var suite = state.frontierSystemSuite;
  var card = sysReadJson('frontier:in:system');
  var foundTerminal = false;
  if (!card || !card.responses) return;

  for (var requestId in card.responses) {
    if (!Object.prototype.hasOwnProperty.call(card.responses, requestId)) continue;
    var response = card.responses[requestId];
    if (!sysIsTerminal(response)) continue;

    if (!suite.completed[requestId]) {
      suite.completed[requestId] = {
        status: response.status,
        data: response.data || null,
        error: response.error || null,
        seenAt: sysNow()
      };
      sysLog('completed', requestId + ' -> ' + response.status);
    }

    delete suite.pending[requestId];
    if (!suite.acked[requestId]) {
      foundTerminal = sysQueueAck(requestId, 'terminal response') || foundTerminal;
    } else if (Number(suite.ackAttempts[requestId] || 0) < 6) {
      foundTerminal = sysQueueAck(requestId, 'response still present') || foundTerminal;
    }
  }

  if (foundTerminal) sysWriteOut();
}

function sysTextIncludes(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function sysRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.frontierSystemSuite.turn, text: String(outputText || '') }];
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

function sysConsumeCommand(kind, outputText, needles) {
  var suite = state.frontierSystemSuite;
  suite.consumedCommands = suite.consumedCommands || {};
  var sources = sysRecentSources(outputText);

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!sysTextIncludes(source.text, needles)) continue;
    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;
    suite.consumedCommands[signature] = sysNow();
    return true;
  }
  return false;
}

function sysResetSuite() {
  state.frontierSystemSuite = {
    runId: 'system-' + sysNow().toString(36),
    turn: 0,
    seq: 0,
    outSeq: 0,
    pending: {},
    completed: {},
    acked: {},
    ackAttempts: {},
    events: [],
    consumedCommands: {},
    infoId: null,
    powerId: null,
    invalidArgsId: null,
    phase: 'reset'
  };
  sysWriteCard('frontier:out', JSON.stringify({ v: 1, requests: [], acks: [] }), 'Frontier');
  sysWriteTrace();
}

function sysDrivePlan(outputText) {
  var suite = state.frontierSystemSuite;

  if (sysConsumeCommand('reset', outputText, ['system reset', 'sys reset', '[[system:reset]]'])) {
    sysResetSuite();
    return;
  }

  if (!sysHasOp('system', 'info') || !sysHasOp('system', 'power')) {
    suite.phase = 'waiting for system heartbeat';
    return;
  }

  if (!suite.infoId) {
    suite.phase = 'waiting for info';
    suite.infoId = sysQueueRequest('info', {});
    return;
  }

  if (suite.infoId && suite.completed[suite.infoId] && !suite.powerId) {
    suite.phase = 'waiting for power';
    suite.powerId = sysQueueRequest('power', {});
    return;
  }

  if (suite.powerId && suite.completed[suite.powerId] && !suite.invalidArgsId) {
    suite.phase = 'waiting for invalid args';
    suite.invalidArgsId = sysQueueRequest('info', 'bad-args');
    return;
  }

  suite.phase = sysAllChecksPass() ? 'complete' : 'waiting';
}

function sysValidInfoResponse(result) {
  var validDeviceClass = {
    desktop: true,
    tablet: true,
    mobile: true,
    unknown: true
  };

  return !!(
    result &&
    typeof result.checkedAt === 'number' &&
    typeof result.checkedAtIso === 'string' &&
    validDeviceClass[result.deviceClass] &&
    result.platform && typeof result.platform.family === 'string' &&
    result.browser && typeof result.browser.name === 'string' &&
    result.locale && (typeof result.locale.language === 'string' || result.locale.language === null) &&
    result.screen && (typeof result.screen.width === 'number' || result.screen.width === null) &&
    result.hardware && (typeof result.hardware.logicalCores === 'number' || result.hardware.logicalCores === null) &&
    result.preferences &&
    result.extension && typeof result.extension.available === 'boolean'
  );
}

function sysValidPowerResponse(result) {
  if (!result || typeof result.supported !== 'boolean') return false;
  if (typeof result.checkedAt !== 'number' || typeof result.checkedAtIso !== 'string') return false;
  if (!result.supported) return true;

  return !!(
    (typeof result.charging === 'boolean' || result.charging === null) &&
    typeof result.state === 'string' &&
    (typeof result.level === 'number' || result.level === null) &&
    (typeof result.levelPercent === 'number' || result.levelPercent === null) &&
    (typeof result.chargingTimeSec === 'number' || result.chargingTimeSec === null) &&
    (typeof result.dischargingTimeSec === 'number' || result.dischargingTimeSec === null)
  );
}

function sysAllChecksPass() {
  var suite = state.frontierSystemSuite;
  var info = suite.infoId && suite.completed[suite.infoId];
  var power = suite.powerId && suite.completed[suite.powerId];
  var invalidArgs = suite.invalidArgsId && suite.completed[suite.invalidArgsId];

  return !!(
    sysHasOp('system', 'info') &&
    sysHasOp('system', 'power') &&
    info && info.status === 'ok' && sysValidInfoResponse(info.data) &&
    power && power.status === 'ok' && sysValidPowerResponse(power.data) &&
    invalidArgs && invalidArgs.status === 'err' && invalidArgs.error && invalidArgs.error.code === 'invalid_args'
  );
}

function sysWriteTrace() {
  var suite = state.frontierSystemSuite;
  var trace = {
    v: 1,
    runId: sysRunId(),
    turn: suite.turn,
    liveKey: sysLiveKey(),
    phase: suite.phase,
    heartbeatFull: !!(sysHeartbeat() && sysHeartbeat().frontier && sysHeartbeat().frontier.profile === 'full'),
    systemInfoAdvertised: sysHasOp('system', 'info'),
    systemPowerAdvertised: sysHasOp('system', 'power'),
    pendingIds: Object.keys(suite.pending || {}),
    ackedIds: Object.keys(suite.acked || {}),
    ackAttempts: suite.ackAttempts || {},
    completed: suite.completed,
    checksPass: sysAllChecksPass(),
    events: suite.events || []
  };
  sysWriteCard('frontier:test:system', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function frontierSystemStep(outputText) {
  var suite = state.frontierSystemSuite;
  sysRunId();
  suite.turn += 1;
  sysPollResponses();
  sysDrivePlan(outputText);
  sysWriteTrace();
  return true;
}
