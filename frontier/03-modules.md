# 03 — Modules

## What a module is

A **Frontier module** is a matched pair:

1. **AI-Dungeon-side Library snippet** — JavaScript the user pastes into their scenario's Library tab. Provides the in-script API for calling the module's ops.
2. **BetterDungeon-side handler** — JavaScript loaded by the extension. Registers with Frontier Core; implements the ops' actual logic (widget rendering, network fetches, filesystem access, etc.).

Frontier Core is the only thing that bridges the two. Neither half knows anything about the other's implementation — they share only the protocol envelope shape.

## Module interface (BD side)

Every BD-side module exports an object conforming to this shape. Modules are a la carte: declare `stateNames` to consume state cards, declare `ops` to expose ops, or both.

```ts
interface FrontierModule {
  /** Unique module id. Must match heartbeat advertisement. Lowercase, no spaces/dots. */
  id: string;

  /** SemVer version of this module's BD-side handler. */
  version: string;

  /** Human-readable label for the popup UI. */
  label: string;

  /** Long description for settings / module registry UI. */
  description?: string;

  /**
   * Overrides the registry's default enablement. Built-in first-party modules
   * default on unless this is explicitly false; third-party ids default off.
   */
  defaultEnabled?: boolean;

  /**
   * The `frontier:state:<name>` card titles this module reads.
   * When any of these change, Core calls `onStateChange`. Omit for pure ops modules.
   */
  stateNames?: string[];

  /**
   * Ops this module exposes over the Full-profile `frontier:out` channel.
   * Each handler receives args (deserialized from the request envelope) + ctx,
   * returns a JSON-serializable result (wrapped in `{ status: 'ok', data }`),
   * or throws a structured error (wrapped in `{ status: 'err', error }`).
   */
  ops?: {
    [opName: string]: OpHandler | OpDescriptor;
  };

  /**
   * If true, Core also invokes `onStateChange` (with the cached parsed state)
   * whenever the current live count changes, even if the card itself didn't change.
   * Scripture sets this to true so widgets re-read `history[liveCount]` on undo/retry.
   */
  tracksLiveCount?: boolean;

  /**
   * Called when one of this module's state cards changes, or (if `tracksLiveCount`)
   * when the live count changes. `parsed` is the module's own cached parse
   * of the state card's `value`; `ctx.getLiveCount()` gives the key to look up.
   */
  onStateChange?(name: string, parsed: unknown, ctx: FrontierContext): void;

  /** Lifecycle hooks. */
  onEnable?: (ctx: FrontierContext) => Promise<void> | void;
  onDisable?: (ctx: FrontierContext) => Promise<void> | void;

  /** Called on adventure transitions so modules can reset per-adventure state. */
  onAdventureChange?: (newAdventureShortId: string | null, ctx: FrontierContext) => void;
}

type OpHandler = (args: unknown, ctx: FrontierContext) => Promise<unknown> | unknown;

interface OpDescriptor {
  handler: OpHandler;
  /** 'safe' = re-invoke on reload; 'unsafe' = convert pending to err:timeout instead. Default 'safe'. */
  idempotent?: 'safe' | 'unsafe';
  /** Max ms before Core times out the op. Default 30_000. */
  timeoutMs?: number;
}

interface FrontierContext {
  /** Log (respects Frontier's debug toggle). */
  log(level: 'debug' | 'info' | 'warn' | 'error', ...args: unknown[]): void;

  /** Read current adventure state. */
  readonly adventureShortId: string | null;
  getActions(): Action[];
  getCurrentActionId(): string | null;
  getLiveCount(): number;

  /** Write a story card via the write queue. Coalesced, serialized, retrying. */
  writeCard(title: string, value: string, opts?: { type?: string; keys?: string }): Promise<void>;

  /** Respond to an in-flight op (normally handled by returning/throwing from the handler;
   *  these helpers are for advanced cases like multi-turn ops). */
  respond(requestId: string, data: unknown): void;
  respondError(requestId: string, error: { code: string; message?: string; [k: string]: unknown }): void;

  /** Per-module persistent key-value store backed by chrome.storage.sync
   *  under a per-module namespace. Intended for small prefs (allowlists, etc.). */
  storage: {
    get<T = unknown>(key: string, fallback?: T): Promise<T>;
    set(key: string, value: unknown): Promise<void>;
    remove(key: string): Promise<void>;
  };
}
```

**Backward shape notes:** Lite modules that only declare `stateNames` + `onStateChange` work unchanged. `ctx.respond` / `ctx.respondError` are present but no-ops when the module declares no `ops`. Modules that don't need `tracksLiveCount` can omit it (defaults to `false`).

## Handler rules

### State handlers (`onStateChange`)
- MUST NOT throw synchronously. Catch errors internally, log via `ctx.log`, and no-op if state is malformed.
- MAY be called many times per turn (once per card change, plus one extra on live-count change if `tracksLiveCount`). MUST be idempotent — same input produces same effect.
- MUST check `ctx.adventureShortId` before touching cross-turn persistence. Per-adventure state is the module's responsibility.
- `ctx.getCurrentActionId()` may be `null` early in load (before the action window arrives). Modules should fall back to the most-recent history entry or to manifest defaults in that case.

### Op handlers (`ops.<opName>`)
- MUST be `async` OR return a Promise if the work is asynchronous. Sync returns are supported for trivially deterministic ops (e.g. Clock's `now`).
- MUST return a JSON-serializable value OR throw an object `{ code, message?, ... }`. Thrown `Error` instances are wrapped as `{ code: 'handler_threw', message: err.message }`.
- MUST NOT rely on module-level mutable state for correctness across handler invocations, because Core may replay a handler on BD reload if the op is marked `idempotent: 'safe'` (which is the default). Use `ctx.storage` for anything that needs to persist.
- SHOULD validate args at the top of the handler and throw `{ code: 'invalid_args', message: '...' }` on rejection.
- SHOULD honor `args.timeoutMs` if provided, otherwise rely on Core's per-op default timeout.
- MUST NOT touch module-specific DOM or UI. UI-producing modules (Scripture) are state-only by design; ops-producing modules (WebFetch, Clock) are background workers.
- For multi-turn ops, return a `Promise` that resolves / rejects across turn boundaries. Core writes `pending` immediately and the terminal status when the Promise settles. The script polls across turns.

## Module registration

In the extension's bootstrap (e.g. `main.js` or Frontier's own init), modules register themselves:

```js
// services/frontier/core.js exposes the singleton.
const core = FrontierCore.instance;
core.registerModule(ScriptureModule);
core.registerModule(WebFetchModule);
core.registerModule(ClockModule);
```

Registration triggers:
1. Core adds the module to its `Map<id, module>`.
2. Core calls the module's `onEnable` if the user has it enabled (default: true for built-ins unless `defaultEnabled: false`; false for third-party ids).
3. Core updates the heartbeat card to advertise the new module (including its `ops` list if it has any).
4. The popup UI's Frontier section gains a toggle for the module (plus a consent sub-panel for WebFetch).

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
Ops dispatcher drops the module from its routing table; any pending
requests for that module receive err: unknown_module responses.
         │
         ▼
Scripts reading heartbeat on next turn see the module gone,
either gracefully degrade or surface a "module X unavailable" notice
```

## Module lifecycle for Scripture (state-only reference)

Scripture reads a single `frontier:state:scripture` card containing manifest + history. Widget structure comes from the manifest; widget values come from `history[ctx.getLiveCount()]` with graceful fallbacks. Undo/retry just changes which history key BD reads.

```
Declared config:
  id: 'scripture'
  stateNames: ['scripture']
  tracksLiveCount: true
  // No ops — pure state consumer.

onEnable(ctx):
  - Mount the widget container in the DOM if not already present.
  - If there's already a `frontier:state:scripture` card, synthesize an
    onStateChange call to hydrate immediately.
  - Install resize/layout observers.

onStateChange('scripture', parsed, ctx):
  // Called when the card changes OR when ctx.getLiveCount() changes (because tracksLiveCount=true).
  - Validate parsed.manifest via validators.js. Drop invalid widgets with a warning.
  - Reconcile widget DOM against parsed.manifest.widgets:
      create new widgets, update changed structure, destroy removed ones.
  - Compute values = parsed.history[String(ctx.getLiveCount())]
                      ?? mostRecentEntry(parsed.history)
                      ?? {};
  - For each widget in the manifest, apply values[widget.id] if present;
    otherwise fall back to manifest-declared defaults or leave blank.

onAdventureChange(newAdventureShortId, ctx):
  - Clear widget cache.
  - Wait for the next onStateChange (Core will synthesize one if there's a card).

onDisable(ctx):
  - Tear down all widgets.
  - Remove the widget container from the DOM.
  - Disconnect observers.
```

**Why this works:** the manifest is structural (rarely changes) and should persist across undo (the user undoing a turn shouldn't un-add a widget that was defined turns ago). The history map holds per-turn values; BD picks whichever entry corresponds to the current live-count ordinal. If the user undoes from turn 10 to turn 5, `ctx.getLiveCount()` changes, Core re-invokes `onStateChange`, Scripture looks up `history['5']`, and widgets show their turn-5 values. No invisible characters required.

## AI-Dungeon-side Library

Every module ships a short Library snippet the user pastes into their scenario. Frontier provides a shared base Library the user pastes once; per-module adapters are small additions on top.

The base Library has three responsibilities:
1. Availability detection (heartbeat reader).
2. State-card writing (`frontier:state:*`).
3. Ops-channel request/response (`frontier:out` / `frontier:in:*`).

That's it. No codec. No Context Modifier. The Library handles request queueing, response polling, and acks under the hood.

### Base Frontier Library (pasted once per scenario)

```js
// === Frontier Base Library (v1) ==============================================
state.frontier = state.frontier ?? {};

// --- Heartbeat / availability ----------------------------------------------
function frontierHeartbeat() {
  const card = storyCards.find(c => c.title === 'frontier:heartbeat');
  if (!card) return null;
  try { return JSON.parse(card.entry || card.value || '{}'); } catch { return null; }
}

function frontierIsAvailable(opts = {}) {
  const { maxStaleTurns = 2, requireModules = [], requireProfile = 'full' } = opts;
  const hb = frontierHeartbeat();
  if (!hb || hb.frontier?.protocol !== 1) return false;
  if (hb.frontier.profile !== requireProfile) return false;
  if (typeof hb.turn === 'number' && info.actionCount - hb.turn > maxStaleTurns) return false;
  if (requireModules.length) {
    const avail = new Set((hb.modules || []).map(m => m.id));
    if (!requireModules.every(m => avail.has(m))) return false;
  }
  return true;
}

// --- Current action id / live count ------------------------------------------
function frontierCurrentLiveCount() {
  // AI Dungeon exposes the action history; its length is the live count.
  // Note: history[] excludes undone actions.
  return history.length;
}

function frontierCurrentActionId() {
  // AI Dungeon exposes the action history; the tail is the current turn's action.
  if (history.length > 0) {
    const tail = history[history.length - 1];
    if (tail && tail.id) return tail.id; // Only available in some contexts
  }
  return String(frontierCurrentLiveCount()); // Fallback for script-side actionId
}

// --- State card I/O ----------------------------------------------------------
function frontierReadCard(title) {
  const card = storyCards.find(c => c.title === title);
  if (!card) return null;
  try { return JSON.parse(card.entry || card.value || '{}'); } catch { return null; }
}

function frontierWriteCard(title, obj) {
  const json = JSON.stringify(obj);
  const idx = storyCards.findIndex(c => c.title === title);
  if (idx === -1) {
    addStoryCard(title, json, 'Frontier');
  } else {
    const c = storyCards[idx];
    updateStoryCard(idx, c.keys || title, json, c.type || 'Frontier');
  }
}

function frontierReadState(name) {
  return frontierReadCard('frontier:state:' + name);
}

function frontierWriteState(name, obj) {
  frontierWriteCard('frontier:state:' + name, obj);
}

// --- Action-ID history helper ------------------------------------------------
// For modules that want the undo/retry-correct behavior without hand-rolling it.
function frontierUpdateHistory(name, values, opts = {}) {
  const { historyLimit = 100, manifest } = opts;
  const liveCount = frontierCurrentLiveCount();
  if (liveCount === 0) return false; // No current action; can't key the entry.

  const existing = frontierReadState(name) ?? { v: 1, history: {} };
  existing.v = 1;
  existing.history = existing.history || {};
  existing.history[String(liveCount)] = values; // Key by stringified liveCount
  if (manifest !== undefined) existing.manifest = manifest;
  existing.historyLimit = historyLimit;

  // Prune oldest by insertion order. In practice we re-sort by the script's
  // own action sequence via state.frontier._historyOrder[<name>].
  const order = (state.frontier._historyOrder = state.frontier._historyOrder || {});
  const list = (order[name] = order[name] || []);
  if (!list.includes(liveCount)) list.push(liveCount); // Track liveCount, not actionId
  while (list.length > historyLimit) {
    const drop = list.shift();
    delete existing.history[String(drop)]; // Delete by stringified liveCount
  }

  frontierWriteState(name, existing);
  return true;
}

// --- Ops channel -------------------------------------------------------------
// Manages the frontier:out / frontier:in:<module> cards.
state.frontier._ops = state.frontier._ops ?? {
  requestIdCounter: 0,
  pendingRequests: {},
  responseCache: {},
  acks: [],
};

function _frontierWriteOutCard() {
  const requests = Object.values(state.frontier._ops.pendingRequests);
  const acks = state.frontier._ops.acks;
  const payload = { v: 1, requests, acks };
  frontierWriteCard('frontier:out', payload);
  state.frontier._ops.acks = []; // Clear acks after writing
}

function frontierCall(module, op, args = {}, opts = {}) {
  if (!frontierIsAvailable({ requireModules: [module], requireProfile: 'full' })) {
    console.warn(`Frontier: Module ${module} not available or profile not full. Op ${op} not sent.`);
    return Promise.reject({ code: 'unavailable', message: `Module ${module} unavailable or Frontier profile not full.` });
  }

  const liveCount = frontierCurrentLiveCount();
  const requestId = `${liveCount}-${module}-${++state.frontier._ops.requestIdCounter}`;
  const request = { id: requestId, module, op, args, ts: Date.now() };

  state.frontier._ops.pendingRequests[requestId] = request;
  _frontierWriteOutCard();

  return new Promise((resolve, reject) => {
    state.frontier._ops.pendingRequests[requestId].__resolve = resolve;
    state.frontier._ops.pendingRequests[requestId].__reject = reject;
  });
}

function frontierPoll(requestId) {
  const module = requestId.split('-')[1]; // e.g., '42-webfetch-1' -> 'webfetch'
  const card = frontierReadCard(`frontier:in:${module}`);
  if (!card || !card.responses || !card.responses[requestId]) return null;

  const response = card.responses[requestId];
  if (response.status !== 'pending') {
    state.frontier._ops.acks.push(requestId);
    _frontierWriteOutCard(); // Ack immediately
    delete state.frontier._ops.pendingRequests[requestId];
  }
  return response;
}

function frontierPollAll() {
  // Scan all frontier:in:<module> cards for completed responses.
  const allResponses = {};
  for (const card of storyCards) {
    if (card.title.startsWith('frontier:in:')) {
      const module = card.title.substring('frontier:in:'.length);
      try {
        const parsed = JSON.parse(card.entry || card.value || '{}');
        if (parsed.responses) {
          for (const requestId in parsed.responses) {
            if (parsed.responses[requestId].status !== 'pending') {
              allResponses[requestId] = parsed.responses[requestId];
              state.frontier._ops.acks.push(requestId);
              delete state.frontier._ops.pendingRequests[requestId];
            }
          }
        }
      } catch (e) { console.error(`Frontier: Failed to parse ${card.title}:`, e); }
    }
  }
  if (Object.keys(allResponses).length > 0) {
    _frontierWriteOutCard(); // Ack all found responses
  }
  return allResponses;
}

// This should be called once per turn by the script to process responses.
state.frontier._processResponses = state.frontier._processResponses ?? (() => {
  const allResponses = frontierPollAll();
  for (const requestId in allResponses) {
    const response = allResponses[requestId];
    const pending = state.frontier._ops.pendingRequests[requestId];
    if (pending) {
      if (response.status === 'ok') {
        pending.__resolve(response.data);
      } else {
        pending.__reject(response.error);
      }
    }
  }
});

// Call _processResponses at the end of each turn.
// This assumes the script runs in an Output Modifier.
// If the script runs in an Input Modifier, it should call this manually.
if (typeof onOutput === 'function') {
  const originalOnOutput = onOutput;
  onOutput = (text) => {
    state.frontier._processResponses();
    return originalOnOutput(text);
  };
} else {
  // If no onOutput, assume manual polling or call it here if appropriate.
  // For simplicity, we'll just call it once at the end of the script for now.
  state.frontier._processResponses();
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

  // Split: structure goes in manifest, values go in history[currentLiveCount].
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

### WebFetch Library adapter (pasted after the base Library)

```js
// === WebFetch (Frontier HTTP Module) ==========================================
// Usage:
//   // WebFetch v1 is safe-method-only: GET, HEAD, OPTIONS.
//   frontierCall('webfetch', 'fetch', { url: 'https://api.example.com/data' })
//     .then(response => { /* ... */ })
//     .catch(error => { /* ... */ });
//   frontierCall('webfetch', 'search', { query: 'AI Dungeon Frontier' })
//     .then(result => { /* ... */ });

// No specific script-side state or functions needed beyond frontierCall.
// The module is primarily used via the generic frontierCall API.
```

### Clock Library adapter (pasted after the base Library)

```js
// === Clock (Frontier Time Module) =============================================
// Usage:
//   frontierCall('clock', 'now').then(time => console.log(time.local));
//   frontierCall('clock', 'tz', { timeZone: 'America/Chicago' })
//     .then(info => console.log(info.offset));
//   frontierCall('clock', 'format', { ts: Date.now(), format: 'YYYY-MM-DD', timeZone: 'UTC' })
//     .then(formatted => console.log(formatted));

// No specific script-side state or functions needed beyond frontierCall.
// The module is primarily used via the generic frontierCall API.
```

### Geolocation Library adapter (pasted after the base Library)

```js
// === Geolocation (Frontier Location Module) ==================================
// Usage:
//   frontierCall('geolocation', 'permission')
//     .then(status => console.log(status.permissionState));
//   frontierCall('geolocation', 'getCurrent', {
//     highAccuracy: false,
//     timeoutMs: 15000,
//     maximumAgeMs: 60000,
//   }).then(position => console.log(position.latitude, position.longitude));

// No specific script-side state or functions needed beyond frontierCall.
// The module is primarily used via the generic frontierCall API.
```

### Weather Library adapter (pasted after the base Library)

```js
// === Weather (Frontier Weather Module) =======================================
// Usage:
//   frontierCall('weather', 'current', { place: 'Houston', units: 'imperial' })
//     .then(report => console.log(report.current.weather, report.current.temperature));
//   frontierCall('weather', 'forecast', {
//     latitude: 29.7604,
//     longitude: -95.3698,
//     days: 3,
//     units: 'imperial',
//   }).then(report => console.log(report.days));

// No specific script-side state or functions needed beyond frontierCall.
// The module is primarily used via the generic frontierCall API.
```

### Network Library adapter (pasted after the base Library)

```js
// === Network (Frontier Connectivity Module) ==================================
// Usage:
//   frontierCall('network', 'status')
//     .then(status => console.log(status.online, status.quality));

// No specific script-side state or functions needed beyond frontierCall.
// The module is primarily used via the generic frontierCall API.
```

### System Library adapter (pasted after the base Library)

```js
// === System (Frontier Device/Environment Module) =============================
// Usage:
//   frontierCall('system', 'info')
//     .then(info => console.log(info.deviceClass, info.platform.family));
//   frontierCall('system', 'power')
//     .then(power => console.log(power.supported, power.state, power.levelPercent));

// No specific script-side state or functions needed beyond frontierCall.
// The module is primarily used via the generic frontierCall API.
```

### Example full scenario flow

```js
// Library
// (paste base Frontier Library here)
// (paste Scripture adapter here)
// (paste WebFetch adapter here)
// (paste Clock adapter here)
// (paste System adapter here if using environment hints)

state.game = state.game ?? { hp: 100, gold: 0 };
```

```js
// Output Modifier
const modifier = (text) => {
  // 1. Do game logic.
  state.game.hp = Math.max(0, state.game.hp - 5);
  state.game.gold += 10;

  // 2. Publish widget state. Scripture handles live-count history under the hood.
  scriptureSet([
    { id: 'hp-bar', type: 'bar',  label: 'HP',   value: state.game.hp,   max: 100, color: 'green', align: 'center' },
    { id: 'gold',   type: 'stat', label: 'Gold', value: state.game.gold,                            align: 'right' },
  ]);

  // 3. Example of calling a safe ops module.
  if (state.game.hp < 20 && !state.game.lookedUpPotionHint) {
    frontierCall('webfetch', 'search', { query: 'fantasy healing potion ideas' })
      .then(res => console.log('Potion hint search:', res))
      .catch(err => console.error('Potion hint search failed:', err));
    state.game.lookedUpPotionHint = true;
  }

  return { text };
};
modifier(text);
```

**Two hooks total.** Library (setup) + Output Modifier (publish state + enqueue ops). No Input Modifier, no Context Modifier, no invisible characters in the output text. The entire scenario integration is concise and clear.

### What about undo / retry?

Nothing. The script just writes `history[currentActionId] = values` every turn. If the user undoes, AI Dungeon drops the tail action from `history`; BD's `currentActionId` changes; BD reads `history[newTailId]` from the same unchanged state card and shows those older values. The script doesn't need to know or care.

## Extensibility roadmap (post-MVP)

The module interface is designed so these three future loaders plug in without refactoring Core or existing modules:

### Post-V2: Curated module registry

- A registry hosted on BetterRepository (or a sub-domain) lists vetted third-party modules.
- Each registry entry includes: module id, display name, description, BD-side JS source URL, AI-Dungeon-side Library snippet, SHA-256 of the JS.
- A new UI in BD's popup / settings lets the user browse, install, and enable registry modules.
- On install, BD fetches the JS, verifies the hash, stores it in `chrome.storage.local`, and calls `core.registerModule(parsed)` on next startup.
- Scripts can pre-flight-check registry modules in the same heartbeat-based way.

### Post-V2: Sandboxed user scripts

- Users paste arbitrary JS into a settings panel.
- BD runs it in an iframe sandbox or Web Worker with a constrained Frontier SDK exposed.
- Permissions prompts gate access to network, storage, clipboard, etc.
- Core-side: loader constructs a `FrontierModule` object whose `ops` handlers postMessage into the sandbox; responses come back the same way.

### Post-V2: Frontier inter-module communication

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
