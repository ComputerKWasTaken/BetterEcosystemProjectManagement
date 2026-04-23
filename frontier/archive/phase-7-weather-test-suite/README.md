# Archived - Weather AI Dungeon Test Suite

This is the completed live Weather validation suite. The stable summary page is [14 - Weather AI Dungeon Test Suite](../../14-weather-ai-dungeon-test-suite.md).

This harness validated that BetterDungeon advertises the Weather module through Frontier, answers `current` and `forecast` ops with structured Open-Meteo-backed results, and rejects invalid Weather args with structured errors.

## Files

- `weather-test-suite.library.js` - paste into the scenario **Library**
- `weather-test-suite.output-modifier.js` - paste into the scenario **Output Modifier**

## Completed Result

Weather passed in AI Dungeon on 2026-04-23 with run `weather-moc01s0q`.

Validated:

- Full-profile heartbeat and Weather `current` / `forecast` advertisement
- structured current-weather response for Houston in imperial units
- structured 2-day forecast response for Houston coordinates in imperial units
- missing-location rejection
- invalid-units rejection
- invalid-latitude rejection
- terminal response ack and tombstone behavior

Re-run this suite only when changing Weather ops behavior, response shaping, upstream normalization, heartbeat advertisement, or the Weather AI Dungeon suite scripts.
