# Stateboy V1

## Implementation Plan

Stateboy is a Requires Ultrascripts AI Dungeon script for readable, AI-assisted state management. It uses two Story Cards:

- `Stateboy` for the live state sheet.
- `Stateboy Settings` for configuration.

When enabled, Stateboy parses the state sheet, injects the current state into model context, optionally asks the Ultrascripts AI module to propose updates, validates those updates in script code, rewrites accepted state changes, and optionally publishes a Widget dashboard.

Core rule: **AI suggests; Stateboy enforces.**

## Story Cards

`Stateboy`:

```text
## Player Stats
XP: 0/1000
Level: 1

## Inventory
Inventory: empty

# How to use Stateboy
# Add a category with ## Category Name
# Add a state with Name: value
# Stateboy guesses the type from how you write the value:
# number: a plain number like 5 or -3.5
# ratio: current/max like 20/100
# percent: a number followed by % like 85%
# boolean: On/Off, True/False, or Yes/No
# list: comma-separated values like Sword, Shield, Potion
# string: anything else
```

`Stateboy Settings`:

```text
# Stateboy Settings
# Edit the values below. Toggles accept On or Off.

Stateboy Enabled: On
# When On, Stateboy reads the state sheet and injects it into story context.

AI Enabled: On
# When On, the AI module may propose state changes based on events.

Widgets Enabled: On
# When On, Stateboy publishes a widget dashboard.

Minimum Confidence: 0.65
# The minimum AI confidence (0.0 to 1.0) required to apply a change.

Changelog Enabled: On
# When On, accepted AI updates are written to Notes and shown to the AI updater.

User Modification Changelog Enabled: Off
# When On, manual Stateboy card add/remove edits are written to Notes and shown to the AI updater.

AI Changelog Entries: 6
# How many recent changes the AI updater sees.

Notes Changelog Entries: 20
# How many recent changes are mirrored into the Stateboy card Notes.
```

The settings card replaces commands entirely. Stateboy does not depend on `state.message`.

## Runtime Behavior

- Library exposes `Stateboy(hook, text)`.
- Input, Context, and Output modifiers call the library function.
- Each hook ensures both Story Cards exist and syncs them into `state.stateboy`.
- If `Stateboy Enabled` is off, Stateboy does not inject context, run AI, or publish widgets.
- Context injection injects the state card text as-is, so the model sees the same sheet the player edits.
- AI updates are asynchronous and validated on a later hook.
- Accepted AI updates are logged with old value, new value, source, reason, and action count.
- Manual user changelogging is separate, off by default, and logs only structural add/remove edits when enabled.
- When changelogging is enabled, Stateboy mirrors recent updates into the `Stateboy` card Notes and includes a bounded recent-change list in future AI updater prompts.
- Widget publishing is display-first and keyed by `info.actionCount`.

## AI Contract

Stateboy sends schema-backed JSON to `ai.query`:

```json
{
  "changes": [
    {
      "category": "Player Stats",
      "name": "XP",
      "operation": "set",
      "value": 650,
      "confidence": 0.82,
      "reason": "The player earned 150 XP."
    }
  ],
  "summary": "XP increased after the encounter."
}
```

V1 accepts only `operation: "set"` for existing states. Unknown categories/states, wrong-type values, malformed responses, low-confidence proposals, and add/delete/rename attempts are rejected.

## Widget Dashboard

When Widgets are enabled, Stateboy publishes:

- Stateboy running status.
- AI status.
- Last accepted update summary.
- One widget for each state in the sheet.

State mapping:

- ratio and percent -> bar
- number -> stat
- string -> text
- list -> taggroup or list
- boolean -> badge
- object -> compact text

## Reddit Post Draft

# Stateboy: AI-Assisted State Management for AI Dungeon

AI Dungeon is incredible because it can tell almost any story. That flexibility is also the problem: the model is not naturally rigid.

If your scenario needs XP, levels, stamina, inventory, relationship scores, quest flags, reputation, wounds, time, or any other persistent state, the story model can forget it, drift away from it, or contradict it.

Stateboy is my concept for solving that with BetterDungeon's Ultrascripts system.

The basic idea is simple: you create one readable Story Card called `Stateboy`, and that card becomes your scenario's live state sheet.

```text
## Player Stats
XP: 0/1000
Level: 1

## Inventory
Inventory: empty

# How to use Stateboy
# Add a category with ## Category Name
# Add a state with Name: value
# Stateboy guesses the type from how you write the value:
# number: a plain number like 5 or -3.5
# ratio: current/max like 20/100
# percent: a number followed by % like 85%
# boolean: On/Off, True/False, or Yes/No
# list: comma-separated values like Sword, Shield, Potion
# string: anything else
```

Stateboy reads this card, converts it into structured internal state, and injects the state sheet directly into the story context so the model can actually account for those values while writing.

Then, if enabled, Stateboy uses the Ultrascripts AI module to analyze what happened and propose state changes. The important part is that the AI does not directly control the state.

The rule is:

**AI suggests. Stateboy enforces.**

For example, the AI might propose that XP should increase from `0/1000` to `150/1000` after a fight. Stateboy then checks that the XP state exists, checks the type, checks confidence, clamps values when needed, and only then applies the change. Unknown states, wrong types, low-confidence changes, or attempts to create/delete states are rejected.

Stateboy would also have a settings card:

```text
# Stateboy Settings
# Edit the values below. Toggles accept On or Off.

Stateboy Enabled: On
# When On, Stateboy reads the state sheet and injects it into story context.

AI Enabled: On
# When On, the AI module may propose state changes based on events.

Widgets Enabled: On
# When On, Stateboy publishes a widget dashboard.

Minimum Confidence: 0.65
# The minimum AI confidence (0.0 to 1.0) required to apply a change.

Changelog Enabled: On
# When On, accepted AI updates are written to Notes and shown to the AI updater.

User Modification Changelog Enabled: Off
# When On, manual Stateboy card add/remove edits are written to Notes and shown to the AI updater.

AI Changelog Entries: 6
# How many recent changes the AI updater sees.

Notes Changelog Entries: 20
# How many recent changes are mirrored into the Stateboy card Notes.
```

If AI is disabled, Stateboy still injects your state sheet into context, but it will not modify values. If Widgets are enabled, BetterDungeon can show a live dashboard with XP bars, level stats, inventory lists, status badges, and recent update summaries.

Stateboy also keeps a changelog of accepted AI updates. Manual add/remove edits can be logged too, but that is controlled by a separate opt-in setting so ordinary value corrections never create changelog loops. Recent entries are fed back into the updater so it is less likely to repeat the same XP reward, stamina drop, relationship shift, or quest update on later turns.

The goal is to make state tracking plug-and-play for scenario authors without forcing everyone to write JSON, commands, or complex scripting systems.

A few questions for feedback:

- Is this simple Story Card format readable enough?
- What state types should v1 focus on first?
- Should Stateboy eventually support advanced settings like locked states, min/max, hidden states, or update rules?
- Would you want an approval mode where Widget shows proposed changes before applying them?
- How much should the Widget dashboard show before it becomes cluttered?
- What would you use Stateboy to track in your own scenarios?
