# 05 - BetterDungeon SDK Roadmap

> This document records the current SDK direction after a key architectural decision: heartbeat remains the one source of truth for Frontier availability, and the SDK only exists for BetterDungeon-facing metadata that should not become a second discovery system.

## Why this matters

Frontier already gives scripts a strong module model:

- publish state cards
- call module ops
- read responses back

Heartbeat already tells scripts what Frontier modules and ops are available.

What heartbeat should not have to become is a general BetterDungeon product metadata API.

That is where the SDK still has value.

The SDK should let scripts ask questions like:

- what version of BetterDungeon am I running?
- what BetterDungeon-aware helper layer am I targeting?
- what metadata can I branch on without turning heartbeat into two systems at once?
- how has the player configured BetterDungeon in ways that matter to script behavior?

That is clever in exactly the right way: useful, composable, and future-friendly.

## The core rule

The BetterDungeon SDK must expose BetterDungeon metadata, not Frontier availability.

Bad version:

- scripts poking `window` for internal objects
- scripts depending on raw class names
- scripts expecting unstable object layouts
- scripts coupling themselves to extension implementation details

Good version:

- a documented SDK module
- a stable set of BetterDungeon-facing ops or helper surfaces
- heartbeat as the only Frontier discovery contract
- versioned contracts that BetterDungeon can evolve intentionally

This keeps BetterDungeon flexible while still giving script authors more power.

## Separation of concerns

Heartbeat owns:

- module availability
- op availability
- state-module discovery
- live Frontier runtime advertisement

The SDK owns:

- BetterDungeon version checks
- future BetterDungeon-facing metadata that does not belong in heartbeat
- a clean identity anchor for script-side helpers like `bd.sdk.*`

This keeps the architecture simple:

- one discovery system for Frontier
- one metadata/helper surface for BetterDungeon

## What the SDK should not be

It should not be:

- a raw escape hatch into extension internals
- a dumping ground for every convenient helper we can think of
- an undocumented "just call this hidden thing" layer
- a backdoor around Frontier's normal contracts

If we make it sloppy, it will create exactly the maintenance problems we are trying to avoid.

## Current shipped version

The current SDK surface is intentionally small.

Shipped op:

- `bd.sdk.version()`
- `bd.sdk.config()`

For the actual Frontier module, the shipped v1 is:

- module id: `sdk`
- public script-side helper namespace: `bd.sdk`
- transport shape: normal Frontier ops through `frontier:out` and `frontier:in:sdk`

That gives us a simple rule:

- `sdk` is the Frontier module
- `bd.sdk.*` is the author-friendly helper layer built on top of that module

## Current `sdk` module shape

The current module is ops-only and intentionally minimal:

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
    config: {
      idempotent: 'safe',
      timeoutMs: 1500,
      handler: configOp,
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

## Current op

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

### `sdk.config`

### `bd.sdk.config()`

Purpose:

- expose safe BetterDungeon configuration that materially affects how a script may want to behave

Expected return shape:

- BetterDungeon feature toggles
- Frontier module enablement preferences
- safe Scripture/WebFetch/AI configuration context
- no secrets such as API keys

Current response shape:

```json
{
  "sdkVersion": "1.0.0",
  "betterDungeonVersion": "1.2.1",
  "frontierProtocol": 1,
  "frontierClient": "BetterDungeon",
  "features": {
    "frontier": true,
    "markdown": true,
    "command": true,
    "try": true,
    "triggerHighlight": true,
    "hotkey": true,
    "favoriteInstructions": true,
    "inputModeColor": true,
    "characterPreset": true,
    "autoSee": false,
    "notes": true,
    "storyCardModalDock": true,
    "inputHistory": true,
    "textToSpeech": false
  },
  "frontier": {
    "enabled": true,
    "runtimeEnabled": true,
    "debug": false,
    "modulePreferences": {
      "scripture": true,
      "webfetch": true,
      "clock": true,
      "sdk": true,
      "geolocation": true,
      "weather": true,
      "network": true,
      "system": true,
      "ai": true
    },
    "scriptureDisplay": {
      "size": "normal",
      "maxHeight": "medium",
      "layout": "balanced"
    },
    "webfetch": {
      "savedOriginCount": 0,
      "allowCount": 0,
      "denyCount": 0
    },
    "ai": {
      "configured": true,
      "defaultModel": "google/gemini-2.0-flash-exp:free",
      "costControls": {
        "freeModelsOnly": true,
        "advancedOpen": false,
        "maxPromptPricePerMillion": 0,
        "maxCompletionPricePerMillion": 0,
        "perCallEstimateCap": 0,
        "dailySpendCap": 0,
        "monthlySpendCap": 0
      }
    }
  }
}
```

Recommended script helper:

```js
bd.sdk.config = function () {
  return frontierCall('sdk', 'config', {});
};
```

## Suggested script-side helper layer

The raw op is useful, but the script-side helper layer is what will make this feel like a real SDK.

Recommended base helper shape:

```js
state.bd = state.bd || {};
var bd = state.bd;
bd.sdk = bd.sdk || {};

bd.sdk.version = function () {
  return frontierCall('sdk', 'version', {});
};

bd.sdk.config = function () {
  return frontierCall('sdk', 'config', {});
};
```

## Author-facing convenience helpers

These are not required in the module itself, but they are high-value additions if we want `bd.sdk` to feel genuinely useful.

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
frontierCall('sdk', 'version', {})
frontierCall('sdk', 'config', {})
```

and wrap heartbeat parsing helpers under:

```js
bd.sdk.hasModule(...)
bd.sdk.hasOp(...)
```

That gives us both a clean protocol identity and a clean authoring identity without creating a second discovery system.

## Landed pieces

The shipped v1 already does these:

1. adds the `sdk` Frontier module
2. advertises it in heartbeat like any other ops module
3. exposes a popup toggle like the other first-party Frontier modules
4. returns safe BetterDungeon configuration context without duplicating heartbeat discovery

## Current completion state

The core SDK milestone is complete.

Done:

1. shipped the `sdk` module
2. kept heartbeat as the only Frontier discovery surface
3. shipped `sdk.version` and `sdk.config`
4. added and live-validated the dedicated `sdk-module` regression script
5. moved config reads through the background-authoritative path so the SDK reflects real saved AI settings instead of fallback-looking defaults

What remains is optional follow-through, not core justification work.

## Recommended next implementation order

1. move into broader module polish and regression expansion across the remaining shipped modules
2. add a tiny script-side `bd.sdk` helper snippet to the base Frontier library docs when we want to freeze that shape
3. create one example script that uses heartbeat for graceful capability detection and `sdk.version` / `sdk.config` for BetterDungeon-aware branching
4. only then consider extra convenience helpers

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

Heartbeat should stay the one source of truth for Frontier availability.

The SDK should not duplicate heartbeat at all. Its job is to complement heartbeat, not reinterpret it as a second discovery surface.

Good SDK value:

- BetterDungeon versioning
- BetterDungeon-facing metadata
- player configuration that affects script behavior
- a stable anchor for script-side helpers layered on top of heartbeat

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

The BetterDungeon SDK should now be treated as a completed shipped Frontier surface.

Recommended priority:

1. keep the SDK contract narrow and resist overlap with heartbeat
2. move into broader module polish and regression-suite expansion with `sdk` included in that coverage story
3. add author-facing helper/examples only when they clearly reduce script boilerplate without freezing a bad shape too early

This keeps the architecture cleaner: heartbeat owns Frontier discovery, and the SDK only grows if it provides clearly BetterDungeon-specific value.
