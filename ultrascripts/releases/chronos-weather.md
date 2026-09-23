# Chronos V2 Seasonal Weather Update

## Status

Published on September 23, 2026 as AI Dungeon Chronos version 6 and in
BetterRepository. Chronos remains an independently released script.

## Delivered

- Optional weather, enabled by default, tied to the Gregorian date and fixed
  Northern Hemisphere seasons.
- Sunny, Cloudy, and Rain in all seasons; Snow only in winter. Each clock update
  makes one weather step, retaining valid weather with a 97% direct chance and
  otherwise drawing from the seasonal profile.
- Season and weather in model context, the Chronos Settings card, the
  BetterDungeon Widget, and the toast fallback. Turning tracking off hides
  weather and stops transitions.
- State migration that preserves existing clocks and settings, including
  deterministic weather history for retained clock-only Undo snapshots.
- One automatic time step per Context update, matching the observed AI Dungeon
  turn cadence even when `actionCount` rises by several actions.
- Updated AI Dungeon listing descriptions and a public release note.

## Verification

`npm run test:chronos` and `npm run build` passed in BetterRepository. AI
Dungeon's Script Test and a live adventure covered commands, seasonal weather,
Retry, Undo, display surfaces, and the Settings toggle. In the live adventure,
one Continue advanced the configured two minutes after the turn-cadence fix.

The Widget briefly lagged immediately after one live Undo; the prior Chronos
state was restored on the next scripted update. Keep this observation in mind
when checking future AI Dungeon or BetterDungeon changes.

## Sources

- [Published AI Dungeon Chronos](https://alpha.aidungeon.com/script/6studb3DjBpt/chronos?share=true&published=true)
- [BetterRepository](https://better-repository.netlify.app/scripts)
- [Chronos script contract](../reference/script-contract.md#chronos-v2)
