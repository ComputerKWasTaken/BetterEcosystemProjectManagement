# 18 - Phase 7 Kickoff

Phase 7 brings Frontier out of "implemented module platform" mode and into normal BetterDungeon product plumbing.

The core behavior is now validated. The next job is making it manageable: toggles, popup state, module enablement, debug controls, and consent management.

## Goal

Users should be able to control Frontier from BetterDungeon's ordinary UI instead of relying on hardcoded module load order or DevTools helpers.

## Scope

- Add a Frontier master toggle.
- Show the current Frontier status in the popup.
- Add per-module toggles for Scripture, WebFetch, Clock, Geolocation, Weather, Network, and System.
- Keep `test` hidden or development-only.
- Add WebFetch consent/allowlist management.
- Add a Frontier debug toggle.
- Make heartbeat output reflect enabled/disabled modules after settings changes.

## First Slice

Implemented locally:

- Frontier is now managed by `FeatureManager` through `features/frontier_feature.js`.
- Frontier now has its own popup tab.
- The Frontier tab has a master toggle.
- The Frontier tab shows live status when an AI Dungeon tab is active.
- The Frontier tab presents public modules in Features-style sections with expandable icon-led cards, richer descriptions, and enabled/total count pills.
- The internal `test` module remains hidden from the popup.
- WebFetch origin decisions can be viewed, added, denied, or cleared from inside the WebFetch module card.
- Frontier debug mode remains available from the Frontier tab.
- Frontier action buttons now use explicit BetterDungeon button variants instead of browser-default styling.

Cleanup status:

- Popup script parses cleanly.
- Manifest parses cleanly.
- Frontier markup has been checked for balanced tags.
- No stale Frontier row-only selectors remain in the popup.

Final validation target:

- Reload the extension.
- Open an AI Dungeon adventure.
- Toggle Frontier off and confirm the heartbeat stops updating / module list empties.
- Toggle Frontier back on and confirm the heartbeat advertises the enabled public modules.
- Disable one module, refresh the adventure, and confirm it disappears from `frontier:heartbeat`.
- Add and clear one WebFetch origin from the popup.

## Files To Inspect First

- `BetterDungeon/core/feature-manager.js`
- `BetterDungeon/main.js`
- `BetterDungeon/popup.html`
- `BetterDungeon/popup.js`
- `BetterDungeon/services/frontier/core.js`
- `BetterDungeon/services/frontier/module-registry.js`
- `BetterDungeon/modules/webfetch/consent.js`

## Acceptance

- Popup reflects whether Frontier is enabled.
- Popup can enable/disable individual public modules.
- Settings persist across reload.
- Core applies module changes without a manual code edit.
- `frontier:heartbeat` advertises only enabled public modules.
- WebFetch allowlist can be inspected and edited through the popup.
- Debug state can be toggled and read back.

## Not In This Phase

- Provider AI
- Local AI
- Third-party module registry
- Sandboxed user modules
- Rich live request logs

Those are important, but not part of the Phase 7 cleanup/integration pass.
