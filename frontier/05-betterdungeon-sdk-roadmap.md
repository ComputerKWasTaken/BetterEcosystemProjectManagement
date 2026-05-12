# 05 - BetterDungeon SDK Roadmap

> This document covers the next capability layer we want Frontier to ship: a curated BetterDungeon SDK surface for scripts. This is no longer a vague post-V2 curiosity. It is a real planned feature direction.

## Why this matters

Frontier already gives scripts a strong module model:

- publish state cards
- call module ops
- read responses back

What it does not yet give them is a clean, stable "BetterDungeon-aware" helper surface.

That is where a BetterDungeon SDK becomes valuable.

The SDK should let scripts ask questions like:

- what BetterDungeon capabilities are available here?
- what Frontier modules are mounted?
- what version of BetterDungeon am I running?
- what stable helper surfaces can I rely on without touching internals?

That is clever in exactly the right way: useful, composable, and future-friendly.

## The core rule

The BetterDungeon SDK must expose capabilities, not private classes.

Bad version:

- scripts poking `window` for internal objects
- scripts depending on raw class names
- scripts expecting unstable object layouts
- scripts coupling themselves to extension implementation details

Good version:

- a documented SDK module
- a stable set of ops or helper surfaces
- capability-oriented responses
- versioned contracts that BetterDungeon can evolve intentionally

This keeps BetterDungeon flexible while still giving script authors more power.

## What the SDK should be

The SDK should be Frontier's product-integration layer.

It should answer:

- what can BetterDungeon do for me right now?
- what modules are available?
- what optional capabilities are present?
- what safe helper calls are officially supported?

It should become the place for:

- capability introspection
- BetterDungeon version checks
- Frontier runtime metadata
- future curated helper utilities that are too BetterDungeon-specific to belong in generic modules

## What the SDK should not be

It should not be:

- a raw escape hatch into extension internals
- a dumping ground for every convenient helper we can think of
- an undocumented "just call this hidden thing" layer
- a backdoor around Frontier's normal contracts

If we make it sloppy, it will create exactly the maintenance problems we are trying to avoid.

## Suggested first version

The first SDK surface should stay small and obviously useful.

Suggested core capabilities:

- `bd.sdk.version()`
- `bd.sdk.capabilities()`
- `bd.sdk.modules()`
- `bd.sdk.frontier()`

For the actual Frontier module, the cleanest v1 is:

- module id: `sdk`
- public script-side helper namespace: `bd.sdk`
- transport shape: normal Frontier ops through `frontier:out` and `frontier:in:sdk`

That gives us a simple rule:

- `sdk` is the Frontier module
- `bd.sdk.*` is the author-friendly helper layer built on top of that module

## Proposed `sdk` module shape

The v1 module should be ops-only.

Suggested BetterDungeon-side definition shape:

```js
const FrontierSdkModule = {
  id: 'sdk',
  version: '1.0.0',
  label: 'BetterDungeon SDK',
  description: 'Exposes stable BetterDungeon and Frontier capability metadata to scripts.',

  ops: {
    version: {
      idempotent: 'safe',
      timeoutMs: 1000,
      handler: versionOp,
    },
    capabilities: {
      idempotent: 'safe',
      timeoutMs: 1000,
      handler: capabilitiesOp,
    },
    modules: {
      idempotent: 'safe',
      timeoutMs: 1000,
      handler: modulesOp,
    },
    frontier: {
      idempotent: 'safe',
      timeoutMs: 1000,
      handler: frontierOp,
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

## V1 ops

These four ops are enough for a strong first release.

### `sdk.version`

### `bd.sdk.version()`

Purpose:

- let scripts branch safely on BetterDungeon capability era when they truly need to

Expected return shape:

- BetterDungeon version
- Frontier protocol version
- maybe a compact SDK version string

Recommended v1 response:

```json
{
  "sdkVersion": "1.0.0",
  "betterDungeonVersion": "2.0.0",
  "frontierProtocol": 1,
  "frontierClient": "BetterDungeon"
}
```

Recommended script helper:

```js
bd.sdk.version = function () {
  return frontierCall('sdk', 'version', {});
};
```

### `sdk.capabilities`

### `bd.sdk.capabilities()`

Purpose:

- provide a stable machine-readable summary of what BetterDungeon officially exposes

Expected return shape:

- available modules
- available helper groups
- optional platform flags where appropriate
- maybe a list of explicitly supported SDK methods

Recommended v1 response:

```json
{
  "sdkVersion": "1.0.0",
  "helperGroups": ["sdk"],
  "modules": ["scripture", "webfetch", "clock", "geolocation", "weather", "network", "system", "ai", "sdk"],
  "opsModules": ["webfetch", "clock", "geolocation", "weather", "network", "system", "ai", "sdk"],
  "stateModules": ["scripture"],
  "features": {
    "frontier": true,
    "scriptureWidgets": true,
    "providerAI": true,
    "webfetchConsent": true
  },
  "platform": {
    "browserFamily": "chromium",
    "mobileLike": false
  }
}
```

Notes:

- keep this intentionally high-level
- do not dump every internal toggle or implementation detail
- only expose capability concepts we are willing to support as public contract

Recommended script helper:

```js
bd.sdk.capabilities = function () {
  return frontierCall('sdk', 'capabilities', {});
};
```

### `sdk.modules`

### `bd.sdk.modules()`

Purpose:

- give scripts a clean module inventory without requiring custom heartbeat parsing every time

Expected return shape:

- mounted module ids
- mounted module ops
- maybe state names for state-driven modules

Recommended v1 response:

```json
{
  "modules": [
    {
      "id": "scripture",
      "mounted": true,
      "stateNames": ["scripture"],
      "ops": []
    },
    {
      "id": "clock",
      "mounted": true,
      "stateNames": [],
      "ops": ["now", "tz", "format"]
    },
    {
      "id": "sdk",
      "mounted": true,
      "stateNames": [],
      "ops": ["version", "capabilities", "modules", "frontier"]
    }
  ]
}
```

Notes:

- this should be derived from the registry/heartbeat truth, not a second parallel model
- include only stable author-useful fields

Recommended script helper:

```js
bd.sdk.modules = function () {
  return frontierCall('sdk', 'modules', {});
};
```

### `sdk.frontier`

### `bd.sdk.frontier()`

Purpose:

- expose a compact official snapshot of the Frontier runtime from the script author's point of view

Expected return shape:

- protocol version
- enabled state
- current advertised module list
- maybe heartbeat freshness information if that proves useful

Recommended v1 response:

```json
{
  "protocol": 1,
  "enabled": true,
  "turn": 42,
  "heartbeatPresent": true,
  "heartbeatFresh": true,
  "moduleCount": 9,
  "modules": ["scripture", "webfetch", "clock", "geolocation", "weather", "network", "system", "ai", "sdk"]
}
```

Recommended script helper:

```js
bd.sdk.frontier = function () {
  return frontierCall('sdk', 'frontier', {});
};
```

## Suggested script-side helper layer

The raw ops are useful, but the script-side helper layer is what will make this feel like a real SDK.

Recommended base helper shape:

```js
state.bd = state.bd || {};
var bd = state.bd;
bd.sdk = bd.sdk || {};

bd.sdk.version = function () {
  return frontierCall('sdk', 'version', {});
};

bd.sdk.capabilities = function () {
  return frontierCall('sdk', 'capabilities', {});
};

bd.sdk.modules = function () {
  return frontierCall('sdk', 'modules', {});
};

bd.sdk.frontier = function () {
  return frontierCall('sdk', 'frontier', {});
};
```

## Author-facing convenience helpers

These are not required for v1, but they are high-value additions if we want the SDK to feel genuinely useful.

### `bd.sdk.hasModule(moduleId)`

```js
bd.sdk.hasModule = function (moduleId) {
  var hb = frontierHeartbeat();
  var mods = (hb && Array.isArray(hb.modules)) ? hb.modules : [];
  for (var i = 0; i < mods.length; i++) {
    if (mods[i] && mods[i].id === moduleId) return true;
  }
  return false;
};
```

### `bd.sdk.hasOp(moduleId, opName)`

```js
bd.sdk.hasOp = function (moduleId, opName) {
  var hb = frontierHeartbeat();
  var mods = (hb && Array.isArray(hb.modules)) ? hb.modules : [];
  for (var i = 0; i < mods.length; i++) {
    var mod = mods[i];
    if (!mod || mod.id !== moduleId) continue;
    var ops = Array.isArray(mod.ops) ? mod.ops : [];
    return ops.indexOf(opName) !== -1;
  }
  return false;
};
```

### `bd.sdk.ensure(moduleId, opName?)`

Purpose:

- give authors one clean capability gate instead of repeated custom checks

Recommended return shape:

```js
{
  ok: true,
  code: 'ok'
}
```

or:

```js
{
  ok: false,
  code: 'module_unavailable'
}
```

This helper can stay script-side and does not need a dedicated BetterDungeon op in v1.

## Recommended V1 non-goals

Do not ship these in v1:

- direct access to BetterDungeon classes or services
- DOM inspection helpers
- popup state internals
- feature-manager internals
- direct storage mutation helpers for arbitrary BetterDungeon settings
- "run arbitrary BetterDungeon command" escape hatches

That is where the SDK would become brittle.

## Error model

The `sdk` module should be boring and consistent.

Recommended structured errors:

- `unknown_op`
- `not_available`
- `internal_error`

Realistically, the v1 SDK ops should almost never fail except for generic runtime issues.

## Why `sdk` is a good module id

`sdk` is:

- short
- obvious
- easy to remember
- clean on the wire

So scripts can do things like:

```js
frontierCall('sdk', 'capabilities', {})
frontierCall('sdk', 'modules', {})
```

and then wrap those with:

```js
bd.sdk.capabilities()
bd.sdk.modules()
```

That gives us both a clean protocol identity and a clean authoring identity.

## Recommended first implementation order

1. add the `sdk` Frontier module with the four v1 ops
2. advertise it in heartbeat like any other ops module
3. add a tiny script-side `bd.sdk` helper snippet to the base Frontier library docs
4. create one example script that uses the SDK for graceful capability detection
5. only then consider extra convenience helpers

## How it should ship

The most natural version is a Frontier module or closely related SDK surface built on the same design principles as the rest of Frontier:

- stable
- documented
- capability-based
- discoverable

Two reasonable implementation shapes:

### Option A - dedicated SDK module

Example:

- module id like `sdk` or `bdsdk`
- scripts call it through normal Frontier request/response patterns

Pros:

- fits the existing Frontier mental model
- easy to advertise through heartbeat
- easy to version explicitly

### Option B - base Frontier helper surface plus optional SDK ops

Example:

- thin script-side helper for common checks
- deeper information exposed through Frontier ops

Pros:

- less repetitive script boilerplate
- can make common capability checks nicer to use

The key point is not which flavor wins first. The key point is that the public surface must stay stable and curated.

## Why this is worth shipping

This is valuable for both sides:

### For script authors

- easier feature detection
- less guesswork
- less need to reverse-engineer BetterDungeon behavior
- cleaner progressive enhancement patterns

### For BetterDungeon

- one official integration layer instead of hidden assumptions
- less accidental coupling to internals
- a safer path for expanding Frontier over time
- a strong product story: BetterDungeon is not only "a set of modules," it is a scripting platform with a real SDK

## Relationship to shipped modules

The SDK does not replace the current modules.

It complements them.

Current modules answer questions like:

- fetch this URL
- tell me the time
- get the weather
- make an AI call

The SDK should answer questions like:

- what can BetterDungeon do here?
- what modules are present?
- what official helper surfaces are available?

That separation keeps the system understandable.

## Relationship to heartbeat

Heartbeat already gives scripts raw runtime discovery.

The SDK should not duplicate heartbeat blindly. It should make the most useful parts easier and more stable to consume.

Good SDK value:

- normalized capability answers
- cleaner script ergonomics
- less repeated heartbeat-parsing boilerplate

Bad SDK value:

- "here is the exact same heartbeat payload again but with another name"

## Initial risk areas

The main risks are not security disasters. They are product-shape risks:

- scope creep
- exposing too much too early
- accidentally freezing internals as public contract
- building something clever but not actually useful

That means the answer is restraint, not fear.

## Recommended rollout

1. Define the smallest official SDK contract we are willing to support.
2. Keep the first version introspection-heavy and helper-light.
3. Ship it through Frontier's existing capability model.
4. Write examples that show why it is better than ad hoc heartbeat parsing.
5. Expand only after real script-author use cases appear.

## Current recommendation

The BetterDungeon SDK should be treated as a real planned Frontier feature.

Recommended priority:

1. finish the current doc cleanup pass
2. define and ship the first BetterDungeon SDK surface
3. move into broader module polish and regression-suite expansion after the SDK lands

This is a strong next-step feature because it deepens Frontier as a platform without bloating the core runtime model.
