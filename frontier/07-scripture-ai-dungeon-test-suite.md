# 07 - Scripture AI Dungeon Test Suite

This is the live AI Dungeon test harness for Frontier Phase 3 / Scripture. It is intentionally copy-pasteable into an actual AI Dungeon scenario so we can validate behavior against AI Dungeon's real script runtime, story-card persistence, WebSocket updates, undo/retry/edit/continue controls, and BetterDungeon rendering.

## Live Result

**Status:** Passed in AI Dungeon on 2026-04-22.

Validated behaviors:

- Initial render.
- Continue / forward turns.
- Undo.
- Retry.
- Edit.
- Refresh rehydrate.
- Manifest reset / sticky DOM regression.
- Sanitizer.
- Malformed state recovery.
- Module disable / re-enable.

## Files

- `scripture-test-suite.library.js` - paste into the scenario **Library**.
- `scripture-test-suite.output-modifier.js` - paste into the scenario **Output Modifier**.

The suite writes two cards:

- `frontier:state:scripture` - the real Scripture state card consumed by BetterDungeon.
- `frontier:test:scripture` - a diagnostic trace card for humans.

## Setup

1. Load BetterDungeon with the Phase 3 build.
2. Create or open a disposable AI Dungeon scenario/adventure.
3. Paste `scripture-test-suite.library.js` into **Library**.
4. Paste `scripture-test-suite.output-modifier.js` into **Output Modifier**.
5. Start or continue the adventure.
6. Confirm the widget bar appears near the top of the gameplay view.

## Expected Dashboard

The Scripture widget bar should show:

- `Scripture Suite` badge.
- Frontier heartbeat badge.
- Current live key.
- Turn counter.
- HP and Mana bars.
- Gold stat.
- Status badge.
- Phase text.
- Panel fixture.
- Checks list.
- Custom safe HTML widget.
- Reset fixture icon.

## Test Matrix

### 1. Initial Render

Action:

- Generate one normal AI output.

Pass:

- `frontier:state:scripture` exists.
- Scripture widgets render.
- `frontier:test:scripture` exists and shows the current `liveKey`, `turn`, and `heartbeatHasScripture`.
- All nine widget types are visible across the dashboard: `stat`, `bar`, `text`, `panel`, `custom`, `badge`, `list`, `icon`, `counter`.

### 2. Continue / Forward Turns

Action:

- Press Continue two or three times.

Pass:

- Turn, live key, HP, Mana, and Gold update every output.
- The `history` object in `frontier:state:scripture` gains entries keyed by live-count ordinal.
- Widgets do not duplicate or drift out of their left / center / right zones.

### 3. Undo

Action:

- After several turns, press Undo once.
- Press Undo again.

Pass:

- Live key decreases.
- HP, Mana, Gold, Turn, Status, and phase revert to the earlier history entry without the script writing anything new.
- Removed/newer entries can remain in the state card; the renderer should simply read the lower live key.

### 4. Retry

Action:

- Generate a normal output.
- Note the live key and visible values.
- Press Retry.

Pass:

- Live key stays the same after the replacement output.
- The state-card history entry for that live key is overwritten by the retry output.
- Widgets show the replacement output's values, not stale pre-retry values.

### 5. Edit

Action:

- Edit an earlier visible action without generating a new output.

Pass:

- Widgets remain stable.
- No duplicate widget container appears.
- The next generated output resumes normal state-card updates.

### 6. Refresh Rehydrate

Action:

- With widgets visible, reload the AI Dungeon tab.
- If needed, generate or undo once to force an action-window update.

Pass:

- This test is intentionally boring when it passes: the dashboard should come back looking like the same current turn, not flash to a special mode.
- Widget bar reappears from `frontier:state:scripture`.
- Values match the current live key once BetterDungeon has both the card snapshot and action stream.
- `frontier:heartbeat` eventually advertises the `scripture` module.

### 7. Manifest Reset / Sticky DOM Regression

Action:

- Type a prompt containing `scr reset` or `[[scr:reset]]`.
- Generate one output.
- Generate another normal output.

Pass:

- A red `RESET ACTIVE` badge appears for exactly one generated output.
- The phase text reads `phase: RESET ACTIVE`.
- The panel/list titles disappear during reset, and the `R` icon returns to default sizing/coloring.
- During reset, colors, badge variants, titles, icon size, and custom styles reset instead of leaving stale DOM state.
- On the next normal output, the full dashboard styling returns.
- `frontier:test:scripture` includes a recent event with `detail` equal to `manifest reset variant`.

### 8. Sanitizer

Action:

- Type a prompt containing `scr sanitize` or `[[scr:sanitize]]`.
- Generate one output.

Pass:

- The custom widget renders safe text.
- No script executes.
- `javascript:` image/src payloads and event-handler attributes are stripped.
- Safe inline color survives; unsafe URL-based styles are removed.

### 9. Malformed State Recovery

Action:

- Type a prompt containing `scr malformed` or `[[scr:malformed]]`.
- Generate one output.
- Generate one more normal output.

Pass:

- BetterDungeon does not crash when `frontier:state:scripture` contains malformed JSON.
- Existing widgets may remain or clear for that tick, but the next normal output restores valid Scripture widgets.

### 10. Module Disable / Re-enable

Action:

- Disable the `scripture` module via `window.Frontier.registry.disable('scripture')` in DevTools, or via the popup once Phase 7 UI exists.
- Generate an output.
- Re-enable via `window.Frontier.registry.enable('scripture')`.

Pass:

- Widgets disappear while Scripture is disabled.
- Heartbeat stops advertising Scripture after the next heartbeat.
- Re-enabling remounts the module and replays current cached state.

## DevTools Helpers

Useful console checks:

```js
window.Frontier?.core?.inspect?.()
window.Frontier?.registry?.inspect?.()
window.ScriptureModule?.inspect?.()
JSON.parse(window.Frontier.core.getCardByTitle('frontier:state:scripture').value)
JSON.parse(window.Frontier.core.getCardByTitle('frontier:test:scripture').value)
```

## Completed Criteria

The live Scripture test pass is complete:

- [x] Initial render passes.
- [x] Continue, undo, retry, edit, and refresh all match the expected live-count behavior.
- [x] Reset, sanitizer, and malformed recovery tests pass.
- [x] Disable/re-enable works by registry call or popup UI.
- [x] No duplicate widget containers appear after refresh, adventure navigation, or repeated state updates.
