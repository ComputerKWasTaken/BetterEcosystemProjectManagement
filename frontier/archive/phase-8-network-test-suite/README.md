# Archived - Network AI Dungeon Test Suite

This is the completed live Network validation suite. The stable summary page is [15 - Network AI Dungeon Test Suite](../../15-network-ai-dungeon-test-suite.md).

This harness validated that BetterDungeon advertises the Network module through Frontier, answers `status` with browser connectivity hints, and rejects invalid args with structured errors.

## Files

- `network-test-suite.library.js` - paste into the scenario **Library**
- `network-test-suite.output-modifier.js` - paste into the scenario **Output Modifier**

## Completed Result

Network passed in AI Dungeon on 2026-04-24 with run `network-mod9rs9o`.

Validated:

- Full-profile heartbeat and Network `status` advertisement
- structured online/connection-hints response
- invalid-args rejection
- terminal response ack and tombstone behavior

Re-run this suite only when changing Network ops behavior, response shaping, heartbeat advertisement, or the Network AI Dungeon suite scripts.
