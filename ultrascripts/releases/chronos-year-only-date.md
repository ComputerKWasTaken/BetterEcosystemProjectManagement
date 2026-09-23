# Chronos V2 Year-Only Date and Display Update

## Status

Published on September 23, 2026 as AI Dungeon Chronos version 7. The matching
raw-script source and catalog entry are in BetterRepository.

## Delivered

- `/date 1347` changes the year while retaining the current month, day, and
  time. Full-date commands remain available. If the current date is February
  29 and the target year is not a leap year, Chronos asks for a complete date
  rather than silently changing the day.
- The Settings card separates read-only values, commands, and editable
  settings. Paused and Show Time Phase are retired. Older saved settings are
  removed during initialization; time phases display whenever time tracking
  is on.
- The Widget presents clock/date and season/weather in distinct groups that
  wrap on narrow displays.
- The public description and update note explain the new command behavior.

## Sources

- [Published AI Dungeon Chronos](https://alpha.aidungeon.com/script/6studb3DjBpt/chronos?share=true&published=true)
- [BetterRepository](https://better-repository.netlify.app/scripts)
- [Chronos script contract](../reference/script-contract.md#chronos-v2)
