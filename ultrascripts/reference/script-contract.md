# Script Contract Reference

## Purpose

This is the private reference for public BetterRepository examples, the
Enhanced/Required starter templates, and the three upcoming showcase scripts.

Use it when writing or reviewing:

- BetterRepository guide snippets
- `bd.us` helper examples
- BetterDungeon example templates
- BetterRepository raw-script template copies
- Brainiac
- Statboy
- Chronos V2

Implementation remains the source of truth. This file exists so examples do not
quietly diverge from the live runtime.

## Public Example Rules

- Prefer the `bd.us` helper style unless the example intentionally teaches raw
  Story Card protocol.
- Teach canonical module ids and field names.
- Mention legacy aliases only when compatibility matters.
- Keep examples turn-safe: requests now, responses later.
- Use Story Card type `Ultrascripts` for Ultrascripts-owned cards.
- Read heartbeat for runtime/module/op discovery.
- Use `sdk.config` for safe player settings, not for discovery.
- Use module-specific permission/status/config ops before assuming browser or
  player capability.

## AI Dungeon Script Constraints

Public snippets must respect AI Dungeon's script sandbox:

- Non-library snippets are pasted into modifier bodies.
- Do not use top-level early `return` in modifier-body snippets.
- Modifier snippets should return `{ text }`.
- Do not teach `stop: true` as a default Ultrascripts pattern.
- Helpers should support Story Card `keys`/`entry` fields.
- Helpers may also support BetterDungeon-style `title`/`value` compatibility.
- Use `addStoryCard(keys, entry, type)` and
  `updateStoryCard(index, keys, entry, type)` for script-side writes.
- Avoid `async`, `await`, timers, promises, and same-turn response assumptions.

## Shared Cards

| Card | Direction | Purpose |
|---|---|---|
| `ultrascripts:heartbeat` | BetterDungeon -> script | Runtime/module/op discovery |
| `ultrascripts:out` | script -> BetterDungeon | Request batch plus response acks |
| `ultrascripts:in:<module>` | BetterDungeon -> script | Module responses |
| `ultrascripts:state:scripture` | script -> BetterDungeon | Scripture widget state |
| `ultrascripts:in:scripture` | BetterDungeon -> script | Scripture widget interaction events plus optional response envelope |

## Heartbeat Contract

Scripts should treat heartbeat presence as "Ultrascripts is available on this
turn." The heartbeat advertises mounted modules and ops.

Example:

```json
{
  "ultrascripts": {
    "protocol": 1,
    "enabled": true,
    "client": "BetterDungeon",
    "clientVersion": "2.0.0"
  },
  "turn": 12,
  "modules": [
    {
      "id": "sdk",
      "version": "1.0.0",
      "stateNames": [],
      "ops": ["version", "config"]
    }
  ],
  "writtenAt": "2026-06-06T20:00:00.000Z"
}
```

Do not teach:

- `ultrascripts.profile`
- Lite/full profile checks
- provider aliases as canonical AI module ids

## Request Envelope

Card: `ultrascripts:out`

```json
{
  "v": 1,
  "requests": [
    {
      "id": "turn-12-clock-now-1",
      "module": "clock",
      "op": "now",
      "args": {}
    }
  ],
  "acks": ["turn-11-clock-now-1"]
}
```

Rules:

- `v` must be `1`.
- `requests` is an array.
- `acks` is an array of consumed response ids.
- request ids should be unique enough for the adventure/session.
- `args` should be an object unless the op contract explicitly says otherwise.

## Response Envelope

Card: `ultrascripts:in:<module>`

```json
{
  "v": 1,
  "responses": {
    "turn-12-clock-now-1": {
      "status": "ok",
      "data": {
        "iso": "2026-06-06T20:00:00.000Z"
      },
      "completedAt": 1780776000000,
      "completedLiveCount": 12
    }
  }
}
```

Statuses:

- `pending`
- `ok`
- `err`
- `timeout`

Scripts should branch on `status` first, then read `data` or `error`.

## `bd.us` Helper Expectations

Public examples should assume the Quick Start helper shape:

| Helper | Expected meaning |
|---|---|
| `bd.us.tick()` | read heartbeat/responses and queue cleanup acks |
| `bd.us.available()` | heartbeat is present |
| `bd.us.hasModule(id)` | heartbeat lists the module |
| `bd.us.hasOp(id, op)` | heartbeat lists the op on that module |
| `bd.us.call(moduleId, op, args)` | queue a request |
| `bd.us.latest(moduleId, op)` | read newest cached response for a module/op |
| `bd.us.commit()` | write queued requests and acks to `ultrascripts:out` |
| `bd.us.publishScripture(state)` | write `ultrascripts:state:scripture` |
| `bd.us.scriptureEvents()` | read pending Scripture widget events |
| `bd.us.ackScripture(seq)` | advance Scripture interaction ack state |

`latest()` is convenient, but it is not a complete undo-safe freshness proof by
itself. Use request ids/state if a script needs stricter freshness.

## Showcase Script Contracts

### Brainiac

Mode: Requires Ultrascripts.

Required capabilities:

- heartbeat
- `sdk.config`
- rebuilt AI query contract
- Scripture if the script surfaces dashboard/status widgets

Design contract:

- derive from Auto Cards plus Inner Self style card-management patterns
- remove the old standalone memory-system framing
- use story/brain cards as the persistent author-facing substrate
- use the rebuilt AI module through the public `status`/`query` contract
- never assume paid models or provider availability
- validate AI JSON before writing cards
- avoid same-turn AI assumptions
- expose clear player-facing setup messages when AI is unavailable

### Statboy

Mode: Requires Ultrascripts.

Required capabilities:

- heartbeat
- `sdk.config`
- rebuilt AI query contract
- `scripture`

Design contract:

- authors define stat schemas
- the rebuilt AI module proposes structured stat updates through JSON queries
- script code validates, clamps, and applies updates
- Scripture renders the current state
- invalid AI output must fail closed
- stat schema/card state must remain understandable without inspecting console

### Chronos V2

Mode: Enhanced with Ultrascripts.

Optional capabilities:

- `clock.now`
- `clock.tz`
- `clock.format`
- `weather.current`
- `weather.forecast`
- `geolocation.permission`
- `geolocation.getCurrent`
- `scripture`
- `system.info` where layout/device hints matter

Design contract:

- base timekeeping works without BetterDungeon
- Ultrascripts adds real time/weather sync and widgets
- geolocation is permission-first and optional
- fixed-place weather should work without geolocation
- do not block the core scenario if weather/location ops fail
- Scripture widgets should be additive, not required for vanilla play

## Module Contracts For Examples

### AI

Canonical module id: `ai`

Public docs should teach `ai`.

Ops:

- `status`
- `query`

`ai.status` reports readiness and the active output-mode support:

```json
{
  "ready": false,
  "available": false,
  "phase": "executor",
  "backend": "gemini",
  "backendLabel": "Gemini",
  "supports": {
    "text": true,
    "json": true
  },
  "config": {
    "provider": "gemini",
    "keyConfigured": false,
    "model": "gemini-3.5-flash"
  },
  "contract": {
    "ops": ["status", "query"],
    "outputTypes": ["text", "json"],
    "asyncOnly": true
  },
  "executor": {
    "version": "0.2.0-gemini",
    "promptMaxChars": 12000,
    "backendConfigured": true
  },
  "reason": "ai_backend_not_configured",
  "message": "Add a Gemini API key in BetterDungeon to enable AI queries."
}
```

`ai.query` submits one bounded asynchronous query job:

```json
{
  "prompt": "Classify whether the player is in combat.",
  "output": {
    "type": "json",
    "schema": {
      "type": "object",
      "properties": {
        "inCombat": { "type": "boolean" }
      },
      "required": ["inCombat"],
      "additionalProperties": false
    }
  }
}
```

Args:

- `prompt`: required non-empty string. It contains the full request, including
  instructions, context, examples, and any formatting guidance.
- `output`: optional. Defaults to `{ "type": "text" }`.
- `output.type`: `text` or `json`.
- `output.schema`: required when `output.type` is `json`.

Success payloads:

```json
{ "text": "The player is not currently in combat." }
```

```json
{ "json": { "inCombat": false } }
```

Rules:

- Heartbeat should list `status` and `query` for `ai`.
- `ai.query` is always asynchronous. Scripts must never assume same-turn
  completion.
- Query results return through `ultrascripts:in:ai` in the normal response
  envelope.
- Text queries return `data.text`.
- JSON queries return `data.json`, and scripts must validate it before applying
  it to state.
- While no Gemini API key is configured, valid queries return an `err` response
  with `error.code: "not_configured"`.
- JSON queries without a schema return `error.code: "invalid_args"`.
- Do not teach retired provider aliases, script-facing model settings,
  response-format settings, or provider-native payloads.

### Clock

Module id: `clock`

Ops:

- `now`
- `tz`
- `format`

Canonical args:

- `now`: `{ timeZone?: string, tz?: string, ts?: number|string|Date }`
- `tz`: `{ timeZone?: string, tz?: string, ts?: number|string|Date }`
- `format`: `{ ts?: number|string|Date, timeZone?: string, tz?: string, format: string }`

`clock.now` result:

```json
{
  "ts": 1736992200000,
  "iso": "2025-01-15T20:30:00.000Z",
  "timeZone": "America/Chicago",
  "offsetMinutes": -360,
  "offset": "-06:00",
  "offsetCompact": "-0600",
  "local": "2025-01-15 14:30:00 -06:00",
  "date": "2025-01-15",
  "time": "14:30:00",
  "systemTimeZone": "America/Chicago"
}
```

`clock.tz` result:

```json
{
  "requestedTimeZone": "Europe/London",
  "systemTimeZone": "America/Chicago",
  "ts": 1736992200000,
  "iso": "2025-01-15T20:30:00.000Z",
  "timeZone": "Europe/London",
  "offsetMinutes": 0,
  "offset": "+00:00",
  "offsetCompact": "+0000",
  "local": "2025-01-15 20:30:00 +00:00",
  "date": "2025-01-15",
  "time": "20:30:00"
}
```

`clock.format` result:

```json
"2025-01-15 14:30:00"
```

Rules:

- Read `data.ts`, `data.iso`, `data.local`, `data.date`, or `data.time`.
- Do not read `data.now`.
- `format` returns a plain string.

### SDK

Module id: `sdk`

Ops:

- `version`
- `config`

Use heartbeat for:

- runtime present/missing
- module present/missing
- op present/missing

Use `sdk.config` for:

- safe BetterDungeon feature settings
- module preferences
- Scripture display preferences
- WebFetch consent counts

`sdk.version` result:

```json
{
  "sdkVersion": "1.0.0",
  "betterDungeonVersion": "2.0.0",
  "ultrascriptsProtocol": 1,
  "ultrascriptsClient": "BetterDungeon"
}
```

Rules:

- API keys are never exposed.
- Public examples should use heartbeat and module status ops for capability
  checks, not hidden setup details.

### Scripture

State card:

- `ultrascripts:state:scripture`

Script-published shape:

```json
{
  "v": 1,
  "manifest": {
    "widgets": [
      { "id": "hp", "type": "bar", "label": "Health", "max": 100, "color": "green" },
      { "id": "status", "type": "taggroup", "label": "Status" }
    ]
  },
  "history": {
    "12": {
      "hp": { "value": 87 },
      "status": { "items": ["Focused", "Blessed"] }
    }
  },
  "interactions": {
    "ackSeq": 4
  }
}
```

Allowed widget types:

- `stat`
- `bar`
- `text`
- `panel`
- `custom`
- `badge`
- `list`
- `icon`
- `counter`
- `button`
- `toggle`
- `select`
- `slider`
- `input`
- `textarea`
- `progress`
- `taggroup`
- `divider`
- `radio`
- `stepper`
- `confirm`
- `chipselect`
- `accordion`
- `tabs`
- `dropdown`
- `sortable`

Rules:

- Widget ids are required.
- History keys are live-count strings.
- Public examples should not use retired names like `stat-bar`, `badge-list`,
  or `checklist`.
- Widget events are acknowledged through `interactions.ackSeq` in the Scripture
  state card.

Scripture interaction inbox:

```json
{
  "widgetEvents": {
    "v": 1,
    "module": "scripture",
    "source": "BetterDungeon",
    "latestSeq": 7,
    "ackSeq": 4,
    "liveCount": 12,
    "actionId": "abc123",
    "writtenAt": "2026-06-06T20:00:00.000Z",
    "events": [
      {
        "seq": 7,
        "widgetId": "mode",
        "widgetType": "select",
        "action": "change",
        "value": "stealth"
      }
    ]
  }
}
```

Rules:

- Use `bd.us.scriptureEvents()` and `bd.us.ackScripture(seq)` in helper-based
  examples.
- Raw examples may read `widgetEvents.events` and advance
  `interactions.ackSeq`.
- Do not teach Scripture widget-event acks through `ultrascripts:out.acks`.

### WebFetch

Module id: `webfetch`

Ops:

- `fetch`
- `search`

`webfetch.fetch` supports safe HTTP methods only:

- `GET`
- `HEAD`
- `OPTIONS`

Canonical `fetch` args:

```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": { "Accept": "application/json" },
  "timeoutMs": 15000,
  "maxBodyBytes": 50000
}
```

Rules:

- Do not teach `POST` or request bodies in WebFetch v1.
- Response data includes `status`, `headers`, `bodyEncoding`, `body`,
  `truncated`, and `request.strippedHeaders`.
- `search` returns `query`, `provider`, `status`, `heading`, `answer`,
  `abstractText`, `abstractUrl`, `related`, `source`, and `truncated`.
- Consent-denied, blocked-target, timeout, and rate-limit paths must be treated
  as normal branchable outcomes.

### Geolocation

Module id: `geolocation`

Ops:

- `permission`
- `getCurrent`

`permission` result:

```json
{
  "supported": true,
  "permissionState": "granted"
}
```

`getCurrent` result:

```json
{
  "latitude": 41.88,
  "longitude": -87.62,
  "accuracy": 35,
  "altitude": null,
  "altitudeAccuracy": null,
  "heading": null,
  "speed": null,
  "timestamp": 1736992200000,
  "iso": "2025-01-15T20:30:00.000Z",
  "permissionState": "granted"
}
```

Rules:

- Read `permissionState`, not `state`.
- Read `accuracy`, not `accuracyMeters`.
- Use permission-first flows in public examples.
- Chronos V2 should support fixed-place weather without requiring geolocation.

### Weather

Module id: `weather`

Ops:

- `current`
- `forecast`

Canonical location args:

- coordinates: `{ latitude: number, longitude: number }`
- place lookup: `{ place: "Chicago" }`

Optional args:

- `units`: `metric` or `imperial`
- `days` for forecast
- `timeoutMs`

`weather.current` result:

```json
{
  "location": {
    "latitude": 41.88,
    "longitude": -87.62,
    "name": "Chicago",
    "admin1": "Illinois",
    "country": "United States",
    "timezone": "America/Chicago",
    "elevation": 181
  },
  "units": "metric",
  "source": "open-meteo",
  "current": {
    "observedAt": "2025-01-15T14:30",
    "temperature": 4.1,
    "apparentTemperature": 0.8,
    "relativeHumidity": 73,
    "windSpeed": 19.2,
    "windDirection": 280,
    "isDay": true,
    "weatherCode": 63,
    "weather": "Moderate rain"
  }
}
```

`weather.forecast` result:

```json
{
  "location": {},
  "units": "metric",
  "source": "open-meteo",
  "days": [
    {
      "date": "2025-01-16",
      "weatherCode": 71,
      "weather": "Slight snow",
      "temperatureMax": 6,
      "temperatureMin": -1,
      "precipitationSum": 2.3,
      "precipitationProbabilityMax": 70,
      "windSpeedMax": 22.1,
      "sunrise": "2025-01-16T07:15",
      "sunset": "2025-01-16T16:52"
    }
  ]
}
```

Rules:

- Use `latitude` and `longitude`, not `lat`/`lon`.
- Read `data.current.weatherCode`, not top-level `data.weatherCode`.
- Read `data.current.temperature`, not top-level `data.temperature`.

### Network

Module id: `network`

Op:

- `status`

`network.status` result:

```json
{
  "online": true,
  "quality": "good",
  "checkedAt": 1736992200000,
  "checkedAtIso": "2025-01-15T20:30:00.000Z",
  "connectionSupported": true,
  "effectiveType": "4g",
  "type": null,
  "downlinkMbps": 10.2,
  "downlinkMaxMbps": null,
  "rttMs": 50,
  "saveData": false
}
```

Rules:

- Treat fields beyond `online` and `quality` as best-effort.
- Use Network for fallback hints, not brittle hard gating.

### System

Module id: `system`

Ops:

- `info`
- `power`

`system.info` result shape:

```json
{
  "checkedAt": 1736992200000,
  "checkedAtIso": "2025-01-15T20:30:00.000Z",
  "deviceClass": "desktop",
  "platform": {
    "family": "windows",
    "mobile": false
  },
  "browser": {
    "name": "chromium",
    "userAgentDataSupported": true
  },
  "locale": {},
  "screen": {},
  "hardware": {},
  "preferences": {},
  "extension": {}
}
```

Rules:

- Prefer `deviceClass` for layout decisions.
- Do not teach `platformType`, `preferredLocale`, or `viewport` as top-level
  fields.
- Screen details live inside `data.screen`.

## Retired Public Patterns

Do not introduce these in current examples:

- `stat-bar`
- `badge-list`
- `checklist`
- retired AI provider aliases
- retired AI generation ops
- `max_tokens`
- `response_format`
- `top_p`
- script-facing AI model selection
- AI examples reading top-level `data.content`
- WebFetch examples using `POST` or request bodies
- `data.now`
- `lat`/`lon`
- `accuracyMeters`
- `platformType`
- `preferredLocale`
- top-level `viewport`
- Scripture events acknowledged through `ultrascripts:out.acks`
- same-turn response logic

## Review Checklist

Before publishing an example or showcase script, check:

- Does it classify itself as Enhanced or Required correctly?
- Does it read heartbeat before assuming module availability?
- Does it call `sdk.config` only where later-turn config is acceptable?
- Does it handle missing/disabled/unconfigured modules?
- Does it avoid assuming an AI backend is configured before `ai.status` reports ready?
- Does it avoid exposing secrets or encouraging credential workarounds?
- Does it use live-count Scripture history?
- Does it ack ops responses and Scripture widget events through the correct
  mechanisms?
- Does it remain understandable to an author reading only BetterRepository?
