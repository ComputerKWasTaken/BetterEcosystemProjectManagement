# BetterDungeon SDK Reference

## Purpose

This is the private production contract for the Ultrascripts `sdk` module.

The SDK module exposes safe BetterDungeon metadata and player configuration to
AI Dungeon scripts. It complements heartbeat discovery; it does not replace it.

Implementation source:

- `../../../BetterDungeon/modules/sdk/module.js`
- `../../../BetterDungeon/background.js`
- `../../../BetterDungeon/tests/aid-scripts/sdk-module/`

Public docs:

- `../../../BetterRepository/src/components/guides/UltrascriptsSdkGuide.vue`
- `../../../BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue`

## Separation Of Responsibilities

| Surface | Role | Read timing |
|---|---|---|
| `ultrascripts:heartbeat` | Is Ultrascripts present? Which modules/ops are mounted? | Synchronous Story Card read |
| `sdk.version` | What BetterDungeon/SDK/protocol version is active? | Request now, read response later |
| `sdk.config` | Which safe settings/preferences should the script adapt to? | Request now, read response later |

Rules:

- Heartbeat owns discovery.
- SDK owns metadata and safe configuration.
- SDK must never expose API keys, session tokens, raw auth headers, or private
  browser credentials.
- Public examples should check heartbeat/module availability before calling SDK
  ops when they need to branch cleanly.

## Module Definition

| Field | Value |
|---|---|
| Module id | `sdk` |
| Version | `1.0.0` |
| Default enabled | yes |
| Module kind | ops-only |
| Ops | `version`, `config` |

Op descriptors:

| Op | Idempotent | Timeout | Args |
|---|---|---:|---|
| `version` | `safe` | `1000ms` | empty object |
| `config` | `safe` | `1500ms` | empty object |

Both ops reject non-object args with `invalid_args`.

## `sdk.version`

### Request

```json
{
  "v": 1,
  "requests": [
    {
      "id": "turn-12-sdk-version",
      "module": "sdk",
      "op": "version",
      "args": {}
    }
  ],
  "acks": []
}
```

### Response

```json
{
  "sdkVersion": "1.0.0",
  "betterDungeonVersion": "2.0.0",
  "ultrascriptsProtocol": 1,
  "ultrascriptsClient": "BetterDungeon"
}
```

Fields:

- `sdkVersion`: SDK module contract version.
- `betterDungeonVersion`: installed BetterDungeon extension manifest version, or
  `unknown` if unavailable.
- `ultrascriptsProtocol`: current Ultrascripts card protocol version.
- `ultrascriptsClient`: current client name, normally `BetterDungeon`.

## `sdk.config`

### Request

```json
{
  "v": 1,
  "requests": [
    {
      "id": "turn-12-sdk-config",
      "module": "sdk",
      "op": "config",
      "args": {}
    }
  ],
  "acks": []
}
```

### Response Shape

```json
{
  "sdkVersion": "1.0.0",
  "betterDungeonVersion": "2.0.0",
  "ultrascriptsProtocol": 1,
  "ultrascriptsClient": "BetterDungeon",
  "features": {
    "ultrascripts": true,
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
  "ultrascripts": {
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
      "defaultModel": "openrouter/free",
      "costControls": {
        "freeModelsOnly": true,
        "advancedOpen": false,
        "maxPromptPricePerMillion": 0,
        "maxCompletionPricePerMillion": 0,
        "perCallEstimateCap": 0,
        "dailySpendCap": 0,
        "monthlySpendCap": 0
      },
      "dummyModel": false
    }
  }
}
```

`dummyModel` is present when the background-authoritative path supplies it. Do
not require public examples to depend on it unless the public SDK guide is
updated deliberately.

### Feature Fields

`features` reflects BetterDungeon feature toggles that can affect script
behavior or presentation. These are safe booleans; they are not commands for
the script to modify settings.

Current default keys:

- `ultrascripts`
- `markdown`
- `command`
- `try`
- `triggerHighlight`
- `hotkey`
- `favoriteInstructions`
- `inputModeColor`
- `characterPreset`
- `autoSee`
- `notes`
- `storyCardModalDock`
- `inputHistory`
- `textToSpeech`

### Ultrascripts Fields

| Field | Meaning |
|---|---|
| `enabled` | Master Ultrascripts feature preference from BetterDungeon settings |
| `runtimeEnabled` | Whether the current page runtime is active |
| `debug` | Ultrascripts debug logging preference |
| `modulePreferences` | Saved enablement preference for the 9 first-party modules |
| `scriptureDisplay` | Safe widget display preferences |
| `webfetch` | Aggregate consent counts without exposing domains |
| `ai` | Safe AI/OpenRouter setup summary |

`modulePreferences` is not a substitute for heartbeat discovery. A module may be
preferred on but not mounted on the current surface. Use heartbeat to know what
is available now.

### Scripture Display

```json
{
  "size": "normal",
  "maxHeight": "medium",
  "layout": "balanced"
}
```

Allowed values:

- `size`: `compact`, `normal`, `comfortable`, `large`
- `maxHeight`: `short`, `medium`, `tall`
- `layout`: `balanced`, `stacked`

Scripts may use these values to choose denser or simpler Scripture manifests.

### WebFetch Summary

```json
{
  "savedOriginCount": 0,
  "allowCount": 0,
  "denyCount": 0
}
```

This intentionally does not expose specific origins. Scripts should still call
`webfetch.fetch`/`webfetch.search` and branch on consent/error responses.

### AI Summary

```json
{
  "configured": true,
  "defaultModel": "openrouter/free",
  "costControls": {
    "freeModelsOnly": true,
    "advancedOpen": false,
    "maxPromptPricePerMillion": 0,
    "maxCompletionPricePerMillion": 0,
    "perCallEstimateCap": 0,
    "dailySpendCap": 0,
    "monthlySpendCap": 0
  },
  "dummyModel": false
}
```

Rules:

- `configured` is the primary public branch for "can this player use AI calls?"
- `defaultModel` is safe to expose, but scripts cannot override it in
  `ai.chat`.
- cost controls are informational for script adaptation; enforcement remains in
  BetterDungeon.
- API keys are never exposed.
- scripts should not assume paid models are available.

## Wire Flow

```text
Script writes sdk request into ultrascripts:out
-> AI Dungeon broadcasts Story Card update
-> ops-dispatcher validates and routes to sdk module
-> sdk module calls background for config when available
-> sdk module sanitizes/falls back to safe storage reads
-> ops-dispatcher writes ultrascripts:in:sdk
-> script reads response on a later turn
-> script acknowledges response id in ultrascripts:out.acks
```

Response card example:

```json
{
  "v": 1,
  "responses": {
    "turn-12-sdk-config": {
      "status": "ok",
      "data": {
        "sdkVersion": "1.0.0"
      },
      "completedAt": 1736992200000,
      "completedLiveCount": 12
    }
  }
}
```

## Script-Side Pattern

Public examples should prefer the `bd.us` helper from Quick Start. Raw protocol
examples should teach this capability order:

1. Read `ultrascripts:heartbeat`.
2. Check that `sdk` is mounted.
3. Check that the needed SDK op exists.
4. Queue the SDK request.
5. Read the response on a later turn.
6. Ack the consumed response id.

Minimal heartbeat checks:

```js
bd.us.hasModule = function (moduleId) {
  var hb = bd.us.heartbeat();
  var mods = hb && Array.isArray(hb.modules) ? hb.modules : [];
  for (var i = 0; i < mods.length; i++) {
    if (mods[i] && mods[i].id === moduleId) return true;
  }
  return false;
};

bd.us.hasOp = function (moduleId, opName) {
  var hb = bd.us.heartbeat();
  var mods = hb && Array.isArray(hb.modules) ? hb.modules : [];
  for (var i = 0; i < mods.length; i++) {
    var mod = mods[i];
    if (!mod || mod.id !== moduleId) continue;
    var ops = Array.isArray(mod.ops) ? mod.ops : [];
    return ops.indexOf(opName) !== -1;
  }
  return false;
};
```

## Use Cases

Use `sdk.config` for:

- deciding whether `ai.chat` can be offered
- adapting Scripture widget density to player preferences
- showing a better fallback when Ultrascripts is disabled
- deciding whether optional modules should be treated as available preferences
  versus currently mounted capabilities
- choosing Enhanced versus Required messaging

Do not use `sdk.config` for:

- discovering live module availability
- reading private credentials
- changing BetterDungeon settings
- assuming browser permissions have already been granted
- same-turn branching after a request was just queued

## Security Requirements

The SDK must not expose:

- OpenRouter API keys
- Firebase auth tokens
- GraphQL authorization headers
- captured `baseCredentials`
- raw WebFetch allowlist origins
- hidden browser/session identifiers
- unrestricted storage dumps

If a future config field is useful but sensitive, expose a boolean/count/category
summary instead of the raw value.

## Regression Coverage

Suite:

- `../../../BetterDungeon/tests/aid-scripts/sdk-module/`

Coverage expectations:

- heartbeat discovery of `sdk`
- `version` response shape
- `config` response shape
- background-authoritative config path
- sanitized feature/config payloads
- no duplicate heartbeat regression
- response acknowledgements and cleanup

Also check:

- Enhanced template if SDK helper behavior changes
- Required template if runtime/capability gating changes
- public SDK guide if any field is added/removed/renamed
- AI guide if `ultrascripts.ai` config fields change
