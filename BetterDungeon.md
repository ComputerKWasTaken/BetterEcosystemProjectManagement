# BetterDungeon Project Management

> Release tracking for the AI Dungeon browser extension.

## Current Status

BetterDungeon V2 is in final release preparation. Ultrascripts is complete enough for launch, with its runtime, nine first-party modules, templates, regression suites, popup integration, and Chromium/Firefox/Android WebView support in place.

The remaining work is launch-focused:

1. Polish and verify BetterRepository V1.7 alongside the extension.
2. Upload BetterDungeon to Firefox Add-ons.
3. Continue Reddit teasers, resolve remaining bugs, and finish launch polish.
4. Release BetterDungeon V2 with BetterRepository V1.7.

## V2 Release Checklist

- [ ] Confirm the current Chromium build loads cleanly.
- [ ] Run the final feature regression pass.
- [ ] Verify Ultrascripts modules, templates, and examples against their current contracts.
- [ ] Confirm Android behavior remains aligned with the desktop runtime where applicable.
- [ ] Upload and validate the Firefox Add-ons listing.
- [ ] Continue Reddit teasers without overpromising unfinished post-launch work.
- [ ] Capture screenshots and finish README/store copy.
- [ ] Fix launch-blocking bugs and complete the final polish pass.
- [ ] Release BetterDungeon V2 alongside BetterRepository V1.7.

## What Is Already Done

- Ultrascripts transport, write queue, heartbeat discovery, and two-way envelopes.
- State-card dispatch, module registry, lifecycle handling, and popup settings.
- `widget`, `webfetch`, `clock`, `sdk`, `geolocation`, `weather`, `network`, `system`, and `ai` modules.
- Per-module AI Dungeon regression suites.
- Enhanced and Required starter templates.
- Chromium, Firefox/Gecko, and Android WebView support.
- Widget V2 polish.
- PC/mobile Ultrascripts resync.
- Mobile release-distribution polish.
- Stateboy Required Ultrascripts showcase script.

## Post-Launch

- Build Brainiac as an AI-powered story-card and brain-card management script.
- Build Chronos V2 as a vanilla-safe timekeeper enhanced by Ultrascripts.
- Consider broader runtime and ecosystem improvements after the launch settles.

## Risks to Keep Visible

- Public examples and BetterRepository guides can drift from the live helper/module contracts.
- AI module requests depend on user-provided API keys and must remain opt-in, bounded, and policy-safe.
- WebFetch examples must respect consent, blocked targets, and late responses.
- Mobile/PC parity should be checked after final shared-runtime changes rather than assumed.

## Canonical References

- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Ultrascripts roadmap](./ultrascripts/planning/current-roadmap.md)
- [Verification reference](./ultrascripts/reference/verification.md)
- [BetterDungeon SDK reference](./ultrascripts/reference/sdk.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
