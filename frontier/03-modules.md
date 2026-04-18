# 03 — Modules

## What a module is

A **Frontier module** is a matched pair:

1. **AI-Dungeon-side Library snippet** — JavaScript the user pastes into their scenario's Library tab. Provides the in-script API for calling the module's ops.
2. **BetterDungeon-side handler** — JavaScript loaded by the extension. Registers with Frontier Core; implements the ops' actual logic (widget rendering, network fetches, filesystem access, etc.).

Frontier Core is the only thing that bridges the two. Neither half knows anything about the other's implementation — they share only the protocol envelope shape.

## Module interface (BD side)

Every BD-side module exports an object conforming to this shape:

```ts
interface FrontierModule {
  /** Unique module id. Must match heartbeat advertisement and envelope routing. */
  id: string;

  /** SemVer version of this module's BD-side handler. */
  version: string;

  /** Human-readable label for the popup UI. */
  label: string;

  /** Long description for settings / module registry UI. */
  description?: string;

  /**
   * Ops this module handles. Advertised in heartbeat so scripts know what's available.
   * Each op gets a handler invoked by Core when a matching request envelope arrives.
   */
  ops: Record<string, FrontierOpHandler>;

  /**
   * Default transport for envelopes originated by this module's AI-Dungeon-side Library.
   * The Library uses this when the script doesn't explicitly set `transport` on an envelope.
   * Defaults to 'card' if omitted.
   */
  defaultTransport?: 'card' | 'text';

  /**
   * If true, this module uses text transport at all. Advertised in heartbeat as `textEnabled`
   * AND'd with the user's global invisible-text toggle. Scripts can check this to decide
   * whether to rely on text-transport semantics (undo/retry reverting).
   */
  usesText?: boolean;

  /**
   * Called when the script updates a `frontier:state:<name>` card the module claims.
   * The module declares which state names it owns via `stateNames`.
   */
  stateNames?: string[];
  onStateChange?: (name: string, parsed: unknown, rawCard: StoryCard) => void;

  /** Lifecycle hooks. */
  onEnable?: (ctx: FrontierContext) => Promise<void> | void;
  onDisable?: (ctx: FrontierContext) => Promise<void> | void;

  /** Optional: called on adventure transitions so modules can reset per-adventure state. */
  onAdventureChange?: (newAdventureId: string | null) => void;
}

type FrontierOpHandler = (
  request: RequestEnvelope,
  ctx: FrontierContext
) => void | Promise<void>;

interface FrontierContext {
  /**
   * Emit a response envelope for the given request.
   * Transport defaults to 'card'; text responses are rarely useful for BD-side handlers
   * but supported for completeness.
   */
  respond(reqId: string, partial: Partial<ResponseEnvelope>): void;

  /** Emit a spontaneous push envelope (no replyTo). */
  emit(partial: Omit<ResponseEnvelope, 'id' | 'module' | 'ts'>): void;

  /** Log (respects Frontier's debug toggle). */
  log(msg: string, ...args: unknown[]): void;

  /** Access to the story-card stream for reads that aren't about state cards. */
  readonly cards: CardStreamReadOnly;

  /** Current adventure id (null if not in an adventure). */
  readonly adventureId: string | null;

  /** Current Frontier turn count from the last WS push. */
  readonly turn: number;

  /** True iff text transport is available for this module right now (global + per-module). */
  readonly textEnabled: boolean;
}
```

## Op handler rules

- Handlers MUST NOT throw synchronously. Throw-equivalent: `ctx.respond(id, { status: 'error', error: { code: '...', message: '...' } })`.
- For long-running work, handlers SHOULD emit `status: 'accepted'` immediately, then `status: 'progress'` updates as appropriate, then exactly one terminal envelope.
- Handlers MUST check `ctx.adventureId` before cross-turn persistence; per-adventure state is the responsibility of the module.
- Handlers receive ONE invocation per unique request id. Core handles dedup upstream.
- Handlers SHOULD honor the request's `timeoutTurns` hint by aborting work that exceeds it (Core will emit the timeout error automatically, but the work itself should stop).

## Module registration

In the extension's bootstrap (e.g. `main.js` or Frontier's own init), modules register themselves:

```js
// services/frontier/core.js exposes the singleton.
const core = FrontierCore.instance;
core.registerModule(ScriptureModule);
// (future) core.registerModule(WebFetchModule);
```

Registration triggers:
1. Core adds the module to its `Map<id, module>`.
2. Core calls the module's `onEnable` if the user has it enabled (default: true for built-ins).
3. Core updates the heartbeat card to advertise the new module.
4. The popup UI's Frontier section gains a toggle for the module.

## Enable / disable flow

```
User toggles module off in popup
         │
         ▼
chrome.runtime message → main.js → core.setModuleEnabled(id, false)
         │
         ▼
Core calls module.onDisable(ctx); module tears down listeners / UI
         │
         ▼
Core updates heartbeat card (module removed from `modules[]`)
         │
         ▼
Scripts reading heartbeat on next turn see the module gone,
either gracefully degrade or surface a "module X unavailable" notice
```

## Module lifecycle for Scripture (reference)

Scripture uses BOTH transports. The card transport carries the **manifest** (widget structure: ids, types, labels, colors, zones — the schema). The text transport carries per-turn **values** (current HP, current gold, etc.), which is what makes the widgets revert correctly on undo/retry.

```
Declared config:
  id: 'scripture'
  defaultTransport: 'text'
  usesText: true
  stateNames: ['scripture']
  ops: { flashWidget }

onEnable:
  - Mount the widget container in the DOM if not already present.
  - Subscribe to frontier:state:scripture via core; hydrate manifest from current card if any.
  - Subscribe to text frames targeting module 'scripture'; hydrate initial values if any.
  - Install resize/layout observers.

onStateChange('scripture', parsed):
  - This is the MANIFEST — the widget schema.
  - Diff parsed.widgets against currently-rendered widgets.
  - Create new widgets, update changed STRUCTURE (label, type, color, align), destroy removed ones.
  - Validate each widget config via validators.js; reject invalid entries with a warning.
  - Values shown remain whatever was last set via text transport.

Text-frame handler ({ module: 'scripture', op: 'values', payload: { [widgetId]: value, ... } }):
  - Update widget live values in place. No DOM rebuild, just value/progress updates.
  - If a value is for a widget id not in the current manifest, ignore silently
    (manifest drift, typically a race between the two transports).
  - If text transport is disabled for Scripture (textEnabled=false in heartbeat),
    Scripture can optionally accept 'values' via card transport as a fallback,
    at the cost of the undo/retry bug returning. Document in the guide.

onMessage (ops):
  - 'flashWidget' → briefly animate the specified widget (card-transport request; fire-and-forget).
  - (future) 'queryWidgetBounds' → respond with DOMRect of a widget (for script to use in tooltip logic).

onAdventureChange:
  - Clear the widget cache and value cache.
  - Re-hydrate manifest from frontier:state:scripture if it exists in the new adventure.
  - Values wait for the first text frame (or stay blank until then).

onDisable:
  - Tear down all widgets.
  - Remove the widget container from the DOM.
  - Disconnect observers.
```

**Why the split?** If the user hits undo, the text block for the current turn disappears — along with its embedded value frame. The previous turn's text block (now the current tail) is shown, and its value frame is read instead. Widgets' *values* automatically reflect the narrative state. The *manifest*, meanwhile, stays put: it's structure, not state. New widgets added in turn 10 are still added when the user undoes back to turn 5 — but that's fine, because the manifest is what the script *is publishing*, not what it published historically.

## AI-Dungeon-side Library

Every module ships a short Library snippet the user pastes into their scenario. Frontier Core (BD side) provides a single shared base Library the user pastes once; per-module Libraries are small adapters built on top.

The base Library has three responsibilities:
1. Availability detection (heartbeat reader).
2. Card-transport queue management (`frontier:out`, `frontier:in:*`, `frontier:state:*`).
3. Text-transport encoding/decoding (via the `textCodec` helpers that mirror the BD-side codec).

### Base Frontier Library (pasted once per scenario)

```js
// === Frontier Base Library (v1) ===============================================
state.frontier = state.frontier ?? { counter: 0, inflight: {}, textOutbox: [] };

// --- Utilities --------------------------------------------------------------
function frontierNewId(prefix) {
  state.frontier.counter = (state.frontier.counter || 0) + 1;
  return (prefix || 'req') + '-' + state.frontier.counter;
}

function frontierHeartbeat() {
  const card = storyCards.find(c => c.title === 'frontier:heartbeat');
  if (!card) return null;
  try { return JSON.parse(card.entry || card.value || '{}'); } catch { return null; }
}

function frontierIsAvailable(opts = {}) {
  const { maxStaleTurns = 2, requireModules = [], requireText = false } = opts;
  const hb = frontierHeartbeat();
  if (!hb || hb.frontier?.protocol !== 1) return false;
  if (typeof hb.turn === 'number' && info.actionCount - hb.turn > maxStaleTurns) return false;
  if (requireModules.length) {
    const avail = new Set((hb.modules || []).map(m => m.id));
    if (!requireModules.every(m => avail.has(m))) return false;
  }
  if (requireText) {
    if (!hb.transports?.text?.enabled) return false;
    if (requireModules.length) {
      const modMap = new Map((hb.modules || []).map(m => [m.id, m]));
      if (!requireModules.every(m => modMap.get(m)?.textEnabled)) return false;
    }
  }
  return true;
}

function frontierDefaultTransport(moduleId) {
  const hb = frontierHeartbeat();
  if (!hb) return 'card';
  const m = (hb.modules || []).find(x => x.id === moduleId);
  return (m && m.defaultTransport) || 'card';
}

// --- Text codec (ported from Robyn's invisible-unicode-decoder) ------------
// Exact encoding mirrors services/frontier/text-codec.js on the BD side.
// Kept terse here; see the Frontier docs for the full algorithm.
const FRONTIER_TEXT_MARK_START = '<\u200B\u200C\u200D>'; // placeholder; real markers defined by codec port
const FRONTIER_TEXT_MARK_END   = '<\u200B\u200D\u200C>'; // placeholder

function frontierTextEncode(obj) {
  // Real implementation is the ported codec. Stub shown for structure only.
  return FRONTIER_TEXT_MARK_START + _frontierEncodeInternal(JSON.stringify(obj)) + FRONTIER_TEXT_MARK_END;
}
function frontierTextDecode(text) {
  // Returns { frames: unknown[], cleanText: string }.
  return _frontierDecodeInternal(text);
}
function frontierContextModifier(text) {
  // For use in the Context Modifier hook. Strips all Frontier-owned invisible chars.
  return frontierTextDecode(text).cleanText;
}

// --- Card-transport outbound (frontier:out) --------------------------------
function frontierEnqueue(envelope) {
  state.frontier.outbox = state.frontier.outbox || [];
  state.frontier.outbox.push({
    id: envelope.id || frontierNewId(),
    module: envelope.module,
    op: envelope.op,
    payload: envelope.payload,
    ts: Date.now(),
    transport: envelope.transport || frontierDefaultTransport(envelope.module),
    expectsResponse: envelope.expectsResponse !== false,
    timeoutTurns: envelope.timeoutTurns || 20,
    ephemeral: envelope.ephemeral === true,
  });
  return state.frontier.outbox[state.frontier.outbox.length - 1].id;
}

function frontierFlush() {
  // Splits the outbox by transport, flushes each.
  const outbox = state.frontier.outbox || [];
  const cardMessages = outbox.filter(m => m.transport === 'card');
  const textMessages = outbox.filter(m => m.transport === 'text');

  // Card path: write/overwrite the frontier:out card.
  const cardEnvelope = {
    v: 1,
    turn: info.actionCount,
    acks: state.frontier.pendingAcks || [],
    messages: cardMessages,
  };
  const json = JSON.stringify(cardEnvelope);
  const idx = storyCards.findIndex(c => c.title === 'frontier:out');
  if (idx === -1) {
    addStoryCard('frontier:out', json, 'Frontier');
  } else {
    const c = storyCards[idx];
    updateStoryCard(idx, c.keys || 'frontier:out', json, c.type || 'Frontier');
  }

  // Text path: stash the frame for the Output Modifier to append.
  if (textMessages.length) {
    state.frontier.textOutbox = (state.frontier.textOutbox || []).concat(textMessages);
  }

  state.frontier.outbox = [];
  state.frontier.pendingAcks = [];
}

function frontierAppendTextFrame(text) {
  // Call this from Output Modifier to append the pending text-transport frame.
  const msgs = state.frontier.textOutbox || [];
  if (!msgs.length) return text;
  const frame = frontierTextEncode({ v: 1, turn: info.actionCount, messages: msgs });
  state.frontier.textOutbox = [];
  return text + frame;
}

// --- Card-transport inbound (frontier:in:*) --------------------------------
function frontierPoll() {
  // Returns { [module]: ResponseEnvelope[] } of all fresh responses this turn.
  const fresh = {};
  for (const card of storyCards) {
    if (!/^frontier:in:/.test(card.title)) continue;
    const moduleId = card.title.slice('frontier:in:'.length);
    let parsed;
    try { parsed = JSON.parse(card.entry || card.value || '{}'); } catch { continue; }
    if (!parsed.messages) continue;
    const seen = state.frontier.seenResponses = state.frontier.seenResponses || {};
    const newMessages = parsed.messages.filter(m => !seen[m.id]);
    newMessages.forEach(m => { seen[m.id] = true; });
    if (newMessages.length) fresh[moduleId] = newMessages;
  }
  // Ack everything we just saw so Core can drop them next turn.
  state.frontier.pendingAcks = (state.frontier.pendingAcks || []).concat(
    Object.values(fresh).flat().map(m => m.id)
  );
  return fresh;
}

// --- Persistent state (frontier:state:*) -----------------------------------
function frontierPublishState(name, obj) {
  const title = 'frontier:state:' + name;
  const json = JSON.stringify(obj);
  const idx = storyCards.findIndex(c => c.title === title);
  if (idx === -1) {
    addStoryCard(title, json, 'Frontier');
  } else {
    const c = storyCards[idx];
    updateStoryCard(idx, c.keys || title, json, c.type || 'Frontier');
  }
}

// --- Convenience handle-based API ------------------------------------------
function frontierCall(moduleId, op, payload, opts = {}) {
  const id = frontierEnqueue({ module: moduleId, op, payload, ...opts });
  if (opts.expectsResponse !== false) {
    state.frontier.inflight[id] = { moduleId, op, startTurn: info.actionCount };
  }
  return id;
}

// --- Ephemeral values (text-transport shortcut) ----------------------------
function frontierEmitValues(moduleId, values) {
  // Shortcut for the common case: publish per-turn values over text transport.
  // Falls back to card transport if text is disabled (with documented undo/retry caveat).
  const hb = frontierHeartbeat();
  const mod = hb && (hb.modules || []).find(m => m.id === moduleId);
  const textOk = hb && hb.transports?.text?.enabled && mod && mod.textEnabled;
  frontierEnqueue({
    module: moduleId,
    op: 'values',
    payload: values,
    transport: textOk ? 'text' : 'card',
    expectsResponse: false,
    ephemeral: true,
  });
}
```

### Scripture Library adapter (pasted after the base Library)

```js
// === Scripture (Frontier Widget Module) =======================================
// Scripture has two halves:
//   - scriptureSetManifest(widgets) — defines the widgets (schema). Persistent in a story card.
//   - scriptureSetValues(values)    — updates per-turn values. Ephemeral in invisible text,
//                                     reverts with undo/retry automatically.

function scriptureSetManifest(widgets) {
  if (!frontierIsAvailable({ requireModules: ['scripture'] })) return false;
  // Manifest omits per-turn values by convention. Strip them if present.
  const manifest = widgets.map(({ value, progress, ...rest }) => rest);
  frontierPublishState('scripture', { v: 1, widgets: manifest });
  return true;
}

function scriptureSetValues(values) {
  if (!frontierIsAvailable({ requireModules: ['scripture'] })) return false;
  // values: { [widgetId]: number | string | { value, progress, ... } }
  frontierEmitValues('scripture', values);
  return true;
}

// Convenience: combined set. Publishes manifest once per change, values every turn.
function scriptureSet(widgets) {
  scriptureSetManifest(widgets);
  const values = {};
  for (const w of widgets) {
    if (w.value !== undefined) values[w.id] = w.value;
  }
  if (Object.keys(values).length) scriptureSetValues(values);
}
```

### Example full scenario flow

```js
// Library
// (paste base Frontier Library here)
// (paste Scripture adapter here)

state.game = state.game ?? { hp: 100, gold: 0 };
```

```js
// Context Modifier (REQUIRED when any module uses text transport)
const modifier = (text) => ({ text: frontierContextModifier(text) });
modifier(text);
```

```js
// Output Modifier
const modifier = (text) => {
  // 1. Drain any card-transport responses from earlier turns.
  const responses = frontierPoll();

  // 2. Do game logic.
  state.game.hp = Math.max(0, state.game.hp - 5);
  state.game.gold += 10;

  // 3. Publish widget manifest (persistent — card transport).
  //    In practice you'd only call this when the widget SET changes, not every turn.
  scriptureSetManifest([
    { id: 'hp-bar', type: 'bar', label: 'HP', max: 100, color: 'green', align: 'center' },
    { id: 'gold',   type: 'stat', label: 'Gold', align: 'right' },
  ]);

  // 4. Publish current values (ephemeral — text transport, reverts with undo).
  scriptureSetValues({
    'hp-bar': state.game.hp,
    'gold':   state.game.gold,
  });

  // 5. Flush card-transport outbox and append the text-transport frame to output.
  frontierFlush();
  return { text: frontierAppendTextFrame(text) };
};
modifier(text);
```

Three hooks total: Library (setup), Context Modifier (strips invisible chars from AI input), Output Modifier (emits widget state). The Context Modifier is a one-liner. No hand-rolled regex. No boilerplate beyond pasting the Library snippet.

## Extensibility roadmap (post-MVP)

The module interface is designed so these three future loaders plug in without refactoring Core or existing modules:

### Phase 2: Curated module registry

- A registry hosted on BetterRepository (or a sub-domain) lists vetted third-party modules.
- Each registry entry includes: module id, display name, description, BD-side JS source URL, AI-Dungeon-side Library snippet, SHA-256 of the JS.
- A new UI in BD's popup / settings lets the user browse, install, and enable registry modules.
- On install, BD fetches the JS, verifies the hash, stores it in `chrome.storage.local`, and calls `core.registerModule(parsed)` on next startup.
- Scripts can pre-flight-check registry modules in the same heartbeat-based way.

### Phase 3: Sandboxed user scripts

- Users paste arbitrary JS into a settings panel.
- BD runs it in an iframe sandbox or Web Worker with a constrained Frontier SDK exposed.
- Permissions prompts gate access to network, storage, clipboard, etc.
- Core-side: loader constructs a `FrontierModule` object whose `ops` handlers postMessage into the sandbox; responses come back the same way.

### Phase 4: Frontier inter-module communication

- Modules can call other modules via Core. E.g. a "Scenario Stats Dashboard" module could be a composite that reads from Scripture and several data-fetching modules.
- Reuses the same envelope machinery; just internal routing instead of wire traffic.

## Module ID namespacing conventions

| Prefix | Meaning |
|--------|---------|
| `_core` | Reserved for Frontier Core itself |
| No prefix, short lowercase (e.g. `scripture`, `websearch`) | First-party built-in modules |
| `<author>.<module>` (e.g. `robyn.dicebot`) | Third-party modules (registry or user-scripted) |

Core will reject registration attempts for unprefixed ids that conflict with reserved first-party ids.

## Naming conventions inside the codebase

- Module files: `modules/<module_id>/module.js` (entry point), plus as many siblings as the module needs.
- Module class names: `ScriptureModule`, `WebFetchModule`, etc. PascalCase.
- Op handlers within a module: lowercase camelCase matching the wire `op` name.
- Ops on the wire: lowercase camelCase. No spaces, no dots.
