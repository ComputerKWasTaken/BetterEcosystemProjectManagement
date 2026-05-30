# 10 - Snippet Testing Walkthrough

> Simplified manual route for testing public Ultrascripts snippets in AI Dungeon.

## Goal

Use this walkthrough when you want to quickly paste snippets into a test scenario,
play a few turns, and report any bugs back for cleanup.

The detailed tracking list remains:

- `08-snippet-review-checklist.md` for review rules
- `09-snippet-verification-checklist.md` for item-by-item signoff

This file is the practical "what do I paste, where, and what do I do next?"
flow.

## Setup once

1. Create or open a Simple Start AI Dungeon scenario.
2. Open the scenario's Scripting editor from the Details tab.
3. Keep two tabs open:
   - Scripting editor, with Console Log visible.
   - Play test adventure launched from the Scripting editor Play button.
4. In the Scripting editor, keep these tabs ready:
   - Library
   - Input
   - Context
   - Output
5. In the play test adventure, use BetterDungeon with Ultrascripts enabled.
6. If testing AI, WebFetch, geolocation, weather, or other permissioned modules,
   configure or approve the relevant module before judging the snippet.

## Pasting rule

Library snippets go directly in the Library tab.

Modifier snippets go inside the existing AI Dungeon modifier wrapper for that
hook. Keep the final `modifier(text)` line as the last line.

Use this shape for Context, Input, and Output snippets unless the snippet already
contains the wrapper:

```js
const modifier = (text) => {
  // Paste the snippet body here.

  return { text };
};

modifier(text);
```

If the snippet already returns `{ text: ... }`, keep that return and do not add a
second return after it.

## Universal test loop

Run this loop for every snippet or snippet pair:

1. Paste the required Library code first.
2. Paste the Context, Input, or Output snippet into the matching hook.
3. Save scripts.
4. Start a fresh play test from the Scripting editor Play button.
5. Submit one ordinary action, such as:

```text
look around the room
```

6. Submit a second ordinary action, such as:

```text
wait and listen
```

7. Watch the Console Log, Inspect modal, and visible adventure output.
8. Mark the matching item in `09-snippet-verification-checklist.md`:
   - `[x]` if it works
   - `[!]` if it errors, stalls, copies wrong, or behaves differently than the docs claim

Most Ultrascripts snippets are one-turn delayed. Turn 1 queues a request. Turn 2
reads the response.

## Fast smoke test

Start here before testing module-specific snippets.

### 1. SDK helper

Checklist item:

- `UltrascriptsQuickStartGuide.vue:211` - SDK helper copy block

Paste into:

- Library

Then test with this minimal Context body:

```js
bd.us.tick();
log('US available: ' + bd.us.available());
log('Heartbeat modules: ' + JSON.stringify((bd.us.heartbeat() || {}).modules || []));
log('Has clock.now: ' + bd.us.has('clock', 'now'));
bd.us.commit();
```

Expected:

- No script error.
- Console Log prints `US available: true` when BetterDungeon is active.
- Console Log shows the heartbeat's module list.
- `bd.us.has(...)` returns true or false without throwing.

If this fails, stop and report the SDK/helper failure first. Most later snippets
depend on it.

### 2. Enhanced fallback pattern

Checklist item:

- `UltrascriptsQuickStartGuide.vue:275` - Enhanced fallback pattern

Paste into:

- Context

Expected:

- With BetterDungeon enabled, it queues or publishes optional Ultrascripts work.
- Without BetterDungeon, the adventure still proceeds normally.
- No "Unable to run scenario scripts" error.

### 3. Required guard pattern

Checklist item:

- `UltrascriptsQuickStartGuide.vue:318` - Required guard pattern

Paste into:

- Context

Expected:

- With required modules available, it proceeds.
- Without BetterDungeon or without the required module, it stops clearly with the
  documented user-facing message.
- It should not fail because of missing `bd`, missing heartbeat, or missing
  config.

## Main testing route

Work in this order. It catches foundational bugs early and avoids retesting a
broken helper repeatedly.

### Route A - Scripture and UI widgets

Use these when testing HP bars, quest trackers, inventory widgets, system
widgets, and Scripture examples.

Paste into:

- Library: SDK helper, then the snippet's Library/manifest block.
- Context: the snippet's Context block.
- Input: only if the snippet is specifically an event/input handler.
- Output: only if the snippet is specifically an output-time extractor.

Run:

1. Save.
2. Start fresh play test.
3. Take two normal turns.
4. Interact with the widget if the snippet has buttons or controls.
5. Take one more turn.

Expected:

- Widget appears or updates.
- Values persist across turns.
- Interactions are acknowledged once and do not repeat forever.
- Undo/redo does not duplicate stale UI state.

Checklist items:

- Quick Start HP bar library/context snippets
- Quick Start complete scenario library/context snippets
- Cookbook Recipe 1, 2, 6, and 8
- Scripture guide library, context, manifest, and input snippets

### Route B - Simple request/response modules

Use this for modules that queue an operation and read the result next turn.

Paste into:

- Library: SDK helper.
- Context: the module snippet.

Run:

1. Save.
2. Start fresh play test.
3. Turn 1: `look around`
4. Turn 2: `wait a moment`
5. Turn 3: `continue exploring`

Expected:

- Turn 1 queues a request with `bd.us.call(...)`.
- Turn 2 or 3 consumes a previous response with `bd.us.latest(...)`.
- The snippet does not assume same-turn completion.
- Missing modules are gated with `bd.us.has(...)`.

Checklist items:

- Clock context snippets
- Weather context snippets
- Network context snippets
- System context snippets
- Geolocation regional awareness recipe
- WebFetch context snippet
- Cookbook clock/weather/webfetch/system recipes

### Route C - AI snippets

Use this for Co-GM, structured extraction, and AI helper snippets.

Before testing:

- Confirm the SDK/config result reports AI as configured.
- If config is not available on turn 1, give the snippet at least two turns to
  request and read `sdk.config`.

Paste into:

- Library: SDK helper, plus any AI helper snippet if present.
- Context, Input, or Output: matching snippet tab.

Run:

1. Save.
2. Start fresh play test.
3. Turn 1: `look around`
4. Turn 2: `say "What is this place?"`
5. Turn 3: `wait for a reply`

Expected:

- AI request uses module `ai` and op `chat`.
- Args use `messages`, `maxTokens`, and `responseFormat` where appropriate.
- Snippet waits for a later turn before reading the response.
- If AI is not configured, the snippet gives a clear fallback instead of
  throwing.

Checklist items:

- Quick Start AI Co-GM context snippet
- Cookbook AI recipes
- AI guide request-side context snippet
- AI guide input consume snippet
- AI guide output snippet
- AI guide library helper snippet

### Route D - Input hook snippets

Use this for command handling, response consumption from player input, and
WebFetch/Input snippets.

Paste into:

- Library: SDK helper.
- Input: the snippet.

Run:

1. Save.
2. Start fresh play test.
3. Submit the command or phrase the snippet expects.
4. Submit one normal follow-up action.

Expected:

- Input text is returned as valid non-empty text unless the snippet intentionally
  rewrites it.
- No empty string is returned from Input.
- No `stop: true` is returned from Input.
- The normal adventure loop still advances.

Checklist items:

- AI guide input consume snippet
- WebFetch input snippet
- Scripture input snippet
- Geolocation input portion, if split from its library helper

### Route E - Output hook snippets

Use this for snippets that analyze or rewrite the AI output after the model
responds.

Paste into:

- Library: SDK helper and any manifest/helper block.
- Output: the snippet.

Run:

1. Save.
2. Start fresh play test.
3. Submit two normal actions.

Expected:

- Output returns non-empty text.
- It does not return `stop: true`.
- Any queued Ultrascripts call is read on a later output pass, not the same one.

Checklist items:

- Cookbook Recipe 6 output snippet
- AI guide output snippet

## Quick bug report format

When something breaks, capture this:

```md
## Snippet bug

- Checklist item:
- AI Dungeon hook: Library / Input / Context / Output
- BetterDungeon enabled: yes/no
- Modules configured:
- Turn number where it failed:
- Player input used:
- Visible error:
- Console log:
- Inspect modal notes:
- Expected behavior:
- Actual behavior:
```

If the problem is copy/paste-related, also include:

```md
- Copied text had HTML escapes: yes/no
- First broken line after paste:
```

## Stop conditions

Stop the testing pass and report immediately if any of these happen:

- SDK helper fails in Library.
- A snippet stores functions on `state`.
- A snippet writes `moduleId` instead of `module` in live requests.
- A snippet expects response arrays instead of keyed `responses`.
- A snippet returns an empty string from Input or Output.
- A snippet crashes before the adventure can advance.
