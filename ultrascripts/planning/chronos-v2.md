# Chronos V2 Direction and Implementation Plan

## Status

Chronos V2 is complete and release-ready. Its fresh lightweight foundation,
Ultrascripts integration, documentation, polish, and verification are finished.
It remains unpublished only so it can release alongside BetterDungeon V2.1,
which is now the active final-polish and cleanup priority.

## Product Contract

Chronos is a stable, lightweight in-game clock and Gregorian calendar. It has
five responsibilities:

1. advance time predictably from AI Dungeon's action count;
2. append the selected current time and/or date to model context;
3. display the same timestamp through the Ultrascripts Widget module; and
4. maintain a live player-facing readout in its Story Card; and
5. use `state.message` as an additional toast surface when the platform honors
   it.

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

- Default start: 8:00 AM on June 1, 2026.
- Default pace: two in-game minutes per adventure action.
- The first hook execution anchors the clock to the adventure's current action
  count, so attaching Chronos to a long-running adventure does not simulate its
  entire history.
- Repeated Context execution at the same action count is a Retry and does not
  advance time twice.
- Chronos stores bounded action-count snapshots. A lower action count restores
  the exact earlier timestamp, including across manual advances and clock
  changes, rather than estimating Undo from the current turn rate.
- Paused or disabled turns update the action-count anchor without accumulating
  time to apply later.
- Clock arithmetic uses absolute Gregorian minute indexes rather than repeated
  day-by-day loops. Large jumps, reverse movement, month/year rollover, century
  leap-year exceptions, and both supported calendar boundaries stay
  deterministic.
- Persisted state is normalized defensively so malformed current values recover
  to safe defaults instead of poisoning the clock lifecycle.

## Settings

Chronos creates one compact `Chronos Settings` Story Card. It controls:

- enabled state;
- paused state;
- time tracking/display, enabled by default;
- date tracking/display, enabled by default;
- derived time-phase display, enabled by default;
- minutes per turn, bounded from 0 to 1,440;
- 12-hour or 24-hour display;
- `Long`, `ISO`, `American`, or `European` player-facing date format.

The card begins with read-only current time, time phase, and date fields before
showing settings or command help. Chronos refreshes it every turn, keeping it
near the top of the Story Card list and making the important information visible
without opening the full card. Disabled tracking fields show `Hidden`. Live time
and date changes belong to commands.

The tracking toggles control what Chronos exposes through context, Widget,
toast, and Story Card displays. Its internal clock and calendar continue moving
together so rollover remains correct and either component can be safely
re-enabled later.

Date format affects the Story Card, Widget, toast, and command confirmations.
Model context always uses the unambiguous long form, including weekday and full
month name, regardless of the player's display preference.

## Time Phases

Chronos derives a phase directly from the current hour, so there is no separate
simulation state to drift away from the clock:

- After Midnight: 12:00–2:59 AM;
- Predawn: 3:00–4:59 AM;
- Dawn: 5:00–6:59 AM;
- Morning: 7:00–9:59 AM;
- Late Morning: 10:00–11:59 AM;
- Midday: 12:00–1:59 PM;
- Afternoon: 2:00–4:59 PM;
- Evening: 5:00–7:59 PM;
- Night: 8:00–11:59 PM.

`Show Time Phase` controls phase presentation in model context, the live Story
Card, Widget, toast, and command confirmations. Hiding time also hides its phase.

## Commands

Chronos recognizes only its small clock-control surface and leaves unrelated
slash commands untouched for other attached scripts:

- `/time` displays the current time;
- `/time 8:30 AM`, `/time 8 PM`, or `/time 20:30` sets it;
- `/date` displays the current date;
- `/date June 1, 2026`, `/date Jun 1, 2026`, or `/date 2026-06-01` sets it;
- `/advance N minutes`, `/advance N hours`, `/advance N days`, or
  `/advance N weeks` moves forward by an exact duration. Positive whole numbers
  and common unit abbreviations are accepted. `/adv`, `/addtime`, `/skiptime`,
  and `/fastforward` are equivalent aliases. Requests beyond the final supported
  date leave time unchanged and report the calendar limit;
- `/chronos` displays the compact command reference.

Current AI Dungeon behavior treats `stop` from `onInput` as a script error.
Chronos therefore converts a handled command into a minimal narrative action,
applies the state change exactly once in Context, and provides confirmation via
Widget/toast presentation. Command turns do not receive the ordinary automatic
minutes-per-turn increment.

## Player-Facing Display

When a live BetterDungeon heartbeat advertises Widget, Chronos publishes one
centered custom-HTML clock strip. It presents amber tabular time, an optional
derived phase, and a shortened low-contrast date separated by quiet dividers
inside a small rounded surface. It has no labels, emoji, controls, or dashboard
chrome. The HTML remains
string-backed, so values such as `8:00 AM` cannot be coerced to the number `8`.
The publisher preserves unrelated manifest entries and carries forward other
scripts' current Widget values before writing its own snapshot.
Chronos bounds its own Widget history and removes both current and retired
Widget values when disabled, without deleting history owned by other scripts.

Without a live Widget module, Chronos sets a unique timestamp in
`state.message`. An invisible alternating marker keeps otherwise identical
paused-time and command toasts eligible for display without adding visual
noise. Adventure Scripts currently have an Alpha platform bug which prevents
these toasts from appearing, but retaining the normal API path is harmless and
allows them to resume automatically when fixed. The live Story Card remains
available regardless. Chronos never injects a recurring banner into story
output.

## Verification Gate

Before publication, keep automated coverage for:

- the first-line cache-compatible annotation;
- unchanged prompt-prefix preservation;
- ordinary advancement, Retry, and Undo;
- exact snapshot restoration across commands and manual advances;
- midnight, month, year, leap-day, century, large-jump, and calendar-boundary math;
- settings, date-format and time-phase presentation, and slash-command parsing;
- live Story Card refresh and independent time/date tracking combinations;
- malformed persisted-state recovery and abandoned-command cancellation;
- exact minute, hour, day, and week advances plus invalid-duration handling;
- live Widget publication, bounded history, cleanup, and preservation of
  unrelated widgets;
- missing, disabled, and stale Ultrascripts behavior plus retained toast state; and
- production BetterRepository build integrity.

The unpublished script has completed its implementation and verification gate.
Hold publication for its paired release with BetterDungeon V2.1.
