# BetterDungeon — Project and Maintenance Reference

> BetterDungeon v2.1 shipped on browser and Android. This page summarizes the
> release and records the current maintenance boundaries.

## Current Status

BetterDungeon v2.1 is complete and published across the browser extension and
Android app. The release included the completed Navigator experience, the nine
first-party Ultrascripts modules, platform compatibility work, release
documentation, public guidance, and promotional materials. There is no remaining
v2.1 release checklist.

Browser and Android development share one repository. `dev` is the normal
contributor workspace, protected `preview` is GitHub's default branch for the
newest tested build, and `release` records the published source. The Node smoke
checks, extension package validation, and Android quality gate run on every
push and retain a browser ZIP and debug APK for review.

Chronos V2 shipped independently. BetterDungeon is now maintained through
confirmed bug fixes and contract updates. Stateboy is the active follow-on
showcase project; Brainiac remains later in the sequence.

## Shipped v2.1 Scope

- Reliable Ultrascripts heartbeat liveness with persistent `beat` advancement
  and explicit `PC`/`Mobile` platform reporting.
- Nine first-party modules: `widget`, `webfetch`, `clock`, `sdk`, `weather`,
  `network`, `system`, `ai`, and `audio`.
- Bounded synthesized Audio effects and credential-free public HTTPS WebFetch.
- A provider-neutral AI executor for Gemini, OpenRouter, and remote Custom
  HTTPS endpoints, with explicit provider selection and no silent failover.
- Navigator multi-turn streaming chat grounded in an always-attempted bounded
  snapshot of Plot Components, recent story, Memory Bank, and Story Cards.
- Six bounded Navigator retrieval tools, three change modes, verified writes,
  approval for permanent deletions, and per-adventure conversation persistence.
- Navigator integrated into AI Dungeon Gameplay settings on PC and Mobile,
  with platform-specific navigation and input polish.
- Chromium, Firefox/Gecko, and Android WebView support.
- The undecided Artisan teaser hidden from current release surfaces.

## Product Boundaries

- Navigator is player-initiated. It does not run scheduled, event-triggered, or
  unattended automations.
- Navigator always attempts canonical context sections within its budget;
  context selection controls and the Read Plot Components tool are not part of
  the shipped product.
- Every Navigator write is conflict-checked, serialized, and verified with a
  fresh server read. Storage uncertainty fails closed as No changes.
- Provider selection is explicit. BetterDungeon does not silently fail over
  between Gemini, OpenRouter, and Custom services.
- Local HTTP model endpoints, arbitrary scenario-supplied JavaScript
  execution, a third-party module marketplace, and a broad TypeScript/bundler
  migration were outside v2.1. Any future proposal needs its own scope and
  security review.
- Ambience remains a possible future feature. Settle its audio source and
  licensing model before considering implementation; keep any first version
  small and player-controlled.

## Ongoing Maintenance

- Keep the shared web runtime aligned across browser and Android while
  preserving deliberate platform differences: the browser keeps overflow
  arrows for settings-tab access; Android uses native drag/swipe navigation
  without custom arrows.
- Preserve the public `ai.query` and Ultrascripts Story Card contracts.
- Run the monorepo quality gate for changes. Use focused manual device and
  compatibility checks where product behavior cannot be established
  automatically.
- Prefer implementation and durable contracts over completed planning notes.
- Scope additional providers or Navigator capabilities as new work with
  explicit security and migration review.

## Canonical References

- [Monorepo, build, branch, and CI/CD guide](../BetterDungeon/docs/MONOREPO.md)
- [BetterDungeon v2.1 release record](./ultrascripts/releases/betterdungeon-v2.1.md)
- [Navigator architecture and product contract](./navigator/navigator-design.md)
- [Navigator verified mutation reference](./navigator/navigator-mutation-contract.md)
- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Ultrascripts verification reference](./ultrascripts/reference/verification.md)
