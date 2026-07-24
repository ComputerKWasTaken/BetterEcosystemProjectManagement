# BetterDungeon Project Management

> Maintenance status for the released AI Dungeon browser extension.

## Current Status

BetterDungeon V2 is released. The extension and mobile app now serve as the
stable runtime foundation for the remaining BetterEcosystem releases.

BetterDungeon has no active feature milestone in this era. Change it only when:

- a confirmed defect affects security or core compatibility
- BetterRepository V1.7 exposes inaccurate V2 behavior
- Stateboy, Brainiac, or Chronos V2 reveals a small contract or regression issue
- desktop/mobile parity breaks in a supported shared feature

New platform work, broad refactors, and speculative runtime expansion are out of
scope until the final release sequence is complete.

## V2 Baseline

- Ultrascripts transport, write queue, heartbeat discovery, and two-way envelopes.
- State-card dispatch, module registry, lifecycle handling, and popup settings.
- `widget`, `webfetch`, `clock`, `sdk`, `weather`, `network`, `system`, and `ai`
  modules.
- Per-module AI Dungeon regression suites.
- Enhanced and Required starter templates.
- Chromium, Firefox/Gecko, and Android WebView support.
- Widget V2 polish.
- PC/mobile Ultrascripts resynchronization.
- Mobile release-distribution polish.

## Remaining-Era Role

1. Support BetterRepository V1.7 documentation accuracy.
2. Support Stateboy verification and publication.
3. Support Brainiac only after Stateboy is public.
4. Support Chronos V2 only after Brainiac is public.
5. End with a stable V2 maintenance baseline rather than another feature cycle.

## Maintenance Gate

Before accepting a BetterDungeon change, confirm:

- the issue is reproducible against the released V2 baseline
- the smallest safe fix is understood
- relevant desktop/mobile behavior and regression coverage are checked
- public docs or templates are updated if the contract changed
- the fix does not silently create a new feature track

## Risks to Keep Visible

- Public examples and BetterRepository guides can drift from live contracts.
- AI requests depend on player-provided API keys and must remain opt-in and bounded.
- WebFetch examples must respect consent, blocked targets, and late responses.
- Mobile/PC parity must be checked after shared-runtime maintenance changes.

## Canonical References

- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Ultrascripts roadmap](./ultrascripts/planning/current-roadmap.md)
- [Verification reference](./ultrascripts/reference/verification.md)
- [BetterDungeon SDK reference](./ultrascripts/reference/sdk.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
