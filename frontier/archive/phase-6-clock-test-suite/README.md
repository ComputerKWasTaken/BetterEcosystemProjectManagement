# Archived - Clock AI Dungeon Test Suite

This is the completed Phase 6 live validation suite. The stable summary page is [13 - Clock AI Dungeon Test Suite](../../13-clock-ai-dungeon-test-suite.md).

This harness validated that BetterDungeon advertises the Clock module through Frontier, answers deterministic `now`, `tz`, and `format` ops, and rejects invalid Clock args with structured errors.

## Files

- `clock-test-suite.library.js` - paste into the scenario **Library**
- `clock-test-suite.output-modifier.js` - paste into the scenario **Output Modifier**

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

Re-run this suite only when changing Clock ops behavior, response shaping, heartbeat advertisement, or the Clock AI Dungeon suite scripts.
