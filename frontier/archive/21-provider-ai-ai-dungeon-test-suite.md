# 21 - Provider AI AI Dungeon Test Suite

Completed live validation suite for Phase 9 Provider AI.

## Sign-off Result - 2026-04-26

Run `provider-ai-mof04zzu` passed with `checksPass: true` using `inclusionai/ling-2.6-1t:free`.

Validated:

- `providerAI.testConnection` with safe OpenRouter key metadata and model count.
- `providerAI.models` with normalized model metadata.
- `providerAI.chat` validation failures for empty messages and oversized content.
- One real chat completion returning `"Frontier Provider AI is online."`.
- Terminal response delivery through `frontier:in:providerAI` and script ack handling.

Keep this page as the regression harness for future Provider AI changes.

Run this after loading the extension, opening AI Dungeon, enabling Frontier, enabling Provider AI, and saving an OpenRouter key in the BetterDungeon Frontier tab.

## Before Running

1. Open BetterDungeon -> Frontier -> AI Providers.
2. Save an OpenRouter API key.
3. Optionally save a default model.
4. If you do not save a default model, edit `FRONTIER_PROVIDER_AI_TEST_MODEL` in the Library script before pasting.

The suite writes:

- `frontier:out`
- `frontier:test:providerAI`

Expected final result:

- `phase: "complete"`
- `checksPass: true`
- `testConnection` should return `ok: true`, `modelCount`, and a safe `key` metadata object. The key value itself should never appear in the trace.

## Library Script

Paste this into the AI Dungeon scenario Library.

```js
// Frontier Provider AI Test Suite - AI Dungeon Library
// Pair with provider-ai-test-suite.output-modifier.js.

var FRONTIER_PROVIDER_AI_TEST_MODEL = 'inclusionai/ling-2.6-1t:free';

state.frontierProviderAiSuite = state.frontierProviderAiSuite || {
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
  testConnectionId: null,
  modelsId: null,
  invalidMessagesId: null,
  oversizedId: null,
  chatId: null,
  phase: 'boot'
};

function paiNow() {
  return Date.now ? Date.now() : new Date().getTime();
}

function paiRunId() {
  if (!state.frontierProviderAiSuite.runId) {
    state.frontierProviderAiSuite.runId = 'provider-ai-' + paiNow().toString(36);
  }
  return state.frontierProviderAiSuite.runId;
}

function paiCards() {
  return Array.isArray(storyCards) ? storyCards : [];
}

function paiFindCard(title) {
  var cards = paiCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card) continue;
    if (card.title === title || card.keys === title || card.key === title) {
      return { card: card, index: i };
    }
  }
  return { card: null, index: -1 };
}

function paiCardText(card) {
  if (!card) return '';
  return card.value || card.entry || card.description || '';
}

function paiReadJson(title) {
  var found = paiFindCard(title);
  if (!found.card) return null;
  try {
    return JSON.parse(paiCardText(found.card) || '{}');
  } catch (err) {
    return null;
  }
}

function paiWriteCard(title, value, type) {
  var found = paiFindCard(title);
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

function paiLiveKey() {
  return String((Array.isArray(history) ? history.length : 0) + 1);
}

function paiLog(event, detail) {
  var suite = state.frontierProviderAiSuite;
  suite.events = suite.events || [];
  suite.events.push({
    at: paiNow(),
    turn: suite.turn,
    liveKey: paiLiveKey(),
    event: event,
    detail: detail || ''
  });
  while (suite.events.length > 50) suite.events.shift();
}

function paiHeartbeat() {
  return paiReadJson('frontier:heartbeat');
}

function paiHasOp(moduleId, opName) {
  var heartbeat = paiHeartbeat();
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

function paiPendingRequestsArray() {
  var suite = state.frontierProviderAiSuite;
  var out = [];
  for (var id in suite.pending) {
    if (Object.prototype.hasOwnProperty.call(suite.pending, id)) {
      out.push(suite.pending[id]);
    }
  }
  return out;
}

function paiWriteOut() {
  var suite = state.frontierProviderAiSuite;
  var payload = {
    v: 1,
    requests: paiPendingRequestsArray(),
    acks: suite._acks || [],
    debugSeq: ++suite.outSeq,
    debugWrittenAt: paiNow()
  };
  suite._acks = [];
  paiWriteCard('frontier:out', JSON.stringify(payload), 'Frontier');
}

function paiQueueAck(requestId, reason) {
  var suite = state.frontierProviderAiSuite;
  suite._acks = suite._acks || [];
  suite.acked = suite.acked || {};
  suite.ackAttempts = suite.ackAttempts || {};

  var attempts = Number(suite.ackAttempts[requestId] || 0);
  if (attempts >= 6) return false;

  suite.acked[requestId] = true;
  suite.ackAttempts[requestId] = attempts + 1;
  suite._acks.push(requestId);
  paiLog(attempts === 0 ? 'ack' : 'ack-retry', requestId + (reason ? ' - ' + reason : ''));
  return true;
}

function paiQueueRequest(opName, args) {
  var suite = state.frontierProviderAiSuite;
  var id = paiLiveKey() + '-providerAI-' + (++suite.seq);
  if (suite.pending[id] || suite.completed[id]) return id;

  suite.pending[id] = {
    id: id,
    module: 'providerAI',
    op: opName,
    args: args === undefined ? {} : args,
    ts: paiNow()
  };
  paiLog('queued', id + ' -> providerAI.' + opName);
  paiWriteOut();
  return id;
}

function paiIsTerminal(response) {
  return response && (response.status === 'ok' || response.status === 'err' || response.status === 'timeout');
}

function paiPollResponses() {
  var suite = state.frontierProviderAiSuite;
  var card = paiReadJson('frontier:in:providerAI');
  var foundTerminal = false;
  if (!card || !card.responses) return;

  for (var requestId in card.responses) {
    if (!Object.prototype.hasOwnProperty.call(card.responses, requestId)) continue;
    var response = card.responses[requestId];
    if (!paiIsTerminal(response)) continue;

    if (!suite.completed[requestId]) {
      suite.completed[requestId] = {
        status: response.status,
        data: response.data || null,
        error: response.error || null,
        seenAt: paiNow()
      };
      paiLog('completed', requestId + ' -> ' + response.status);
    }

    delete suite.pending[requestId];
    if (!suite.acked[requestId]) {
      foundTerminal = paiQueueAck(requestId, 'terminal response') || foundTerminal;
    } else if (Number(suite.ackAttempts[requestId] || 0) < 6) {
      foundTerminal = paiQueueAck(requestId, 'response still present') || foundTerminal;
    }
  }

  if (foundTerminal) paiWriteOut();
}

function paiRepeat(ch, count) {
  var out = '';
  for (var i = 0; i < count; i++) out += ch;
  return out;
}

function paiTextIncludes(text, needles) {
  var haystack = String(text || '').toLowerCase();
  for (var i = 0; i < needles.length; i++) {
    if (haystack.indexOf(needles[i]) !== -1) return true;
  }
  return false;
}

function paiRecentSources(outputText) {
  var sources = [{ id: 'output:' + state.frontierProviderAiSuite.turn, text: String(outputText || '') }];
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

function paiConsumeCommand(kind, outputText, needles) {
  var suite = state.frontierProviderAiSuite;
  suite.consumedCommands = suite.consumedCommands || {};
  var sources = paiRecentSources(outputText);

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!paiTextIncludes(source.text, needles)) continue;
    var signature = kind + ':' + source.id + ':' + source.text.slice(0, 120);
    if (suite.consumedCommands[signature]) return false;
    suite.consumedCommands[signature] = paiNow();
    return true;
  }
  return false;
}

function paiResetSuite() {
  state.frontierProviderAiSuite = {
    runId: 'provider-ai-' + paiNow().toString(36),
    turn: 0,
    seq: 0,
    outSeq: 0,
    pending: {},
    completed: {},
    acked: {},
    ackAttempts: {},
    events: [],
    consumedCommands: {},
    testConnectionId: null,
    modelsId: null,
    invalidMessagesId: null,
    oversizedId: null,
    chatId: null,
    phase: 'reset'
  };
  paiWriteCard('frontier:out', JSON.stringify({ v: 1, requests: [], acks: [] }), 'Frontier');
  paiWriteTrace();
}

function paiTestModel() {
  return String(FRONTIER_PROVIDER_AI_TEST_MODEL || '').trim();
}

function paiChatArgs() {
  var args = {
    provider: 'openrouter',
    messages: [
      { role: 'system', content: 'Reply with one short plain sentence.' },
      { role: 'user', content: 'Say that Frontier Provider AI is online.' }
    ],
    maxTokens: 32,
    temperature: 0,
    timeoutMs: 60000
  };
  var model = paiTestModel();
  if (model) args.model = model;
  return args;
}

function paiDrivePlan(outputText) {
  var suite = state.frontierProviderAiSuite;

  if (paiConsumeCommand('reset', outputText, ['provider ai reset', 'providerai reset', '[[providerai:reset]]'])) {
    paiResetSuite();
    return;
  }

  if (!paiHasOp('providerAI', 'chat') || !paiHasOp('providerAI', 'models') || !paiHasOp('providerAI', 'testConnection')) {
    suite.phase = 'waiting for providerAI heartbeat';
    return;
  }

  if (!suite.testConnectionId) {
    suite.phase = 'waiting for testConnection';
    suite.testConnectionId = paiQueueRequest('testConnection', { provider: 'openrouter', timeoutMs: 30000 });
    return;
  }

  if (suite.testConnectionId && suite.completed[suite.testConnectionId] && !suite.modelsId) {
    suite.phase = 'waiting for models';
    suite.modelsId = paiQueueRequest('models', { provider: 'openrouter', limit: 1, timeoutMs: 30000 });
    return;
  }

  if (suite.modelsId && suite.completed[suite.modelsId] && !suite.invalidMessagesId) {
    suite.phase = 'waiting for invalid messages';
    suite.invalidMessagesId = paiQueueRequest('chat', {
      provider: 'openrouter',
      model: paiTestModel(),
      messages: []
    });
    return;
  }

  if (suite.invalidMessagesId && suite.completed[suite.invalidMessagesId] && !suite.oversizedId) {
    suite.phase = 'waiting for oversized rejection';
    suite.oversizedId = paiQueueRequest('chat', {
      provider: 'openrouter',
      model: paiTestModel(),
      messages: [{ role: 'user', content: paiRepeat('x', 8001) }]
    });
    return;
  }

  if (suite.oversizedId && suite.completed[suite.oversizedId] && !suite.chatId) {
    suite.phase = 'waiting for chat';
    suite.chatId = paiQueueRequest('chat', paiChatArgs());
    return;
  }

  suite.phase = paiAllChecksPass() ? 'complete' : 'waiting';
}

function paiValidTestConnection(result) {
  return !!(
    result &&
    result.provider === 'openrouter' &&
    result.configured === true &&
    result.ok === true &&
    typeof result.modelCount === 'number' &&
    typeof result.checkedAtIso === 'string' &&
    result.key &&
    typeof result.key === 'object'
  );
}

function paiValidModels(result) {
  return !!(
    result &&
    result.provider === 'openrouter' &&
    result.configured === true &&
    typeof result.count === 'number' &&
    typeof result.totalCount === 'number' &&
    typeof result.returned === 'number' &&
    Array.isArray(result.models)
  );
}

function paiValidChat(result) {
  return !!(
    result &&
    result.provider === 'openrouter' &&
    typeof result.model === 'string' &&
    typeof result.text === 'string' &&
    result.text.length > 0 &&
    result.message &&
    result.message.role === 'assistant' &&
    typeof result.message.content === 'string'
  );
}

function paiAllChecksPass() {
  var suite = state.frontierProviderAiSuite;
  var testConnection = suite.testConnectionId && suite.completed[suite.testConnectionId];
  var models = suite.modelsId && suite.completed[suite.modelsId];
  var invalidMessages = suite.invalidMessagesId && suite.completed[suite.invalidMessagesId];
  var oversized = suite.oversizedId && suite.completed[suite.oversizedId];
  var chat = suite.chatId && suite.completed[suite.chatId];

  return !!(
    paiHasOp('providerAI', 'chat') &&
    paiHasOp('providerAI', 'models') &&
    paiHasOp('providerAI', 'testConnection') &&
    testConnection && testConnection.status === 'ok' && paiValidTestConnection(testConnection.data) &&
    models && models.status === 'ok' && paiValidModels(models.data) &&
    invalidMessages && invalidMessages.status === 'err' && invalidMessages.error && invalidMessages.error.code === 'invalid_args' &&
    oversized && oversized.status === 'err' && oversized.error && oversized.error.code === 'invalid_args' &&
    chat && chat.status === 'ok' && paiValidChat(chat.data)
  );
}

function paiWriteTrace() {
  var suite = state.frontierProviderAiSuite;
  var trace = {
    v: 1,
    runId: paiRunId(),
    turn: suite.turn,
    liveKey: paiLiveKey(),
    phase: suite.phase,
    heartbeatFull: !!(paiHeartbeat() && paiHeartbeat().frontier && paiHeartbeat().frontier.profile === 'full'),
    providerAiChatAdvertised: paiHasOp('providerAI', 'chat'),
    providerAiModelsAdvertised: paiHasOp('providerAI', 'models'),
    providerAiTestConnectionAdvertised: paiHasOp('providerAI', 'testConnection'),
    testModel: paiTestModel() || '(BetterDungeon default)',
    pendingIds: Object.keys(suite.pending || {}),
    ackedIds: Object.keys(suite.acked || {}),
    ackAttempts: suite.ackAttempts || {},
    completed: suite.completed,
    checksPass: paiAllChecksPass(),
    events: suite.events || []
  };
  paiWriteCard('frontier:test:providerAI', JSON.stringify(trace, null, 2), 'Frontier Test');
}

function frontierProviderAiStep(outputText) {
  var suite = state.frontierProviderAiSuite;
  paiRunId();
  suite.turn += 1;
  paiPollResponses();
  paiDrivePlan(outputText);
  paiWriteTrace();
  return true;
}
```

## Output Modifier Script

Paste this into the AI Dungeon Output Modifier.

```js
// Frontier Provider AI Test Suite - AI Dungeon Output Modifier
// Pair with provider-ai-test-suite.library.js.

var modifier = function (text) {
  frontierProviderAiStep(text);
  return { text: text };
};

modifier(text);
```

## Manual Missing-Key Check

The main suite assumes a configured key. To verify `not_configured`, clear the OpenRouter key in BetterDungeon, run one turn, and call:

```js
frontierCall('providerAI', 'testConnection', { provider: 'openrouter' }).catch(console.log)
```

Expected error code:

```text
not_configured
```
