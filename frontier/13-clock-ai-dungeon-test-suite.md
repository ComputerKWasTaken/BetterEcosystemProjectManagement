# 13 - Clock AI Dungeon Test Suite

Clock live validation is complete and archived.

The paste-ready harness files live in [archive/phase-6-clock-test-suite](./archive/phase-6-clock-test-suite/README.md).

## Completed Result

Phase 6 passed in AI Dungeon on 2026-04-23 with run `clock-mobxzre5`.

Validated:

- Full-profile heartbeat and Clock `now` / `tz` / `format` advertisement
- structured `clock.now` payload
- stable epoch-local `clock.tz({ timeZone: 'America/Chicago', ts: 0 })` result
- UTC-default `clock.format({ ts: 0, format: 'YYYY-MM-DD' })`
- invalid timezone rejection
- missing-format rejection
- invalid-timestamp rejection
- terminal response ack and tombstone behavior

Re-run this suite only when changing Clock ops behavior, response shaping, heartbeat advertisement, dispatcher integration, or the archived Clock AI Dungeon suite scripts.
