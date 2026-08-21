# Chronos V2 Direction and Implementation Plan

## Status

Chronos V2 is the active BetterEcosystem script priority. Its fresh foundation
is implemented as an unpublished BetterRepository script and will iterate toward
a paired release with BetterDungeon V2.1.

## Product Contract

Chronos is a stable, lightweight in-game clock and Gregorian calendar. It has
four responsibilities:

1. advance time predictably from AI Dungeon's action count;
2. append the current time and date to model context;
3. display the same timestamp through the Ultrascripts Widget module; and
4. fall back to a `state.message` toast when Widget is unavailable.

Chronos does not own weather, seasons, temperature, astronomy, real-world clock
synchronization, output decoration, or broad world simulation. Those are better
served by independent focused scripts in AI Dungeon's multi-script landscape.

## Modern AI Dungeon Architecture

AI Dungeon supports first-class Script resources which can be saved, attached to
owned adventures, toggled, reordered, and inherited from scenarios. Attached
scripts compose in order, receive isolated errors, and keep private persistent
state.

Chronos therefore does not use the old library-centric lifecycle router. Its
Input file contains Input behavior, its Context file contains Context behavior,
and its Library contains only shared helpers.

## Cache-Compatible Context

Chronos Context begins with:

```js
// @cache-compatible
```

The modifier returns the entire incoming `text` unchanged and appends one short
timestamp suffix. It never prepends, deletes, replaces, truncates, or reorders
the model prompt. This keeps Chronos effective on Optimized Context models while
preserving their reusable cached prefix.

## Timekeeping Rules

- Default start: 8:00 AM on January 1, 1000.
- Default pace: two in-game minutes per adventure action.
- The first hook execution anchors the clock to the adventure's current action
  count, so attaching Chronos to a long-running adventure does not simulate its
  entire history.
- Repeated Context execution at the same action count is a Retry and does not
  advance time twice.
- A lower action count reverses the corresponding automatic time, so Undo
  restores the earlier timestamp.
- Paused or disabled turns update the action-count anchor without accumulating
  time to apply later.
- Gregorian month lengths and leap-year rules are deterministic.

## Settings

Chronos creates one compact `Chronos Settings` Story Card. It controls:

- enabled state;
- paused state;
- minutes per turn, bounded from 0 to 1,440;
- 12-hour or 24-hour display; and
- explicit time/date changes through `New Time`, `New Date`, and
  `Apply Changes`.

The card is configuration, not a second player-facing clock. Chronos does not
rewrite it every turn.

## Player-Facing Display

When a live BetterDungeon heartbeat advertises Widget, Chronos publishes two
stable widgets: `chronos-time` and `chronos-date`. Its publisher preserves
unrelated manifest entries and carries forward other scripts' current Widget
values before writing its own snapshot.

Without a live Widget module, Chronos sets a unique timestamp in
`state.message`. It never injects a recurring banner into story output.

## Verification Gate

Before publication, keep automated coverage for:

- the first-line cache-compatible annotation;
- unchanged prompt-prefix preservation;
- ordinary advancement, Retry, and Undo;
- midnight, month, year, and leap-day boundaries;
- settings parsing and explicit clock changes;
- live Widget publication and preservation of unrelated widgets;
- missing, disabled, and stale Ultrascripts fallback; and
- production BetterRepository build integrity.

Live-test the unpublished script on both vanilla AI Dungeon and BetterDungeon
before marking it released.
