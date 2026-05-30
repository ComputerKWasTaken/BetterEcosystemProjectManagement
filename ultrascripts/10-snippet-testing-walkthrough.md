# 10 - Snippet Testing Walkthrough

> Manual AI Dungeon route for the reduced public Ultrascripts snippet set.

## Goal

Use this walkthrough only for executable snippets that remain in Quick Start.
The Cookbook and module pages now mostly teach concepts, payload shapes, and
module contracts; those should get source review instead of full play testing.

Tracking files:

- `08-snippet-review-checklist.md` for review rules
- `09-snippet-verification-checklist.md` for current signoff status

## Setup once

1. Create or open a Simple Start AI Dungeon scenario.
2. Open the scenario's Scripting editor from the Details tab.
3. Keep two tabs open:
   - Scripting editor, with Console Log visible.
   - Play test adventure launched from the Scripting editor Play button.
4. Keep Library, Context, Input, and Output tabs ready.
5. Use BetterDungeon with Ultrascripts enabled.
6. Configure permissioned modules before testing snippets that rely on them.

## Pasting rule

Library snippets go directly in Library.

Context snippets go inside the existing Context modifier wrapper. Keep
`modifier(text)` as the final line in the AI Dungeon editor.

Use this wrapper shape when testing modifier-body snippets:

```js
const modifier = (text) => {
  // Paste snippet body here.

  return { text };
};

modifier(text);
```

Do not paste snippets that contain top-level `return` into this shape. That is a
bug in the snippet.

## Universal Test Loop

For each kept snippet or snippet pair:

1. Paste the required Library code first.
2. Paste the matching Context snippet.
3. Save scripts.
4. Start a fresh play test from the Scripting editor Play button.
5. Submit `look around the room`.
6. Submit `wait and listen`.
7. Watch Console Log, Inspect, story cards, and visible adventure output.
8. Mark the item in `09-snippet-verification-checklist.md`.

Most module calls are one-turn delayed: turn 1 queues; turn 2 reads.

## Test Order

### 1. SDK Helper

Checklist item:

- `UltrascriptsQuickStartGuide.vue:211`

Paste into:

- Library

Temporary Context smoke test:

```js
bd.us.tick();
log('US available: ' + bd.us.available());
log('Story card keys: ' + (storyCards || []).map(function (c) { return c.title || c.keys || c.key || '?'; }).join(', '));
log('Heartbeat modules: ' + JSON.stringify((bd.us.heartbeat() || {}).modules || []));
log('Has clock.now: ' + bd.us.has('clock', 'now'));
bd.us.commit();
```

Expected:

- `US available: true`
- `Story card keys` includes `ultrascripts:heartbeat`
- `Heartbeat modules` includes mounted modules
- `Has clock.now: true` when Clock is enabled

### 2. Enhanced Fallback

Checklist item:

- `UltrascriptsQuickStartGuide.vue:275`

Paste into:

- Context

Expected:

- With Scripture enabled, `ultrascripts:state:scripture` is created and the HP widget renders.
- With Scripture disabled, context gets `[HP: 100/100]`.
- Clock request queues only when `clock.now` exists.

### 3. Required Guard

Checklist item:

- `UltrascriptsQuickStartGuide.vue:323`

Paste into:

- Context

Expected:

- No illegal early return.
- Missing runtime/module/config produces a clear context message.
- Configured AI path queues `ai.chat` and adds the configured-path context note.

### 4. HP Bar Pair

Checklist items:

- `UltrascriptsQuickStartGuide.vue:379`
- `UltrascriptsQuickStartGuide.vue:389`

Paste into:

- Library: manifest snippet
- Context: publish snippet

Expected:

- `ultrascripts:state:scripture` appears.
- HP bar renders and updates across turns.

### 5. Clock Context

Checklist item:

- `UltrascriptsQuickStartGuide.vue:422`

Expected:

- Turn 1 queues `clock.now`.
- Turn 2 reads a completed clock response.
- Ambient context uses `data.time`/`data.local`, not invented fields.

### 6. AI Co-GM

Checklist item:

- `UltrascriptsQuickStartGuide.vue:473`

Expected:

- Gated by `sdk.config`.
- Queues `ai.chat` only when AI is configured.
- Reads previous AI response from `data.text` or `data.message.content` on a later turn.

### 7. Complete Scenario Pair

Checklist items:

- `UltrascriptsQuickStartGuide.vue:532`
- `UltrascriptsQuickStartGuide.vue:543`

Expected:

- Clock and Scripture parts work even if AI is unavailable.
- AI part is gated and does not crash when unconfigured.
- Commit runs once at the end.

## Bug Report Format

```md
## Snippet bug

- Checklist item:
- AI Dungeon hook:
- BetterDungeon enabled:
- Modules configured:
- Turn number:
- Player input:
- Visible error:
- Console log:
- Story card notes:
- Expected:
- Actual:
```

## Stop Conditions

Stop and report immediately if:

- SDK helper fails.
- A snippet stores functions on `state`.
- A snippet has a top-level early `return`.
- A snippet writes raw request envelopes outside the SDK helper.
- A snippet assumes same-turn module responses.
- Input or Output returns an empty string.
