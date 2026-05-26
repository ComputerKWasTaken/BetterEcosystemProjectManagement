# Ultrascripts Example Contract Reference

Temporary working reference for fixing public BetterRepository examples and
author-facing sample scripts. Source of truth is the live BetterDungeon runtime
under `BetterDungeon/modules/*` and `BetterDungeon/services/ultrascripts/*`.

## Rules for public examples

- Treat the live module implementations as authoritative over older docs and
  older AI Dungeon test scripts.
- Prefer the `bd.us.*` helper style in public docs unless the example is
  intentionally teaching the raw card protocol.
- Keep request args and response reads aligned to the live module contract.
- If a module supports legacy aliases internally, document the canonical modern
  field names unless authors truly need the alias.

## Shared transport

### Heartbeat

- Runtime discovery lives on `ultrascripts:heartbeat`.
- Scripts should treat heartbeat presence as "Ultrascripts is available".
- Module discovery comes from `heartbeat.modules[moduleId].ops`.

### Request envelope

`ultrascripts:out`

```json
{
  "v": 1,
  "requests": [
    {
      "id": "turn-12-clock-1",
      "moduleId": "clock",
      "op": "now",
      "args": {}
    }
  ],
  "acks": ["turn-11-clock-1"]
}
```

### Response envelope

`ultrascripts:in:<module>`

```json
{
  "v": 1,
  "responses": [
    {
      "requestId": "turn-12-clock-1",
      "moduleId": "clock",
      "op": "now",
      "status": "ok",
      "data": {}
    }
  ]
}
```

## SDK helper expectations

- `bd.us.tick()` reads response cards and queues response acks.
- `bd.us.call(moduleId, op, args)` queues a request.
- `bd.us.latest(moduleId, op)` returns the newest cached response for that
  module/op pair. It is convenient, but not a full undo-safe freshness proof by
  itself.
- `bd.us.commit()` writes queued requests and acks to `ultrascripts:out`.
- `bd.us.available()` should mean heartbeat is present.

## AI module

Canonical module id: `ai`

Supported alias:
- `providerAI`

Canonical request args for `chat`:

```json
{
  "provider": "openrouter",
  "model": "openrouter/auto",
  "messages": [
    { "role": "system", "content": "Reply with compact JSON only." },
    { "role": "user", "content": "Return a status object." }
  ],
  "maxTokens": 200,
  "temperature": 0.2,
  "responseFormat": { "type": "json_object" },
  "timeoutMs": 60000
}
```

Notes:
- Use `maxTokens`, not `max_tokens`.
- Use `responseFormat`, not `response_format`.
- Do not teach `top_p`; the live module does not normalize it.
- Valid `responseFormat.type` values are `text`, `json_object`,
  and `json_schema`.

## Clock module

Module id: `clock`

Ops:
- `now`
- `tz`
- `format`

Canonical args:
- `now`: `{ timeZone?: string, tz?: string, ts?: number|string|Date }`
- `tz`: `{ timeZone?: string, tz?: string, ts?: number|string|Date }`
- `format`: `{ ts?: number|string|Date, timeZone?: string, tz?: string, format: string }`

Canonical result shapes:

`clock.now`

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

`clock.tz`

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

`clock.format`

```json
"2025-01-15 14:30:00"
```

Notes:
- Read `data.ts`, `data.iso`, `data.local`, `data.date`, or `data.time`.
- Do not read `data.now`.
- The format op returns a plain string, not an object wrapper.

## Weather module

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
  "units": {
    "kind": "metric",
    "temperature": "celsius",
    "windSpeed": "km/h",
    "precipitation": "mm"
  },
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
    "weather": "Rain"
  }
}
```

`weather.forecast` result:

```json
{
  "location": {},
  "units": {},
  "source": "open-meteo",
  "days": [
    {
      "date": "2025-01-16",
      "weatherCode": 71,
      "weather": "Snow fall",
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

Notes:
- Use `latitude` / `longitude`, not `lat` / `lon`.
- Read `data.current.weatherCode`, not top-level `data.weatherCode`.
- Read `data.current.temperature`, not top-level `data.temperature`.

## System module

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

Notes:
- Prefer `deviceClass` for layout decisions.
- Do not teach `platformType`, `preferredLocale`, or `viewport` as top-level
  fields.
- Screen details live inside `data.screen`.

## Geolocation module

Module id: `geolocation`

Ops:
- `permission`
- `getCurrent`

`geolocation.permission` result:

```json
{
  "supported": true,
  "permissionState": "granted"
}
```

`geolocation.getCurrent` result:

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

Notes:
- Read `permissionState`, not `state`.
- Read `accuracy`, not `accuracyMeters`.

## Scripture module

State card: `ultrascripts:state:scripture`

Script-published envelope:

```json
{
  "v": 1,
  "manifest": {
    "widgets": [
      { "id": "hp", "type": "bar", "label": "Health", "max": 100, "color": "#22c55e" },
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

Notes:
- Public examples must not use retired names like `stat-bar`, `badge-list`,
  or `checklist`.
- Widget ids are required in author-facing examples.

### Scripture interaction inbox

`ultrascripts:in:scripture`

```json
{
  "widgetEvents": {
    "v": 1,
    "module": "scripture",
    "source": "BetterDungeon",
    "latestSeq": 7,
    "ackSeq": 4,
    "liveCount": 12,
    "writtenAt": 1736992200000,
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

Script-side handling:
- Read `card.widgetEvents.events`.
- Advance your own `interactions.ackSeq` in `ultrascripts:state:scripture`
  after consuming events.
- Do not teach widget-event acks through `ultrascripts:out.acks`.

## Quick grep targets while patching

- `stat-bar`
- `badge-list`
- `checklist`
- `max_tokens`
- `response_format`
- `top_p`
- `platformType`
- `preferredLocale`
- `viewport`
- `data.now`
- `lat`
- `lon`
- `accuracyMeters`
- Scripture examples with top-level `events`
- Scripture examples that ack via `ultrascripts:out`
