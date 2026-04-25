# 19 - Phase 8 Kickoff

Phase 8 is no longer a native Story Card UI filtering project.

AI Dungeon now groups Story Cards by collapsible type categories, including custom types. That means Frontier cards with `type: "frontier"` should naturally live under their own category in AI Dungeon's Story Card tab. BetterDungeon does not need to hide those cards from the native list with manual DOM filtering.

The new Phase 8 job is to document the changed UI and verify that Frontier's GraphQL write path still works after the update.

## Why This Matters

Frontier depends on AI Dungeon's Story Card substrate for both directions of the channel:

- Scripts read and write reserved cards such as `frontier:state:*` and `frontier:out`.
- BetterDungeon writes `frontier:heartbeat` and `frontier:in:<module>` through captured Story Card mutation templates.
- Core currently relies on seeing a usable Story Card mutation, historically `SaveQueueStoryCard`, before heartbeat writes can run.

If AI Dungeon changed the Story Card mutation name, variable shape, response shape, or timing, Frontier can appear healthy in code while failing to inject the heartbeat card.

## Scope

1. Update `action-hunter.user.js` into a Phase 8 diagnostic harness.
2. Capture the new Story Card DOM shape:
   - section tabs
   - Story Cards search box
   - grid/list/compact controls
   - collapsible type category headers
   - visible card titles
   - type badges
3. Capture GraphQL operation names over fetch, XHR, and WebSocket.
4. Capture Story Card mutation variable keys and response keys.
5. Diagnose why `frontier:heartbeat` is not injecting:
   - heartbeat card exists but moved under a native `frontier` category
   - Story Card mutation template was never captured
   - `SaveQueueStoryCard` was renamed
   - mutation variables changed
   - mutation response changed
   - Core schedules heartbeat before a usable template exists

## Updated Hunter Helpers

After installing the userscript and reloading AI Dungeon, use:

```js
__frontierActions.domSummary()
__frontierActions.graphqlSummary()
__frontierActions.storyCardOps()
__frontierActions.diagnoseHeartbeat()
```

For best results, open the Story Cards tab, expand the relevant custom type category, and edit or create a normal Story Card once so AI Dungeon emits its current save mutation.

## Acceptance

Phase 8 is complete when we can answer:

- What does the new Story Cards DOM look like?
- Do custom card types reliably appear as native collapsible categories?
- Is `frontier:heartbeat` actually absent, or merely grouped under `frontier`?
- Is the Story Card save mutation still `SaveQueueStoryCard`?
- If not, what is the new operation name and shape?
- Does BetterDungeon need a production write-path patch?

Any confirmed production drift should receive a targeted fix before Phase 9.

## Live Finding - 2026-04-25

The Story Card GraphQL path did not drift in the tested AI Dungeon build:

- `SaveQueueStoryCard` is still present.
- `GetGameplayAdventure` / `GetAdventure` still expose Story Cards.
- Native custom type categories work, including a `frontier` category.
- `frontier:heartbeat` was present in that category.

The real issue was heartbeat consistency. Core could schedule heartbeat during the short gap after an adventure boundary reset but before the first Story Card hydration. In that gap the card map is intentionally empty, so `upsertStoryCard('frontier:heartbeat', ...)` could not see the existing heartbeat and created a duplicate.

Production fix:

- Core now waits for the first `frontier:cards:full` hydration before writing heartbeat.
- Heartbeat writes target a remembered canonical card id when one exists.
- Existing exact-title duplicate heartbeat cards are archived under `frontier:archived:heartbeat:<id>` so scripts looking up the exact `frontier:heartbeat` title do not see conflicting copies.
- The write path now respects forced card ids, which is required for safe duplicate cleanup.
