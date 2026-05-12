# 02 - Modules

> This document describes how Frontier modules work in the current BetterDungeon implementation, what the live module contract looks like, and how to build a new module that fits the system cleanly.

## What a module is

A Frontier module is a BetterDungeon-side capability that plugs into the shared Frontier runtime.

A module can do one or both of these things:

- read Frontier state cards such as `frontier:state:scripture`
- expose callable ops that scripts can reach through the `frontier:out` / `frontier:in:<module>` request-response path

That is the core model. A module does not need a special profile, mode, or exception case.

In practice:

- `scripture` is the reference state-reading module
- `webfetch`, `clock`, `geolocation`, `weather`, `network`, `system`, and `ai` are ops modules

## Current shipped modules

Frontier currently ships these first-party modules:

- `scripture`
- `webfetch`
- `clock`
- `geolocation`
- `weather`
- `network`
- `system`
- `ai`

Current ops exposed by those modules:

- `webfetch`: `fetch`, `search`
- `clock`: `now`, `tz`, `format`
- `geolocation`: `permission`, `getCurrent`
- `weather`: `current`, `forecast`
- `network`: `status`
- `system`: `info`, `power`
- `ai`: `chat`, `models`, `testConnection`

The `ai` module also keeps the alias `providerAI` for compatibility.

## How modules fit into Frontier

The live flow is:

1. A module registers with `window.Frontier.registry`.
2. The registry decides whether it should be enabled.
3. If enabled, the registry calls `mount(ctx)`.
4. Core dispatches matching state-card updates to `onStateChange(...)`.
5. Ops requests are routed to declared `ops` handlers by `ops-dispatcher.js`.
6. Core advertises the mounted module in `frontier:heartbeat`.

The important split is:

- Core owns dispatch and shared runtime state.
- The registry owns module lifecycle.
- The ops dispatcher owns request routing and response writing.

## The live module contract

The current BetterDungeon-side contract is defined by how [module-registry.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/module-registry.js) and [core.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/core.js) interact with modules.

```ts
interface FrontierModule {
  id: string;
  version?: string;
  label?: string;
  description?: string;
  aliases?: string[];
  defaultEnabled?: boolean;

  stateNames?: string[];
  tracksLiveCount?: boolean;

  ops?: Record<string, {
    handler: (args: unknown, ctx: FrontierContext) => unknown | Promise<unknown>;
    idempotent?: 'safe' | 'unsafe';
    timeoutMs?: number;
  }>;

  mount(ctx: FrontierContext): void;
  unmount?(): void;

  onEnable?(ctx: FrontierContext): void | Promise<void>;
  onDisable?(ctx: FrontierContext): void | Promise<void>;
  onStateChange?(name: string, parsed: unknown, ctx: FrontierContext): void;
  onAdventureChange?(shortId: string | null, ctx: FrontierContext): void;
}
```

Notes from the real implementation:

- `mount(ctx)` is required.
- `unmount()` is optional, but most real modules should have one.
- `stateNames` is how a module subscribes to `frontier:state:<name>` cards.
- `tracksLiveCount` tells Core to re-run `onStateChange(...)` when live count changes.
- `ops` is an object of named descriptors, not just raw functions.
- Built-in modules default to enabled unless overridden.
- Dotted ids are treated like third-party-style ids and default to disabled unless overridden.

## The live module context

Modules receive a scoped context from Core. The current live context includes:

```ts
interface FrontierContext {
  id: string;

  on(eventName: string, handler: (detail: unknown) => void): () => void;

  getState(name: string): unknown;
  getCardByTitle(title: string): unknown;

  readonly adventureShortId: string | null;
  getAdventureId(): string | null;
  getActions(): unknown[];
  getCurrentActionId(): string | null;
  getTail(): string | null;
  getLiveCount(): number;

  writeCard(title: string, value: string, opts?: Record<string, unknown>): Promise<unknown>;

  respond(requestId: string, data: unknown): Promise<unknown>;
  respondError(requestId: string, err: unknown): Promise<unknown>;

  log(level: 'debug' | 'info' | 'warn' | 'error', ...args: unknown[]): void;

  storage: {
    get(key: string, fallback?: unknown): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    remove(key: string): Promise<void>;
  };
}
```

What that means in practice:

- use `ctx.writeCard(...)` for any Frontier-owned card writes
- use `ctx.storage` for small persistent module preferences
- use `ctx.log(...)` instead of ad hoc console noise
- use `ctx.getLiveCount()` when your state is keyed by turn history rather than only by card content

## State modules

A state module reads one or more `frontier:state:<name>` cards and reacts when those cards change.

To build one:

- declare `stateNames`
- implement `onStateChange(...)`
- optionally set `tracksLiveCount: true` if the same card needs to render differently after undo, rewind, restore, or retry

### Scripture as the reference pattern

[modules/scripture/module.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/modules/scripture/module.js) is the clearest state-module example.

It does all of these things:

- declares `stateNames: ['scripture']`
- declares `tracksLiveCount: true`
- mounts a renderer in `mount(ctx)`
- clears its UI in `unmount()` and `onAdventureChange(...)`
- rerenders in `onStateChange(...)`
- picks values from `history[liveCount]`
- falls back gracefully when the exact live-count entry is missing

That last point matters. Scripture is not just reacting to card changes. It is reacting to "which turn are we currently on?" That is why `tracksLiveCount` exists.

### State-module rules

- `onStateChange(...)` should be safe to run many times.
- Treat parsed card data as untrusted input and validate it.
- If the state is malformed, log and no-op instead of crashing the runtime.
- If the module owns DOM, tear it down cleanly on disable or adventure change.
- If the module uses live-count history, do not key behavior only to tail action id.

## Ops modules

An ops module exposes callable work to scripts.

To build one:

- declare an `ops` object
- give each op a `handler`
- mark each op as `safe` or `unsafe` for replay
- set a reasonable timeout

Each op descriptor currently looks like this:

```js
someOp: {
  idempotent: 'safe',
  timeoutMs: 1000,
  handler: someOpHandler,
}
```

### How ops are executed

When a script writes a request into `frontier:out`:

1. `ops-dispatcher.js` parses the envelope.
2. It finds the target module and op.
3. It writes a pending response.
4. It runs the handler.
5. It writes either:
   - `ok`
   - `err`
   - `timeout`

Most modules should simply return a JSON-serializable value or throw an error.

### Ops-module rules

- Validate args at the top of the handler.
- Return plain serializable data.
- Throw clear structured errors when input is bad or work cannot be done.
- Use `idempotent: 'unsafe'` when replaying the op on reload would be wrong.
- Keep handler scope bounded and explicit.

The `ai.chat` op is the best example of an unsafe op. Replaying a hosted-model call is not the same as replaying a deterministic time lookup, so it is marked `unsafe`.

## Lifecycle hooks

Modules can participate in a few different moments:

- `mount(ctx)`: called when the module is enabled and mounted
- `onEnable(ctx)`: optional post-mount hook
- `onDisable(ctx)`: optional pre-unmount hook
- `unmount()`: teardown hook
- `onAdventureChange(shortId, ctx)`: reset per-adventure state without needing a full disable/enable cycle
- `onStateChange(name, parsed, ctx)`: state-card dispatch hook

What each is best for:

- Use `mount(ctx)` to set up long-lived module resources.
- Use `onEnable(ctx)` for lightweight startup behavior or logging.
- Use `onDisable(ctx)` to clear active behavior before teardown.
- Use `unmount()` to destroy DOM, timers, or held references.
- Use `onAdventureChange(...)` to clear per-adventure state.

## Registration

In the current codebase, first-party modules register themselves from their own module files if the Frontier registry is already present.

The registration call is simply:

```js
window.Frontier.registry.register(MyModule);
```

The registry then:

- stores the definition
- applies aliases
- checks enabled state
- mounts the module if it should be active
- replays cached state to newly enabled state modules
- schedules a fresh heartbeat so scripts can see the updated module list

## Building a new module

Use this process.

### 1. Decide what kind of module it is

Pick one:

- state-only
- ops-only
- mixed

Most modules should be clearly one or the other.

### 2. Create the module folder

Use the current convention:

```text
BetterDungeon/modules/<module-id>/module.js
```

Add sibling files if the module needs them.

Examples:

- validators
- renderers
- consent helpers
- normalizers

### 3. Write the module object

Minimal state-only example:

```js
const FrontierExampleStateModule = {
  id: 'exampleState',
  version: '1.0.0',
  label: 'Example State',
  description: 'Reads and reacts to a Frontier state card.',
  stateNames: ['exampleState'],

  mount(ctx) {
    this._ctx = ctx;
  },

  unmount() {
    this._ctx = null;
  },

  onStateChange(name, parsed, ctx) {
    if (name !== 'exampleState') return;
    ctx.log('debug', 'State changed:', parsed);
  },
};
```

Minimal ops-only example:

```js
async function pingOp(args, ctx) {
  return {
    ok: true,
    received: args ?? null,
    liveCount: ctx.getLiveCount(),
  };
}

const FrontierExampleOpsModule = {
  id: 'exampleOps',
  version: '1.0.0',
  label: 'Example Ops',
  description: 'Exposes a simple Frontier op.',

  ops: {
    ping: {
      idempotent: 'safe',
      timeoutMs: 1000,
      handler: pingOp,
    },
  },

  mount(ctx) {
    this._ctx = ctx;
  },

  unmount() {
    this._ctx = null;
  },
};
```

### 4. Register it

At the end of the module file:

```js
window.Frontier = window.Frontier || {};

if (window.Frontier?.registry) {
  window.Frontier.registry.register(FrontierExampleOpsModule);
}
```

### 5. Make sure it is loaded by BetterDungeon

Registration only works if the module file is actually loaded into the extension runtime. The exact loader path depends on how the surrounding BetterDungeon bundle/script includes the module, but the key rule is simple: creating the file is not enough. It has to be part of the shipped extension load path.

### 6. Test the right surface

Test according to module type:

- state module: verify card changes dispatch correctly and survive undo/rewind behavior
- ops module: verify request, pending, response, ack, and timeout behavior
- mixed module: test both paths independently

## Authoring guidance

### Keep responsibilities tight

Good Frontier modules are narrow.

- Scripture renders widget state.
- WebFetch does controlled network access.
- Clock does time helpers.
- System exposes environment hints.

That is the right scale.

### Prefer explicit validation

Frontier modules sit on a boundary:

- scripts can write malformed state
- scripts can send malformed op args
- browser capabilities can be unavailable

Validate early and fail clearly.

### Respect adventure boundaries

If the module keeps ephemeral state, clear it on `onAdventureChange(...)`.

Do not assume one global session equals one adventure.

### Use storage sparingly

`ctx.storage` is good for:

- preferences
- consents
- small module settings

It is not a replacement for scenario state cards or large caches.

### Treat state re-renders as normal

Core may replay cached state to a newly enabled module. Live-count-aware modules may also be called again when the card itself did not change. Write module logic so that repeated calls are safe and unsurprising.

## Naming conventions

Use the current codebase pattern:

- module entry file: `modules/<module-id>/module.js`
- exported runtime object: PascalCase variable name if the file uses one
- wire op names: lower camel case
- first-party ids: short lowercase names already consistent with the codebase

Third-party-style dotted ids are supported by the registry's enablement rules, but first-party shipped modules currently use short ids like `scripture`, `webfetch`, and `ai`.

## What not to build into a module by default

- do not invent a separate profile or capability tier
- do not bypass `ctx.writeCard(...)` for Frontier-owned card writes
- do not make replay-sensitive ops look safe if they are not
- do not tie history-sensitive rendering only to action id when live count is the real key
- do not assume older planning docs reflect current loader or lifecycle behavior

## Best reference files

When adding or revising a module, these are the best current references:

- [module-registry.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/module-registry.js)
- [core.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/core.js)
- [ops-dispatcher.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/ops-dispatcher.js)
- [modules/scripture/module.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/modules/scripture/module.js)
- [modules/webfetch/module.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/modules/webfetch/module.js)
- [modules/ai/module.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/modules/ai/module.js)

Those reflect the real Frontier module system better than the older planning-era script snippets.
