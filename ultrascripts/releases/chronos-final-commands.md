# Chronos V2 Final Command Update

## Status

Published on September 23, 2026 as AI Dungeon Chronos version 8. The matching
raw script and catalog entry are maintained in BetterRepository. Chronos is
complete as a feature project and remains in maintenance.

## Delivered

- `/date June 1` and `/date 12/5` retain the current year and time. Numeric
  pairs use day/month in European format and month/day otherwise; full-date and
  year-only commands continue to work.
- `/weather Rain` or another weather name immediately overrides the condition.
  `/weather Winter` or another season name overrides the displayed season
  without changing the Gregorian date. Manual weather can temporarily produce
  Snow outside winter.
- Manual changes appear in model context, the Settings card, and Widget or
  toast output. The next clock change clears the override and draws fresh
  weather from the date's normal season. Retry preserves the current override;
  Undo restores the recorded state.
- The Settings card explains that `Minutes Per Turn: 0` stops automatic clock
  advancement. With the clock still, a manual weather or season choice remains
  until a command changes the clock.

## Verification

`npm run test:chronos` and `npm run build` passed. The published AI Dungeon
listing showed version 8 and the matching release note.

## Sources

- [Published AI Dungeon Chronos](https://alpha.aidungeon.com/script/6studb3DjBpt/chronos?share=true&published=true)
- [BetterRepository](https://better-repository.netlify.app/scripts)
- [Chronos script contract](../reference/script-contract.md#chronos-v2)
