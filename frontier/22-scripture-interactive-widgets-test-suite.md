# 22 - Scripture Interactive Widgets AI Dungeon Test Suite

Live regression suite for Phase 9.5, the Scripture interactive widget system.

Use this after loading the extension, opening AI Dungeon, enabling Frontier, enabling Scripture, and setting BetterDungeon -> Frontier -> Widget Risk to `Enhanced`.

This suite validates:

- New interactive widget types render under the `Enhanced` risk ceiling.
- `Safe` blocks interactive widgets while leaving passive Scripture widgets alive.
- `Unsafe` allows widgets that explicitly request `risk: "unsafe"`.
- Button clicks are preserved as separate actions.
- Slider, toggle, select, input, and textarea changes coalesce to the latest useful value.
- BetterDungeon writes user interactions to `frontier:in:scripture` under `widgetEvents`.
- The AI Dungeon script reads events, mutates script state, and acknowledges them through `frontier:state:scripture.interactions.ackSeq`.
- Optimistic local edits snap to the script-confirmed state after acknowledgement.
- Interactions made while a turn is generating are picked up on the next available script turn.

The suite writes:

- `frontier:state:scripture`
- `frontier:in:scripture` through BetterDungeon when you use widgets
- `frontier:test:scripture-interactive`

Expected final trace:

- `phase: "complete"`
- `requiredChecksPass: true`
- `checks.sliderCoalesced: true` after dragging the slider through multiple values before a turn

## Library Script

Paste this into the AI Dungeon scenario Library.

```js
// Scripture Interactive Widgets Test Suite - AI Dungeon Library
// Pair with the Output Modifier below.

state.scriptureInteractiveSuite = state.scriptureInteractiveSuite || {
  runId: null,
  turn: 0,
  seq: 0,
  ackSeq: 0,
  potions: 3,
  potionClicks: 0,
  difficulty: 50,
  hardMode: false,
  stance: 'normal',
  codename: '',
  note: '',
  unsafePings: 0,
  processedEvents: {},
  consumedCommands: {},
  touched: {},
  events: [],
  phase: 'boot'
};

function siNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function siRunId() {
  var suite = state.scriptureInteractiveSuite;
  if (!suite.runId) suite.runId = 'scripture-ui-' + siNow().toString(36);
  return suite.runId;
}

function siCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function siFindCard(title) {
  var cards = siCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function siCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function siReadJson(title) {
  var found = siFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(siCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function siWriteCard(title, value, type) {
  var found = siFindCard(title);
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

function siLiveKey() {
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function siClampNumber(value, min, max, fallback) {
  var n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function siLog(event, detail) {
  var suite = state.scriptureInteractiveSuite;
  suite.events = suite.events || [];
  suite.events.push({
    at: siNow(),
    turn: suite.turn,
    liveKey: siLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 80) suite.events.shift();
}

function siHeartbeat() {
  return siReadJson('frontier:heartbeat');
}

function siHasScripture() {
  var hb = siHeartbeat();
  if (!hb || !hb.frontier || hb.frontier.protocol !== 1) return false;
  var modules = Array.isArray(hb.modules) ? hb.modules : [];
  for (var i = 0; i < modules.length; i++) {
    if (modules[i] && modules[i].id === 'scripture') return true;
  }
  return false;
}

function siRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.scriptureInteractiveSuite.turn, text: String(outputText || '') }];
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

function siTextIncludes(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function siConsumeCommand(kind, outputText, needles) {
  var suite = state.scriptureInteractiveSuite;
  suite.consumedCommands = suite.consumedCommands || {};
  var sources = siRecentSources(outputText);

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!siTextIncludes(source.text, needles)) continue;
    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;
    suite.consumedCommands[signature] = siNow();
    return true;
  }
  return false;
}

function siResetSuite() {
  state.scriptureInteractiveSuite = {
    runId: 'scripture-ui-' + siNow().toString(36),
    turn: 0,
    seq: 0,
    ackSeq: 0,
    potions: 3,
    potionClicks: 0,
    difficulty: 50,
    hardMode: false,
    stance: 'normal',
    codename: '',
    note: '',
    unsafePings: 0,
    processedEvents: {},
    consumedCommands: {},
    touched: {},
    events: [],
    phase: 'reset'
  };
  siWriteScriptureState();
  siWriteTrace();
}

function siWidgetEventsCard() {
  var card = siReadJson('frontier:in:scripture');
  if (!card || !card.widgetEvents) return null;
  return card.widgetEvents;
}

function siProcessWidgetEvents() {
  var suite = state.scriptureInteractiveSuite;
  var queue = siWidgetEventsCard();
  var events = queue && Array.isArray(queue.events) ? queue.events : [];
  var processed = 0;

  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (!event || !event.seq) continue;
    var seq = Number(event.seq);
    if (!Number.isFinite(seq) || seq <= suite.ackSeq) continue;
    if (suite.processedEvents[String(seq)]) continue;

    suite.processedEvents[String(seq)] = true;
    suite.ackSeq = Math.max(suite.ackSeq, seq);
    processed++;

    var count = Math.max(1, Number(event.count || 1));
    if (count > 1) suite.touched.coalesced = true;

    if (event.widgetId === 'si-potion') {
      suite.potionClicks += 1;
      suite.potions = Math.max(0, suite.potions - 1);
      suite.touched.button = true;
    } else if (event.widgetId === 'si-hard-mode') {
      suite.hardMode = !!event.value;
      suite.touched.toggle = true;
    } else if (event.widgetId === 'si-difficulty') {
      suite.difficulty = siClampNumber(event.value, 1, 100, suite.difficulty);
      suite.touched.slider = true;
      if (count > 1) suite.touched.sliderCoalesced = true;
    } else if (event.widgetId === 'si-stance') {
      suite.stance = String(event.value || 'normal');
      suite.touched.select = true;
    } else if (event.widgetId === 'si-codename') {
      suite.codename = String(event.value || '').slice(0, 24);
      suite.touched.input = true;
    } else if (event.widgetId === 'si-note') {
      suite.note = String(event.value || '').slice(0, 120);
      suite.touched.textarea = true;
    } else if (event.widgetId === 'si-unsafe-demo') {
      suite.unsafePings += 1;
      suite.touched.unsafe = true;
    }

    siLog('widget-event', event.widgetId + ' #' + seq + ' count=' + count + ' value=' + JSON.stringify(event.value));
  }

  return processed;
}

function siManifest() {
  return {
    widgets: [
      { id: 'si-status', type: 'badge', label: 'Status', align: 'left', color: 'cyan' },
      { id: 'si-potions-left', type: 'counter', icon: '+', label: 'Potions', align: 'left' },
      { id: 'si-potion', type: 'button', label: 'Potion', text: 'Use Potion', icon: '+', variant: 'primary', align: 'left', risk: 'enhanced' },
      { id: 'si-hard-mode', type: 'toggle', label: 'Hard Mode', align: 'center', risk: 'enhanced' },
      { id: 'si-difficulty', type: 'slider', label: 'Difficulty', min: 1, max: 100, step: 1, showValue: true, align: 'center', risk: 'enhanced' },
      {
        id: 'si-stance',
        type: 'select',
        label: 'Stance',
        align: 'center',
        risk: 'enhanced',
        options: [
          { label: 'Careful', value: 'careful' },
          { label: 'Normal', value: 'normal' },
          { label: 'Bold', value: 'bold' }
        ]
      },
      { id: 'si-codename', type: 'input', label: 'Codename', placeholder: 'Type name', maxLength: 24, align: 'right', risk: 'enhanced' },
      { id: 'si-note', type: 'textarea', label: 'Note', placeholder: 'Type test note', rows: 2, maxLength: 120, align: 'right', risk: 'enhanced' },
      { id: 'si-unsafe-demo', type: 'button', label: 'Unsafe', text: 'Unsafe Ping', icon: '!', align: 'right', risk: 'unsafe' },
      { id: 'si-summary', type: 'panel', title: 'Script State', align: 'right' }
    ]
  };
}

function siStatusText() {
  var suite = state.scriptureInteractiveSuite;
  return suite.phase + ' | ack ' + suite.ackSeq + ' | events ' + Object.keys(suite.processedEvents || {}).length;
}

function siValues() {
  var suite = state.scriptureInteractiveSuite;
  return {
    'si-status': { text: siStatusText(), color: siRequiredChecksPass() ? 'green' : 'cyan' },
    'si-potions-left': { value: suite.potions, delta: suite.potionClicks ? -suite.potionClicks : undefined },
    'si-potion': { text: suite.potions > 0 ? 'Use Potion' : 'No Potions', disabled: suite.potions <= 0 },
    'si-hard-mode': suite.hardMode,
    'si-difficulty': suite.difficulty,
    'si-stance': suite.stance,
    'si-codename': suite.codename,
    'si-note': suite.note,
    'si-unsafe-demo': { text: 'Unsafe Ping ' + suite.unsafePings },
    'si-summary': {
      items: [
        { label: 'Run', value: siRunId() },
        { label: 'Difficulty', value: suite.difficulty },
        { label: 'Hard', value: suite.hardMode ? 'on' : 'off' },
        { label: 'Stance', value: suite.stance },
        { label: 'Potion clicks', value: suite.potionClicks },
        { label: 'Unsafe pings', value: suite.unsafePings },
        { label: 'Ack seq', value: suite.ackSeq }
      ]
    }
  };
}

function siPruneHistory(historyObj, limit) {
  var keys = Object.keys(historyObj || {})
    .map(function (key) { return { key: key, n: Number(key) }; })
    .filter(function (entry) { return Number.isFinite(entry.n); })
    .sort(function (a, b) { return a.n - b.n; });

  while (keys.length > limit) {
    var drop = keys.shift();
    delete historyObj[drop.key];
  }
}

function siWriteScriptureState() {
  var existing = siReadJson('frontier:state:scripture') || { v: 1, history: {} };
  existing.v = 1;
  existing.manifest = siManifest();
  existing.history = existing.history || {};
  existing.history[siLiveKey()] = siValues();
  existing.historyLimit = 25;
  existing.interactions = {
    ackSeq: state.scriptureInteractiveSuite.ackSeq,
    processedAt: new Date(siNow()).toISOString()
  };
  siPruneHistory(existing.history, existing.historyLimit);
  siWriteCard('frontier:state:scripture', JSON.stringify(existing), 'Frontier');
}

function siChecks() {
  var suite = state.scriptureInteractiveSuite;
  var queue = siWidgetEventsCard();
  return {
    scriptureAdvertised: siHasScripture(),
    widgetEventsCardSeen: !!queue,
    anyEventSeen: Object.keys(suite.processedEvents || {}).length > 0,
    buttonSeen: !!suite.touched.button,
    toggleSeen: !!suite.touched.toggle,
    sliderSeen: !!suite.touched.slider,
    sliderCoalesced: !!suite.touched.sliderCoalesced,
    selectSeen: !!suite.touched.select,
    inputSeen: !!suite.touched.input,
    textareaSeen: !!suite.touched.textarea,
    ackAdvanced: suite.ackSeq > 0,
    unsafeSeen: !!suite.touched.unsafe
  };
}

function siRequiredChecksPass() {
  var checks = siChecks();
  return !!(
    checks.scriptureAdvertised &&
    checks.widgetEventsCardSeen &&
    checks.anyEventSeen &&
    checks.buttonSeen &&
    checks.toggleSeen &&
    checks.sliderSeen &&
    checks.sliderCoalesced &&
    checks.selectSeen &&
    checks.inputSeen &&
    checks.textareaSeen &&
    checks.ackAdvanced
  );
}

function siDrivePlan(outputText) {
  var suite = state.scriptureInteractiveSuite;

  if (siConsumeCommand('reset', outputText, ['si reset', 'scripture interactive reset', '[[si:reset]]'])) {
    siResetSuite();
    return;
  }

  if (!siHasScripture()) {
    suite.phase = 'waiting for Scripture heartbeat';
    return;
  }

  suite.phase = siRequiredChecksPass() ? 'complete' : 'waiting for widget interactions';
}

function siWriteTrace() {
  var suite = state.scriptureInteractiveSuite;
  var trace = {
    v: 1,
    runId: siRunId(),
    turn: suite.turn,
    liveKey: siLiveKey(),
    phase: suite.phase,
    requiredChecksPass: siRequiredChecksPass(),
    checks: siChecks(),
    state: {
      potions: suite.potions,
      potionClicks: suite.potionClicks,
      difficulty: suite.difficulty,
      hardMode: suite.hardMode,
      stance: suite.stance,
      codename: suite.codename,
      note: suite.note,
      unsafePings: suite.unsafePings,
      ackSeq: suite.ackSeq
    },
    widgetEventsCard: siWidgetEventsCard(),
    recentEvents: suite.events || []
  };
  siWriteCard('frontier:test:scripture-interactive', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function scriptureInteractiveStep(outputText) {
  var suite = state.scriptureInteractiveSuite;
  siRunId();
  suite.turn += 1;
  var processed = siProcessWidgetEvents();
  if (processed > 0) siLog('processed-batch', String(processed));
  siDrivePlan(outputText);
  siWriteScriptureState();
  siWriteTrace();
  return true;
}
```

## Output Modifier Script

Paste this into the AI Dungeon Output Modifier.

```js
// Scripture Interactive Widgets Test Suite - AI Dungeon Output Modifier
// Pair with the Library script above.

var modifier = function (text) {
  try {
    scriptureInteractiveStep(text);
  } catch (err) {
    var message = err && err.message ? err.message : String(err);
    if (typeof addStoryCard === 'function') {
      addStoryCard('frontier:test:scripture-interactive:error', message, 'Frontier Test');
    }
  }
  return { text: text };
};

modifier(text);
```

## Walkthrough

1. Reload BetterDungeon after building or editing the extension.
2. Open an AI Dungeon adventure.
3. Open BetterDungeon -> Frontier.
4. Confirm Frontier and Scripture are enabled.
5. Set `Widget Risk` to `Enhanced`.
6. Paste the Library script into the scenario Library.
7. Paste the Output Modifier script into the scenario Output Modifier.
8. Submit or continue once.

Expected after the first turn:

- `frontier:state:scripture` exists.
- Passive widgets render.
- Interactive widgets render: Potion button, Hard Mode toggle, Difficulty slider, Stance select, Codename input, and Note textarea.
- `Unsafe Ping` does not render yet, because it asks for `risk: "unsafe"`.
- `frontier:test:scripture-interactive` has `phase: "waiting for widget interactions"`.

## Core Interaction Check

Before taking another turn:

1. Press `Use Potion` once or twice.
2. Toggle `Hard Mode`.
3. Drag the `Difficulty` slider across several values.
4. Change `Stance`.
5. Type a codename.
6. Type a note.
7. Submit or continue once.

Expected:

- The controls update instantly before the turn.
- After the turn, the script state panel reflects the new values.
- The trace card has `requiredChecksPass: true` if every required control was touched.
- The trace card has `checks.sliderCoalesced: true`.
- `frontier:in:scripture.widgetEvents.events` is pruned after the script writes `ackSeq`.

## Generating-Turn Check

1. Press Continue or submit an action.
2. While AI Dungeon is generating, change the Difficulty slider or type in the Note widget.
3. Let the turn finish.
4. Take one more turn.

Expected:

- The UI keeps the value you changed optimistically.
- The first completed turn may still show the old script state, depending on when AI Dungeon snapshotted Story Cards.
- The next available script turn processes the queued widget event and acknowledges it.

## Risk Ceiling Checks

### Safe

1. Set BetterDungeon -> Frontier -> Widget Risk to `Safe`.
2. Take one turn or reload the adventure.

Expected:

- Passive widgets remain.
- Interactive widgets are rejected by Scripture validation and disappear.
- Restore `Widget Risk` to `Enhanced` before continuing the normal suite.

### Unsafe

1. Set BetterDungeon -> Frontier -> Widget Risk to `Unsafe`.
2. Take one turn or reload the adventure.
3. Press `Unsafe Ping`.
4. Take another turn.

Expected:

- The `Unsafe Ping` button renders.
- `unsafePings` increments in the script state panel.
- The trace card has `checks.unsafeSeen: true`.

## Reset

Type one of these into AI Dungeon and take a turn:

```text
SI RESET
```

or:

```text
[[si:reset]]
```

Expected:

- Potions reset to `3`.
- Difficulty resets to `50`.
- Ack state resets.
- The trace card gets a fresh `runId`.

## Reading The Queue Manually

Before the script acknowledges events, inspect `frontier:in:scripture`.

The important shape is:

```json
{
  "v": 1,
  "responses": {},
  "widgetEvents": {
    "v": 1,
    "module": "scripture",
    "latestSeq": 4,
    "ackSeq": 0,
    "events": [
      {
        "id": "scripture-4",
        "seq": 4,
        "widgetId": "si-difficulty",
        "widgetType": "slider",
        "action": "change",
        "value": 73,
        "count": 5,
        "coalesced": true
      }
    ]
  }
}
```

The script acknowledges by writing:

```json
{
  "v": 1,
  "interactions": {
    "ackSeq": 4
  }
}
```

inside `frontier:state:scripture`.

