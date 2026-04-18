# 03 — Modules

## What a module is

A **Frontier module** is a matched pair:

1. **AI-Dungeon-side Library snippet** — JavaScript the user pastes into their scenario's Library tab. Provides the in-script API for calling the module's ops.
2. **BetterDungeon-side handler** — JavaScript loaded by the extension. Registers with Frontier Core; implements the ops' actual logic (widget rendering, network fetches, filesystem access, etc.).

Frontier Core is the only thing that bridges the two. Neither half knows anything about the other's implementation — they share only the protocol envelope shape.

## Module interface (BD side, Lite)

Every BD-side module exports an object conforming to this shape:

```ts
interface FrontierModule {
  /** Unique module id. Must match heartbeat advertisement. */
  id: string;

  /** SemVer version of this module's BD-side handler. */
  version: string;

  /** Human-readable label for the popup UI. */
  label: string;

  /** Long description for settings / module registry UI. */
  description?: string;

  /**
   * The `frontier:state:<name>` card titles this module reads.
   * When any of these change, Core calls `onStateChange`.
   */
  stateNames: string[];

  /**
   * If true, Core also invokes `onStateChange` (with the cached parsed state)
   * whenever the current tail action id changes, even if the card itself didn't change.
   * Scripture sets this to true so widgets re-read `history[tailId]` on undo/retry.
   */
  tracksActionId?: boolean;

  /**
   * Called when one of this module's state cards changes, or (if `tracksActionId`)
   * when the tail action id changes. `parsed` is the module's own cached parse
   * of the state card's `value`; `ctx.currentActionId` tells the module which
   * history entry to look up.
   */
  onStateChange(name: string, parsed: unknown, ctx: FrontierContext): void;

  /** Lifecycle hooks. */
  onEnable?: (ctx: FrontierContext) => Promise<void> | void;
  onDisable?: (ctx: FrontierContext) => Promise<void> | void;

  /** Called on adventure transitions so modules can reset per-adventure state. */
  onAdventureChange?: (newAdventureId: string | null, ctx: FrontierContext) => void;
}

interface FrontierContext {
  /** Log (respects Frontier's debug toggle). */
  log(msg: string, ...args: unknown[]): void;

  /** Access to the story-card stream for reads that aren't about state cards. */
  readonly cards: CardStreamReadOnly;

  /** Current adventure id (null if not in an adventure). */
  readonly adventureId: string | null;

  /** The current tail action id from the WS stream, or null if not yet known. */
  readonly currentActionId: string | null;

  /** AI Dungeon's actionCount for the current tail action. */
  readonly turn: number;
}
```

**What's NOT here in Lite:**
- No `ops`, no request dispatch, no `respond` / `emit` helpers. Modules are read-only state consumers.
- No `defaultTransport` or `usesText`. There's only one transport.
- When Full Frontier lands, `ops` + `ctx.respond` + `ctx.emit` extend this interface additively; Lite modules continue to work as-is.

## Handler rules

- `onStateChange` MUST NOT throw synchronously. Catch errors internally, log via `ctx.log`, and no-op if state is malformed.
- `onStateChange` handlers MAY be called many times per turn (once per card change, plus one extra on action-id change if `tracksActionId`). They MUST be idempotent.
- Modules MUST check `ctx.adventureId` before touching cross-turn persistence. Per-adventure state is the module's responsibility.
- `ctx.currentActionId` may be `null` early in load (before the action window arrives). Modules should fall back to the most-recent history entry or to manifest defaults in that case.

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

Scripture reads a single `frontier:state:scripture` card containing manifest + history. Widget structure comes from the manifest; widget values come from `history[ctx.currentActionId]` with graceful fallbacks. Undo/retry just changes which history key BD reads.

```
Declared config:
  id: 'scripture'
  stateNames: ['scripture']
  tracksActionId: true

onEnable(ctx):
  - Mount the widget container in the DOM if not already present.
  - If there's already a `frontier:state:scripture` card, synthesize an
    onStateChange call to hydrate immediately.
  - Install resize/layout observers.

onStateChange('scripture', parsed, ctx):
  // Called when the card changes OR when ctx.currentActionId changes (because tracksActionId=true).
  - Validate parsed.manifest via validators.js. Drop invalid widgets with a warning.
  - Reconcile widget DOM against parsed.manifest.widgets:
      create new widgets, update changed structure, destroy removed ones.
  - Compute values = parsed.history[ctx.currentActionId]
                      ?? mostRecentEntry(parsed.history)
                      ?? {};
  - For each widget in the manifest, apply values[widget.id] if present;
    otherwise fall back to manifest-declared defaults or leave blank.

onAdventureChange(newAdventureId, ctx):
  - Clear widget cache.
  - Wait for the next onStateChange (Core will synthesize one if there's a card).

onDisable(ctx):
  - Tear down all widgets.
  - Remove the widget container from the DOM.
  - Disconnect observers.
```

**Why this works:** the manifest is structural (rarely changes) and should persist across undo (the user undoing a turn shouldn't un-add a widget that was defined turns ago). The history map holds per-turn values; BD picks whichever entry corresponds to the current tail. If the user undoes from turn 10 to turn 5, `ctx.currentActionId` changes, Core re-invokes `onStateChange`, Scripture looks up `history[turn-5-id]`, and widgets show their turn-5 values. No invisible characters required.

## AI-Dungeon-side Library

Every module ships a short Library snippet the user pastes into their scenario. Frontier provides a shared base Library the user pastes once; per-module adapters are small additions on top.

The base Library has two responsibilities:
1. Availability detection (heartbeat reader).
2. State-card writing (`frontier:state:*`).

That's it. No codec. No Context Modifier. No request queue. No response polling. No acks.

### Base Frontier Library (pasted once per scenario)

```js
// === Frontier Base Library (v1, Lite) ========================================
state.frontier = state.frontier ?? {};

// --- Heartbeat / availability ----------------------------------------------
function frontierHeartbeat() {
  const card = storyCards.find(c => c.title === 'frontier:heartbeat');
  if (!card) return null;
  try { return JSON.parse(card.entry || card.value || '{}'); } catch { return null; }
}

function frontierIsAvailable(opts = {}) {
  const { maxStaleTurns = 2, requireModules = [] } = opts;
  const hb = frontierHeartbeat();
  if (!hb || hb.frontier?.protocol !== 1) return false;
  if (typeof hb.turn === 'number' && info.actionCount - hb.turn > maxStaleTurns) return false;
  if (requireModules.length) {
    const avail = new Set((hb.modules || []).map(m => m.id));
    if (!requireModules.every(m => avail.has(m))) return false;
  }
  return true;
}

// --- Current action id ------------------------------------------------------
function frontierCurrentActionId() {
  // AI Dungeon exposes the action history; the tail is the current turn's action.
  if (typeof history !== 'undefined' && history.length > 0) {
    const tail = history[history.length - 1];
    if (tail && tail.id) return tail.id;
  }
  return null;
}

// --- State card I/O ---------------------------------------------------------
function frontierReadState(name) {
  const title = 'frontier:state:' + name;
  const card = storyCards.find(c => c.title === title);
  if (!card) return null;
  try { return JSON.parse(card.entry || card.value || '{}'); } catch { return null; }
}

function frontierWriteState(name, obj) {
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

// --- Action-ID history helper ----------------------------------------------
// For modules that want the undo/retry-correct behavior without hand-rolling it.
function frontierUpdateHistory(name, values, opts = {}) {
  const { historyLimit = 100, manifest } = opts;
  const actionId = frontierCurrentActionId();
  if (!actionId) return false; // No current action; can't key the entry.

  const existing = frontierReadState(name) ?? { v: 1, history: {} };
  existing.v = 1;
  existing.history = existing.history || {};
  existing.history[actionId] = values;
  if (manifest !== undefined) existing.manifest = manifest;
  existing.historyLimit = historyLimit;

  // Prune oldest by insertion order. In practice we re-sort by the script's
  // own action sequence via state.frontier._historyOrder[<name>].
  const order = (state.frontier._historyOrder = state.frontier._historyOrder || {});
  const list = (order[name] = order[name] || []);
  if (!list.includes(actionId)) list.push(actionId);
  while (list.length > historyLimit) {
    const drop = list.shift();
    delete existing.history[drop];
  }

  frontierWriteState(name, existing);
  return true;
}
```

That's the whole base Library. About 60 lines. No Context Modifier required.

### Scripture Library adapter (pasted after the base Library)

```js
// === Scripture (Frontier Widget Module) =======================================
// Usage:
//   scriptureConfigure({ historyLimit: 100 });   // optional; defaults shown
//   scriptureSet([
//     { id: 'hp-bar', type: 'bar', label: 'HP', value: 75, max: 100, color: 'green', align: 'center' },
//     { id: 'gold',   type: 'stat', label: 'Gold', value: 1250, align: 'right' },
//   ]);

state.scripture = state.scripture ?? { historyLimit: 100 };

function scriptureConfigure(opts = {}) {
  if (typeof opts.historyLimit === 'number') state.scripture.historyLimit = opts.historyLimit;
}

function scriptureSet(widgets) {
  if (!frontierIsAvailable({ requireModules: ['scripture'] })) return false;

  // Split: structure goes in manifest, values go in history[currentActionId].
  const manifest = { widgets: widgets.map(({ value, progress, ...rest }) => rest) };
  const values = {};
  for (const w of widgets) {
    if (w.value !== undefined) values[w.id] = w.value;
    if (w.progress !== undefined) values[w.id + '__progress'] = w.progress;
  }

  return frontierUpdateHistory('scripture', values, {
    historyLimit: state.scripture.historyLimit,
    manifest,
  });
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
// Output Modifier
const modifier = (text) => {
  // 1. Do game logic.
  state.game.hp = Math.max(0, state.game.hp - 5);
  state.game.gold += 10;

  // 2. Publish widget state. Scripture handles action-id history under the hood.
  scriptureSet([
    { id: 'hp-bar', type: 'bar',  label: 'HP',   value: state.game.hp,   max: 100, color: 'green', align: 'center' },
    { id: 'gold',   type: 'stat', label: 'Gold', value: state.game.gold,                            align: 'right' },
  ]);

  return { text };
};
modifier(text);
```

**Two hooks total.** Library (setup) + Output Modifier (publish state). No Input Modifier, no Context Modifier, no invisible characters in the output text. The entire scenario integration fits in ~15 lines of user code.

### What about undo / retry?

Nothing. The script just writes `history[currentActionId] = values` every turn. If the user undoes, AI Dungeon drops the tail action from `history`; BD's `currentActionId` changes; BD reads `history[newTailId]` from the same unchanged state card and shows those older values. The script doesn't need to know or care.

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
