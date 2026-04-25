# 14 - Weather AI Dungeon Test Suite

Weather live validation is complete and archived.

The paste-ready harness files live in [archive/phase-7-weather-test-suite](./archive/phase-7-weather-test-suite/README.md).

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

Re-run this suite only when changing Weather ops behavior, response shaping, upstream normalization, heartbeat advertisement, dispatcher integration, or the archived Weather AI Dungeon suite scripts.
