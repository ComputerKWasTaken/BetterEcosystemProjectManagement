# Stateboy V1

## Implementation Plan

Stateboy is a Requires Ultrascripts AI Dungeon script for readable, AI-assisted state management. It uses three Story Cards:

- `Stateboy` for the live state sheet.
- `Stateboy Settings` for configuration.
- `Stateboy Guide` for informational help.

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

Debug Mode: Off
# When On, Stateboy shows runtime, AI, and update-summary debug widgets.

Minimum Confidence: 0.65
# The minimum AI confidence (0.0 to 1.0) required to apply a change.

Changelog Enabled: On
# When On, accepted AI updates are written to Notes and shown to the AI updater.

User Modification Changelog Enabled: On
# When On, manual Stateboy card value/add/remove edits are written to Notes and shown to the AI updater.

AI Changelog Entries: 6
# How many recent changes the AI updater sees.

Notes Changelog Entries: 20
# How many recent changes are mirrored into the Stateboy card Notes.
```

`Stateboy Guide`:

```text
# Stateboy Guide

Stateboy uses three Story Cards:
- Stateboy: the live state sheet and source of truth.
- Stateboy Settings: runtime configuration.
- Stateboy Guide: this help card. It is informational only.

## State Sheet Format
Add categories with ## Category Name.
Add states as Name: value.
Put descriptions in parentheses after values.
Use directives like [widget: off, context: off, ai: readonly].
```

The settings card replaces commands entirely. Stateboy does not depend on `state.message`.

## Runtime Behavior

- Library exposes `Stateboy(hook, text)`.
- Input, Context, and Output modifiers call the library function.
- Each hook ensures all three Story Cards exist.
- `Stateboy` and `Stateboy Settings` sync into `state.stateboy`; `Stateboy Guide` is informational only.
- If `Stateboy Enabled` is off, Stateboy does not inject context, run AI, or publish widgets.
- Context injection uses the state sheet, filters `context: off` states, strips directive metadata, and drops empty categories.
- AI updates are asynchronous and validated on a later hook.
- Accepted AI updates are logged with old value, new value, source, reason, and action count.
- Manual user changelogging is separate and logs value/add/remove edits when enabled, with no-op guards to prevent normalized value loops.
- When changelogging is enabled, Stateboy mirrors recent updates into the `Stateboy` card Notes and includes a bounded recent-change list in future AI updater prompts.
- Widget publishing is display-first and keyed by `info.actionCount`.
- Runtime status, AI status, and update-summary widgets are hidden unless `Debug Mode` is on.
- State directives can control widget visibility, story-context visibility, and AI updater modification permission.

## State Directives

Directives are trailing bracket metadata on state lines or category headers:

```text
## Secrets [widget: off, context: off, ai: readonly]
VillainPlan: Active
PublicClue: Found [context: on]
SecretFlag: On [widget: off, context: off, ai: readonly]
```

Category directives act as defaults. State directives override category directives. Official V1 keys are:

- `widget: on/off`
- `context: on/off`
- `ai: on/readonly/off`

Directive domains are independent. `widget: off` only hides from Widgets, `context: off` only hides from normal story context, and `ai: readonly` or `ai: off` prevents AI updater changes. Existing widget aliases such as `hiddenWidget: true` still work.

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

V1 accepts only `operation: "set"` for existing states. Unknown categories/states, wrong-type values, malformed responses, low-confidence proposals, AI-readonly states, and add/delete/rename attempts are rejected.

## Widget Dashboard

When Widgets are enabled, Stateboy publishes state widgets by default. Debug-only widgets are available when `Debug Mode` is on:

- Stateboy running status.
- AI status.
- Last accepted update summary.

Individual states or categories can opt out of widgets with directives:

```text
SecretFlag: On (Hidden plot flag) [widget: off]
## Secrets [widget: off]
```

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

Debug Mode: Off
# When On, Stateboy shows runtime, AI, and update-summary debug widgets.

Minimum Confidence: 0.65
# The minimum AI confidence (0.0 to 1.0) required to apply a change.

Changelog Enabled: On
# When On, accepted AI updates are written to Notes and shown to the AI updater.

User Modification Changelog Enabled: On
# When On, manual Stateboy card value/add/remove edits are written to Notes and shown to the AI updater.

AI Changelog Entries: 6
# How many recent changes the AI updater sees.

Notes Changelog Entries: 20
# How many recent changes are mirrored into the Stateboy card Notes.
```

Stateboy would also create a `Stateboy Guide` card with examples, supported value formats, description guidance, settings explanations, changelog notes, and State Directive examples. The guide is help text only; the live `Stateboy` card remains the source of truth.

If AI is disabled, Stateboy still injects your state sheet into context, but it will not modify values. If Widgets are enabled, BetterDungeon can show a live dashboard with XP bars, level stats, inventory lists, status badges, and recent update summaries.

Stateboy also keeps a changelog of accepted AI updates. Manual value/add/remove edits can be logged too, using raw Story Card change detection and no-op guards so ordinary value corrections inform the updater without creating changelog loops. Recent entries are fed back into the updater so it is less likely to repeat the same XP reward, stamina drop, relationship shift, or quest update on later turns.

The goal is to make state tracking plug-and-play for scenario authors without forcing everyone to write JSON, commands, or complex scripting systems.

A few questions for feedback:

- Is this simple Story Card format readable enough?
- What state types should v1 focus on first?
- Should Stateboy eventually support advanced settings like locked states, min/max, hidden states, or update rules?
- Would you want an approval mode where Widget shows proposed changes before applying them?
- How much should the Widget dashboard show before it becomes cluttered?
- What would you use Stateboy to track in your own scenarios?
