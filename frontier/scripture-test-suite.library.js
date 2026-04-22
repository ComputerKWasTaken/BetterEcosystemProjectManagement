// Frontier Scripture Test Suite - AI Dungeon Library
// Paste this entire file into an AI Dungeon scenario Library.
//
// Pair with scripture-test-suite.output-modifier.js.
//
// The suite writes:
//   frontier:state:scripture
//   frontier:test:scripture
//
// It intentionally uses only AI Dungeon script primitives: state, history,
// storyCards, addStoryCard, and updateStoryCard.

state.frontier = state.frontier || {};
state.scriptureSuite = state.scriptureSuite || {
  runId: null,
  turn: 0,
  hp: 100,
  mana: 50,
  gold: 0,
  status: 'Booting',
  phase: 'boot',
  lastLiveKey: null,
  historyLimit: 80,
  events: [],
  consumedCommands: {},
  malformedArmed: false,
  sanitizerArmed: false,
  manifestResetArmed: false
};

function frontierSuiteNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function frontierSuiteRunId() {
  if (!state.scriptureSuite.runId) {
    state.scriptureSuite.runId = 'scr-' + frontierSuiteNow().toString(36);
  }
  return state.scriptureSuite.runId;
}

function frontierSuiteCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function frontierSuiteFindCard(title) {
  var cards = frontierSuiteCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function frontierSuiteCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function frontierSuiteReadJson(title) {
  var found = frontierSuiteFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(frontierSuiteCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function frontierSuiteWriteCard(title, value, type) {
  var found = frontierSuiteFindCard(title);
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

function frontierSuiteLiveKey() {
  // Output Modifier runs while the current AI output is being produced.
  // The state should be keyed to the live-count after this output lands.
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function frontierSuiteHistoryOrder(name) {
  state.frontier._historyOrder = state.frontier._historyOrder || {};
  state.frontier._historyOrder[name] = state.frontier._historyOrder[name] || [];
  return state.frontier._historyOrder[name];
}

function frontierSuiteUpdateHistory(name, values, manifest, historyLimit) {
  var title = 'frontier:state:' + name;
  var liveKey = frontierSuiteLiveKey();
  var limit = Number(historyLimit || 80);
  var existing = frontierSuiteReadJson(title) || { v: 1, manifest: {}, history: {} };

  existing.v = 1;
  existing.manifest = manifest || existing.manifest || {};
  existing.history = existing.history || {};
  existing.history[liveKey] = values || {};
  existing.historyLimit = limit;

  var order = frontierSuiteHistoryOrder(name);
  if (order.indexOf(liveKey) === -1) order.push(liveKey);

  while (order.length > limit) {
    var drop = order.shift();
    delete existing.history[String(drop)];
  }

  state.scriptureSuite.lastLiveKey = liveKey;
  return frontierSuiteWriteCard(title, JSON.stringify(existing), 'Frontier');
}

function frontierSuiteHeartbeat() {
  return frontierSuiteReadJson('frontier:heartbeat');
}

function frontierSuiteHeartbeatHasScripture() {
  var heartbeat = frontierSuiteHeartbeat();
  var modules = heartbeat && heartbeat.modules;
  if (!Array.isArray(modules)) return false;
  for (var i = 0; i < modules.length; i++) {
    if (modules[i] && modules[i].id === 'scripture') return true;
  }
  return false;
}

function frontierSuiteLog(event, detail) {
  var suite = state.scriptureSuite;
  suite.events = suite.events || [];
  suite.events.push({
    at: frontierSuiteNow(),
    turn: suite.turn,
    liveKey: frontierSuiteLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 20) suite.events.shift();
}

function frontierSuiteTextIncludesNeedle(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function frontierSuiteRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.scriptureSuite.turn, text: String(outputText || '') }];
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

function frontierSuiteConsumeTrigger(kind, outputText, needles) {
  var suite = state.scriptureSuite;
  suite.consumedCommands = suite.consumedCommands || {};

  var sources = frontierSuiteRecentSources(outputText);
  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!frontierSuiteTextIncludesNeedle(source.text, needles)) continue;

    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;

    suite.consumedCommands[signature] = frontierSuiteNow();
    var keys = Object.keys(suite.consumedCommands);
    while (keys.length > 30) {
      delete suite.consumedCommands[keys.shift()];
    }
    return true;
  }

  return false;
}

function frontierSuiteArmFromText(text) {
  var suite = state.scriptureSuite;
  if (frontierSuiteConsumeTrigger('malformed', text, ['[[scr:malformed]]', 'scr malformed'])) {
    suite.malformedArmed = true;
    frontierSuiteLog('armed', 'malformed state card on next output');
  }
  if (frontierSuiteConsumeTrigger('sanitize', text, ['[[scr:sanitize]]', 'scr sanitize'])) {
    suite.sanitizerArmed = true;
    frontierSuiteLog('armed', 'sanitizer fixture on next output');
  }
  if (frontierSuiteConsumeTrigger('reset', text, ['[[scr:reset]]', 'scr reset'])) {
    suite.manifestResetArmed = true;
    frontierSuiteLog('armed', 'manifest reset sequence on next output');
  }
}

function frontierSuiteWidgetManifest() {
  return {
    widgets: [
      { id: 'suite-title', type: 'badge', label: 'Scripture Suite', color: '#38bdf8', variant: 'outline', align: 'left', order: 1 },
      { id: 'frontier', type: 'badge', label: 'Frontier', color: '#22c55e', align: 'left', order: 2 },
      { id: 'live-key', type: 'stat', label: 'Live Key', color: 'cyan', align: 'left', order: 3 },
      { id: 'turn', type: 'counter', icon: '#', color: '#facc15', align: 'left', order: 4 },
      { id: 'hp', type: 'bar', label: 'HP', max: 100, color: 'green', align: 'center', order: 5 },
      { id: 'mana', type: 'bar', label: 'Mana', max: 50, color: 'blue', align: 'center', order: 6 },
      { id: 'gold', type: 'stat', label: 'Gold', color: 'yellow', align: 'center', order: 7 },
      { id: 'status', type: 'badge', label: 'Status', color: '#22c55e', variant: 'subtle', align: 'right', order: 8 },
      { id: 'phase', type: 'text', text: 'phase', color: '#c4b5fd', align: 'right', order: 9 },
      { id: 'panel-fixture', type: 'panel', title: 'Panel', items: [], align: 'right', order: 10 },
      { id: 'pack', type: 'list', title: 'Checks', items: [], align: 'right', order: 11 },
      { id: 'custom-safe', type: 'custom', html: '<strong>safe</strong>', align: 'right', order: 12 },
      { id: 'icon-reset', type: 'icon', icon: '*', color: '#f97316', size: 22, tooltip: 'Reset fixture', align: 'right', order: 13 }
    ]
  };
}

function frontierSuiteManifestWithResetVariant() {
  return {
    widgets: [
      { id: 'reset-sentinel', type: 'badge', label: 'RESET ACTIVE', color: '#ef4444', variant: 'solid', align: 'left', order: 0 },
      { id: 'suite-title', type: 'badge', label: 'Reset Variant', align: 'left', order: 1 },
      { id: 'frontier', type: 'badge', label: 'Frontier', align: 'left', order: 2 },
      { id: 'live-key', type: 'stat', label: 'Live Key', align: 'left', order: 3 },
      { id: 'turn', type: 'counter', align: 'left', order: 4 },
      { id: 'hp', type: 'bar', label: 'HP', max: 100, align: 'center', order: 5 },
      { id: 'mana', type: 'bar', label: 'Mana', max: 50, align: 'center', order: 6 },
      { id: 'gold', type: 'stat', label: 'Gold', align: 'center', order: 7 },
      { id: 'status', type: 'badge', label: 'Status', align: 'right', order: 8 },
      { id: 'phase', type: 'text', text: 'reset variant', align: 'right', order: 9 },
      { id: 'panel-fixture', type: 'panel', items: [], align: 'right', order: 10 },
      { id: 'pack', type: 'list', items: [], align: 'right', order: 11 },
      { id: 'custom-safe', type: 'custom', html: '<em>styles reset</em>', align: 'right', order: 12 },
      { id: 'icon-reset', type: 'icon', text: 'R', align: 'right', order: 13 }
    ]
  };
}

function frontierSuiteValues() {
  var suite = state.scriptureSuite;
  var hasScripture = frontierSuiteHeartbeatHasScripture();
  var phase = suite.phase;
  var statusColor = hasScripture ? '#22c55e' : '#ef4444';

  if (suite.hp <= 20) {
    suite.status = 'Critical';
    statusColor = '#ef4444';
  } else if (suite.hp <= 50) {
    suite.status = 'Wounded';
    statusColor = '#f59e0b';
  } else if (!hasScripture) {
    suite.status = 'No heartbeat';
  } else {
    suite.status = 'Stable';
  }

  var checks = [
    { icon: hasScripture ? 'OK' : 'NO', text: 'Heartbeat scripture module', color: hasScripture ? '#22c55e' : '#ef4444' },
    { icon: 'LC', text: 'Undo should revert live key ' + frontierSuiteLiveKey() },
    { icon: 'RT', text: 'Retry should overwrite this key' },
    { icon: 'RF', text: 'Refresh should rehydrate from card' }
  ];

  var customHtml = '<strong>Safe HTML</strong><br><span style="color: #9ca3af;">Run ' +
    frontierSuiteRunId() + '</span>';

  if (phase === 'reset') {
    checks = [
      { icon: 'RS', text: 'Reset manifest is active' },
      { icon: 'CL', text: 'Colors, variants, titles, sizes cleared' },
      { icon: 'NX', text: 'Next output restores normal manifest' }
    ];
    return {
      'reset-sentinel': 'RESET ACTIVE',
      'suite-title': 'Reset Variant',
      frontier: hasScripture ? 'Frontier OK' : 'No Frontier',
      'live-key': frontierSuiteLiveKey(),
      turn: suite.turn,
      hp: suite.hp,
      mana: suite.mana,
      gold: suite.gold,
      status: 'RESET',
      phase: 'phase: RESET ACTIVE',
      'panel-fixture': {
        items: [
          { label: 'Phase', value: 'reset' },
          { label: 'Key', value: frontierSuiteLiveKey() }
        ]
      },
      pack: { items: checks },
      'custom-safe': { html: '<em>RESET ACTIVE - styles cleared</em>' },
      'icon-reset': 'R',
      'icon-reset__progress': suite.turn % 2
    };
  }

  if (suite.sanitizerArmed) {
    phase = 'sanitizer';
    customHtml = '<strong>Sanitizer</strong> <script>window.__scrBad=1</script>' +
      '<img src="javascript:alert(1)" onerror="window.__scrBad=2">' +
      '<span style="color: #22c55e; background-image: url(javascript:bad)">safe text</span>';
  }

  return {
    'suite-title': 'Scripture Suite',
    frontier: hasScripture ? 'Frontier OK' : 'No Frontier',
    'live-key': frontierSuiteLiveKey(),
    turn: suite.turn,
    hp: suite.hp,
    mana: suite.mana,
    gold: suite.gold,
    status: suite.status,
    phase: 'phase: ' + phase,
    'panel-fixture': {
      title: 'Panel',
      items: [
        { label: 'Run', value: frontierSuiteRunId(), color: '#38bdf8' },
        { label: 'Phase', value: phase, color: '#c4b5fd' },
        { label: 'Key', value: frontierSuiteLiveKey(), color: '#facc15' }
      ]
    },
    pack: { items: checks },
    'custom-safe': { html: customHtml },
    'icon-reset': phase === 'reset' ? 'R' : '*',
    'icon-reset__progress': suite.turn % 2
  };
}

function frontierSuiteWriteTrace() {
  var suite = state.scriptureSuite;
  var trace = {
    v: 1,
    runId: frontierSuiteRunId(),
    turn: suite.turn,
    liveKey: frontierSuiteLiveKey(),
    lastLiveKey: suite.lastLiveKey,
    hp: suite.hp,
    mana: suite.mana,
    gold: suite.gold,
    phase: suite.phase,
    heartbeatHasScripture: frontierSuiteHeartbeatHasScripture(),
    events: suite.events || []
  };
  frontierSuiteWriteCard('frontier:test:scripture', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function frontierSuiteStep(outputText) {
  var suite = state.scriptureSuite;
  frontierSuiteRunId();
  frontierSuiteArmFromText(outputText);

  suite.turn += 1;
  suite.hp = Math.max(0, Math.min(100, suite.hp + (suite.turn % 4 === 0 ? 11 : -6)));
  suite.mana = Math.max(0, Math.min(50, suite.mana + (suite.turn % 3 === 0 ? 7 : -3)));
  suite.gold += 5 + (suite.turn % 7);

  var manifest = frontierSuiteWidgetManifest();
  suite.phase = 'normal';

  if (suite.manifestResetArmed) {
    suite.phase = 'reset';
    manifest = frontierSuiteManifestWithResetVariant();
    suite.manifestResetArmed = false;
    frontierSuiteLog('ran', 'manifest reset variant');
  }

  if (suite.sanitizerArmed) {
    suite.phase = 'sanitizer';
    suite.sanitizerArmed = false;
    frontierSuiteLog('ran', 'sanitizer fixture');
  }

  var values = frontierSuiteValues();
  frontierSuiteUpdateHistory('scripture', values, manifest, suite.historyLimit);
  frontierSuiteWriteTrace();

  if (suite.malformedArmed) {
    suite.malformedArmed = false;
    frontierSuiteWriteCard('frontier:state:scripture', '{ malformed json', 'Frontier');
    frontierSuiteLog('ran', 'malformed state card');
  }

  return true;
}
