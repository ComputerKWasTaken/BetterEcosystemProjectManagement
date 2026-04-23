// Frontier Weather Test Suite - AI Dungeon Library
// Paste this entire file into an AI Dungeon scenario Library.
//
// Pair with weather-test-suite.output-modifier.js.
//
// The suite writes:
//   frontier:out
//   frontier:test:weather

state.frontierWeatherSuite = state.frontierWeatherSuite || {
  runId: null,
  turn: 0,
  seq: 0,
  outSeq: 0,
  pending: {},
  completed: {},
  acked: {},
  ackAttempts: {},
  events: [],
  currentId: null,
  forecastId: null,
  missingLocationId: null,
  invalidUnitsId: null,
  invalidLatitudeId: null,
  phase: 'boot'
};

function wthrNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function wthrRunId() {
  if (!state.frontierWeatherSuite.runId) {
    state.frontierWeatherSuite.runId = 'weather-' + wthrNow().toString(36);
  }
  return state.frontierWeatherSuite.runId;
}

function wthrCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function wthrFindCard(title) {
  var cards = wthrCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function wthrCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function wthrReadJson(title) {
  var found = wthrFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(wthrCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function wthrWriteCard(title, value, type) {
  var found = wthrFindCard(title);
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

function wthrLiveKey() {
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function wthrLog(event, detail) {
  var suite = state.frontierWeatherSuite;
  suite.events = suite.events || [];
  suite.events.push({
    at: wthrNow(),
    turn: suite.turn,
    liveKey: wthrLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 40) suite.events.shift();
}

function wthrHeartbeat() {
  return wthrReadJson('frontier:heartbeat');
}

function wthrHasOp(moduleId, opName) {
  var heartbeat = wthrHeartbeat();
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

function wthrPendingRequestsArray() {
  var suite = state.frontierWeatherSuite;
  var out = [];
  for (var id in suite.pending) {
    if (Object.prototype.hasOwnProperty.call(suite.pending, id)) {
      out.push(suite.pending[id]);
    }
  }
  return out;
}

function wthrWriteOut() {
  var suite = state.frontierWeatherSuite;
  var payload = {
    v: 1,
    requests: wthrPendingRequestsArray(),
    acks: suite._acks || [],
    debugSeq: ++suite.outSeq,
    debugWrittenAt: wthrNow()
  };
  suite._acks = [];
  wthrWriteCard('frontier:out', JSON.stringify(payload), 'Frontier');
}

function wthrQueueAck(requestId, reason) {
  var suite = state.frontierWeatherSuite;
  suite._acks = suite._acks || [];
  suite.acked = suite.acked || {};
  suite.ackAttempts = suite.ackAttempts || {};

  var attempts = Number(suite.ackAttempts[requestId] || 0);
  if (attempts >= 6) return false;

  suite.acked[requestId] = true;
  suite.ackAttempts[requestId] = attempts + 1;
  suite._acks.push(requestId);
  wthrLog(attempts === 0 ? 'ack' : 'ack-retry', requestId + (reason ? ' - ' + reason : ''));
  return true;
}

function wthrQueueRequest(opName, args) {
  var suite = state.frontierWeatherSuite;
  var id = wthrLiveKey() + '-weather-' + (++suite.seq);
  if (suite.pending[id] || suite.completed[id]) return id;

  suite.pending[id] = {
    id: id,
    module: 'weather',
    op: opName,
    args: args || {},
    ts: wthrNow()
  };
  wthrLog('queued', id + ' -> weather.' + opName);
  wthrWriteOut();
  return id;
}

function wthrIsTerminal(response) {
  return response && (response.status === 'ok' || response.status === 'err' || response.status === 'timeout');
}

function wthrPollResponses() {
  var suite = state.frontierWeatherSuite;
  var card = wthrReadJson('frontier:in:weather');
  var foundTerminal = false;
  if (!card || !card.responses) return;

  for (var requestId in card.responses) {
    if (!Object.prototype.hasOwnProperty.call(card.responses, requestId)) continue;
    var response = card.responses[requestId];
    if (!wthrIsTerminal(response)) continue;

    if (!suite.completed[requestId]) {
      suite.completed[requestId] = {
        status: response.status,
        data: response.data || null,
        error: response.error || null,
        seenAt: wthrNow()
      };
      wthrLog('completed', requestId + ' -> ' + response.status);
    }

    delete suite.pending[requestId];
    if (!suite.acked[requestId]) {
      foundTerminal = wthrQueueAck(requestId, 'terminal response') || foundTerminal;
    } else if (Number(suite.ackAttempts[requestId] || 0) < 6) {
      foundTerminal = wthrQueueAck(requestId, 'response still present') || foundTerminal;
    }
  }

  if (foundTerminal) wthrWriteOut();
}

function wthrTextIncludes(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function wthrRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.frontierWeatherSuite.turn, text: String(outputText || '') }];
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

function wthrConsumeCommand(kind, outputText, needles) {
  var suite = state.frontierWeatherSuite;
  suite.consumedCommands = suite.consumedCommands || {};
  var sources = wthrRecentSources(outputText);

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!wthrTextIncludes(source.text, needles)) continue;
    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;
    suite.consumedCommands[signature] = wthrNow();
    return true;
  }
  return false;
}

function wthrResetSuite() {
  state.frontierWeatherSuite = {
    runId: 'weather-' + wthrNow().toString(36),
    turn: 0,
    seq: 0,
    outSeq: 0,
    pending: {},
    completed: {},
    acked: {},
    ackAttempts: {},
    events: [],
    consumedCommands: {},
    currentId: null,
    forecastId: null,
    missingLocationId: null,
    invalidUnitsId: null,
    invalidLatitudeId: null,
    phase: 'reset'
  };
  wthrWriteCard('frontier:out', JSON.stringify({ v: 1, requests: [], acks: [] }), 'Frontier');
  wthrWriteTrace();
}

function wthrDrivePlan(outputText) {
  var suite = state.frontierWeatherSuite;

  if (wthrConsumeCommand('reset', outputText, ['weather reset', 'wthr reset', '[[weather:reset]]'])) {
    wthrResetSuite();
    return;
  }

  if (!wthrHasOp('weather', 'current') || !wthrHasOp('weather', 'forecast')) {
    suite.phase = 'waiting for weather heartbeat';
    return;
  }

  if (!suite.currentId) {
    suite.phase = 'waiting for current weather';
    suite.currentId = wthrQueueRequest('current', {
      place: 'Houston',
      units: 'imperial',
      timeoutMs: 15000
    });
    return;
  }

  if (suite.currentId && suite.completed[suite.currentId] && !suite.forecastId) {
    suite.phase = 'waiting for forecast';
    suite.forecastId = wthrQueueRequest('forecast', {
      latitude: 29.7604,
      longitude: -95.3698,
      days: 2,
      units: 'imperial',
      timeoutMs: 15000
    });
    return;
  }

  if (suite.forecastId && suite.completed[suite.forecastId] && !suite.missingLocationId) {
    suite.phase = 'waiting for missing location';
    suite.missingLocationId = wthrQueueRequest('current', {});
    return;
  }

  if (suite.missingLocationId && suite.completed[suite.missingLocationId] && !suite.invalidUnitsId) {
    suite.phase = 'waiting for invalid units';
    suite.invalidUnitsId = wthrQueueRequest('forecast', {
      place: 'Houston',
      units: 'kelvin'
    });
    return;
  }

  if (suite.invalidUnitsId && suite.completed[suite.invalidUnitsId] && !suite.invalidLatitudeId) {
    suite.phase = 'waiting for invalid latitude';
    suite.invalidLatitudeId = wthrQueueRequest('current', {
      latitude: 999,
      longitude: -95.3698
    });
    return;
  }

  suite.phase = wthrAllChecksPass() ? 'complete' : 'waiting';
}

function wthrValidCurrentResponse(result) {
  return !!(
    result &&
    result.source === 'open-meteo' &&
    result.units === 'imperial' &&
    result.location &&
    typeof result.location.latitude === 'number' &&
    typeof result.location.longitude === 'number' &&
    typeof result.location.timezone === 'string' &&
    result.current &&
    typeof result.current.observedAt === 'string' &&
    typeof result.current.weather === 'string' &&
    typeof result.current.weatherCode === 'number' &&
    typeof result.current.temperature === 'number'
  );
}

function wthrValidForecastResponse(result) {
  return !!(
    result &&
    result.source === 'open-meteo' &&
    result.units === 'imperial' &&
    result.location &&
    typeof result.location.latitude === 'number' &&
    typeof result.location.longitude === 'number' &&
    Array.isArray(result.days) &&
    result.days.length === 2 &&
    result.days[0] &&
    typeof result.days[0].date === 'string' &&
    typeof result.days[0].weather === 'string'
  );
}

function wthrAllChecksPass() {
  var suite = state.frontierWeatherSuite;
  var current = suite.currentId && suite.completed[suite.currentId];
  var forecast = suite.forecastId && suite.completed[suite.forecastId];
  var missingLocation = suite.missingLocationId && suite.completed[suite.missingLocationId];
  var invalidUnits = suite.invalidUnitsId && suite.completed[suite.invalidUnitsId];
  var invalidLatitude = suite.invalidLatitudeId && suite.completed[suite.invalidLatitudeId];

  return !!(
    wthrHasOp('weather', 'current') &&
    wthrHasOp('weather', 'forecast') &&
    current && current.status === 'ok' && wthrValidCurrentResponse(current.data) &&
    forecast && forecast.status === 'ok' && wthrValidForecastResponse(forecast.data) &&
    missingLocation && missingLocation.status === 'err' && missingLocation.error && missingLocation.error.code === 'invalid_args' &&
    invalidUnits && invalidUnits.status === 'err' && invalidUnits.error && invalidUnits.error.code === 'invalid_args' &&
    invalidLatitude && invalidLatitude.status === 'err' && invalidLatitude.error && invalidLatitude.error.code === 'invalid_args'
  );
}

function wthrWriteTrace() {
  var suite = state.frontierWeatherSuite;
  var trace = {
    v: 1,
    runId: wthrRunId(),
    turn: suite.turn,
    liveKey: wthrLiveKey(),
    phase: suite.phase,
    heartbeatFull: !!(wthrHeartbeat() && wthrHeartbeat().frontier && wthrHeartbeat().frontier.profile === 'full'),
    weatherCurrentAdvertised: wthrHasOp('weather', 'current'),
    weatherForecastAdvertised: wthrHasOp('weather', 'forecast'),
    pendingIds: Object.keys(suite.pending || {}),
    ackedIds: Object.keys(suite.acked || {}),
    ackAttempts: suite.ackAttempts || {},
    completed: suite.completed,
    checksPass: wthrAllChecksPass(),
    events: suite.events || []
  };
  wthrWriteCard('frontier:test:weather', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function frontierWeatherStep(outputText) {
  var suite = state.frontierWeatherSuite;
  wthrRunId();
  suite.turn += 1;
  wthrPollResponses();
  wthrDrivePlan(outputText);
  wthrWriteTrace();
  return true;
}
