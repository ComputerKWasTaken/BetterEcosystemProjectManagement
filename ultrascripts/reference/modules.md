# Module System Reference

## Purpose

This document describes the live Ultrascripts module system: what a module is,
which first-party modules ship today, what contract modules implement, and what
rules to follow when adding or polishing modules.

## Module Model

An Ultrascripts module is a BetterDungeon-side capability mounted into the
shared Ultrascripts runtime.

A module may:

- read script-published state cards
- expose callable ops
- do both

There is no separate profile or capability tier for modules. The current
question is only: is the module mounted, and what state names/ops does the
heartbeat advertise?

## Shipped Module Inventory

| Module | Kind | State or ops | Main files | Public guide | Regression suite |
|---|---|---|---|---|---|
| `scripture` | state | `ultrascripts:state:scripture` | `../../../BetterDungeon/modules/scripture/` | `UltrascriptsScriptureGuide.vue` | `scripture-module` |
| `webfetch` | ops | `fetch`, `search` | `../../../BetterDungeon/modules/webfetch/` | `UltrascriptsWebFetchGuide.vue` | `webfetch-module` |
| `clock` | ops | `now`, `tz`, `format` | `../../../BetterDungeon/modules/clock/` | `UltrascriptsClockGuide.vue` | `clock-module` |
| `sdk` | ops | `version`, `config` | `../../../BetterDungeon/modules/sdk/` | `UltrascriptsSdkGuide.vue` | `sdk-module` |
| `geolocation` | ops | `permission`, `getCurrent` | `../../../BetterDungeon/modules/geolocation/` | `UltrascriptsGeolocationGuide.vue` | `geolocation-module` |
| `weather` | ops | `current`, `forecast` | `../../../BetterDungeon/modules/weather/` | `UltrascriptsWeatherGuide.vue` | `weather-module` |
| `network` | ops | `status` | `../../../BetterDungeon/modules/network/` | `UltrascriptsNetworkGuide.vue` | `network-module` |
| `system` | ops | `info`, `power` | `../../../BetterDungeon/modules/system/` | `UltrascriptsSystemGuide.vue` | `system-module` |
| `ai` | ops | `status`, `query` | `../../../BetterDungeon/modules/ai/` | `UltrascriptsAiGuide.vue` | `ai-module` |

The `ai` module has a stable asynchronous `status`/`query` contract while its
generation backend is rebuilt. It has no compatibility alias.

## Current Responsibilities

| Module | Responsibility |
|---|---|
| `scripture` | Render live script-published widgets, including interaction events back to scripts |
| `webfetch` | Controlled network fetch/search with consent, rate limiting, and blocked-target protection |
| `clock` | Time, timezone, and format helpers |
| `sdk` | Safe BetterDungeon metadata and configuration snapshots |
| `geolocation` | Browser geolocation permission and current-position helpers |
| `weather` | Open-Meteo current conditions and forecasts from coordinates or place names |
| `network` | Browser online status and quality hints |
| `system` | Device, browser, screen, locale, hardware, preference, and power hints |
| `ai` | Reports Gemini readiness and accepts bounded async text/schema-backed JSON query jobs with optional thinking levels and query metadata; returns `not_configured` until the player saves an API key |

Keep modules narrow. If a module starts becoming a mini-application, split the
author-facing helper/script from the BetterDungeon-side capability.

## Registration Flow

1. The module file is loaded by BetterDungeon.
2. The module calls `window.Ultrascripts.registry.register(MyModule)`.
3. The registry stores the definition and aliases.
4. The registry checks saved enablement state.
5. If enabled, the registry creates a scoped context and calls `mount(ctx)`.
6. Core replays cached state if the module subscribes to state names.
7. Core schedules a heartbeat so scripts see the mounted module.

Creating a module file is not enough. It must be included in the extension load
path and registered.

## Live Module Contract

The implementation source of truth is
`../../../BetterDungeon/services/ultrascripts/module-registry.js` plus
`../../../BetterDungeon/services/ultrascripts/core.js`.

```ts
interface UltrascriptsModule {
  id: string;
  version?: string;
  label?: string;
  description?: string;
  aliases?: string[];
  defaultEnabled?: boolean;

  stateNames?: string[];
  tracksLiveCount?: boolean;

  ops?: Record<string, {
    handler: (args: unknown, ctx: UltrascriptsContext) => unknown | Promise<unknown>;
    idempotent?: 'safe' | 'unsafe';
    timeoutMs?: number;
  }>;

  mount(ctx: UltrascriptsContext): void;
  unmount?(): void;

  onEnable?(ctx: UltrascriptsContext): void | Promise<void>;
  onDisable?(ctx: UltrascriptsContext): void | Promise<void>;
  onStateChange?(name: string, parsed: unknown, ctx: UltrascriptsContext): void;
  onAdventureChange?(shortId: string | null, ctx: UltrascriptsContext): void;
}
```

Important details:

- `mount(ctx)` is required.
- `unmount()` is optional but strongly preferred for modules with DOM, timers,
  retained references, or subscriptions.
- `stateNames` subscribes the module to `ultrascripts:state:<name>`.
- `tracksLiveCount` causes Core to re-dispatch cached state when live count
  changes.
- `ops` entries should be descriptor objects, not raw functions, unless a
  legacy/simple path is intentionally being used.
- `idempotent: 'unsafe'` means the dispatcher should avoid replaying pending
  requests after reload in ways that could duplicate real work.
- First-party short ids default to enabled; dotted third-party-style ids default
  to disabled unless `defaultEnabled` overrides that.

## Module Context

Modules receive a scoped context from Core.

```ts
interface UltrascriptsContext {
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

Context rules:

- Use `ctx.writeCard()` for every Ultrascripts-owned write.
- Use `ctx.storage` for small module preferences, not scenario state.
- Use `ctx.log()` so debug logs respect the Ultrascripts debug toggle.
- Use `ctx.getLiveCount()` for turn-history rendering.
- Use `onAdventureChange()` to clear per-adventure state.
- Do not reach around the context into shared internals unless the module is
  deliberately maintaining the runtime itself.

## State Modules

State modules read `ultrascripts:state:<name>` cards.

Minimum shape:

```js
const ExampleStateModule = {
  id: 'exampleState',
  version: '1.0.0',
  stateNames: ['exampleState'],

  mount(ctx) {
    this._ctx = ctx;
  },

  unmount() {
    this._ctx = null;
  },

  onStateChange(name, parsed, ctx) {
    if (name !== 'exampleState') return;
    ctx.log('debug', 'state changed', parsed);
  },
};
```

State-module rules:

- Treat parsed data as untrusted.
- Validate before rendering or acting.
- No-op on malformed state instead of crashing Core.
- Make repeated `onStateChange()` calls safe.
- Clear DOM and ephemeral state on disable/adventure change.
- If the module reads history keyed by turn count, set `tracksLiveCount: true`.

### Scripture Reference Pattern

Scripture is the canonical state module.

It:

- declares `stateNames: ['scripture']`
- declares `tracksLiveCount: true`
- validates manifest and widget state
- renders `history[liveCount]`
- falls back to nearest earlier/newest numeric history entry
- writes widget interactions to `ultrascripts:in:scripture`
- prunes widget events after script-side `interactions.ackSeq` advances
- uses per-module storage for display preferences

## Ops Modules

Ops modules expose callable work through `ultrascripts:out` and
`ultrascripts:in:<module>`.

Minimum shape:

```js
async function pingOp(args, ctx) {
  return {
    ok: true,
    liveCount: ctx.getLiveCount(),
    received: args || null,
  };
}

const ExampleOpsModule = {
  id: 'exampleOps',
  version: '1.0.0',

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

Ops-module rules:

- Normalize and validate args at the top of the handler.
- Return plain JSON-serializable data.
- Throw structured errors with stable `code` values when scripts need to branch.
- Use `safe` only when replaying the op is harmless.
- Use `unsafe` for hosted AI calls, writes, purchases, mutations, or anything
  where duplicate execution changes meaning.
- Pick timeouts that reflect real browser/network behavior.
- Keep response shapes stable once public docs depend on them.

## Lifecycle Hooks

| Hook | Use |
|---|---|
| `mount(ctx)` | Required startup; store context, create renderer/service state |
| `onEnable(ctx)` | Optional lightweight post-mount work |
| `onDisable(ctx)` | Optional pre-unmount cleanup or user-visible clearing |
| `unmount()` | Destroy DOM, timers, subscriptions, retained references |
| `onAdventureChange(shortId, ctx)` | Reset per-adventure state without disabling the module |
| `onStateChange(name, parsed, ctx)` | React to parsed state-card data |

## Adding Or Revising A Module

Use this checklist:

1. Decide whether it is state-only, ops-only, or mixed.
2. Confirm the capability belongs in BetterDungeon rather than in a scenario
   helper.
3. Define the smallest stable state/ops contract.
4. Add the module under `../../../BetterDungeon/modules/<module-id>/`.
5. Register the module with the registry.
6. Load the module in the extension path.
7. Add or update the module regression suite under
   `../../../BetterDungeon/tests/aid-scripts/`.
8. Update BetterRepository public docs if the author-facing contract changed.
9. Update [script-contract.md](./script-contract.md)
   if examples/templates need new canonical patterns.
10. Re-check heartbeat output so module state names and ops are discoverable.

## Current Quality-Pass Guidance

The active module work is not a redesign. It is a usefulness pass before
showcase scripts.

Review questions:

- Does the API match public docs and templates?
- Does the module degrade cleanly when disabled, unsupported, denied,
  unconfigured, offline, or rate-limited?
- Are errors stable enough for script branching?
- Are response fields the fields authors actually need?
- Does mobile/narrow UI behavior hold where relevant?
- Is the regression script still representative?
- Would the module be comfortable to show in Brainiac, Statboy, or Chronos V2?

Current order is tracked in [Module Quality Pass](../planning/module-quality-pass.md).

## Do Not Build By Default

- new runtime profiles
- direct writes that bypass `ctx.writeCard()`
- response shapes that expose credentials or secrets
- replay-sensitive ops marked as `safe`
- state history keyed only to action id when live count is the real lookup key
- browser-permission flows that pretend permission was granted
- public examples that rely on same-turn responses

## Best Reference Files

- `../../../BetterDungeon/services/ultrascripts/module-registry.js`
- `../../../BetterDungeon/services/ultrascripts/core.js`
- `../../../BetterDungeon/services/ultrascripts/ops-dispatcher.js`
- `../../../BetterDungeon/services/ultrascripts/envelope.js`
- `../../../BetterDungeon/modules/scripture/module.js`
- `../../../BetterDungeon/modules/webfetch/module.js`
- `../../../BetterDungeon/modules/sdk/module.js`
- `../../../BetterDungeon/modules/ai/module.js`
