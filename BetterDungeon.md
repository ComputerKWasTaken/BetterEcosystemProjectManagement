# BetterDungeon Project Management

> Active development and release reference for BetterDungeon v2.1.

## Current Status

BetterDungeon **v2.1** is functionally complete across the browser extension
and Android client. Navigator and the wider Ultrascripts platform pass are in
release polish: documentation, promotional material, targeted bug fixes,
manual compatibility checks, packaging, and publication remain.

Browser and Android development now share one BetterDungeon monorepo. `dev` is
the normal workspace, `stable` is the protected release-ready branch, and the
complete Node, extension-package, and Android quality gate runs on every push.
Successful runs retain a browser ZIP and debug APK for review.

The completed Navigator work remains part of v2.1, and the release should not
be reopened for broad feature changes. Chronos V2 has already shipped
independently and no longer gates BetterDungeon. Stateboy is paused, and
Brainiac remains planned for later.

## v2.1 Release Scope

- Reliable Ultrascripts heartbeat liveness with persistent `beat` advancement
  and explicit `PC`/`Mobile` platform reporting.
- Nine first-party modules: `widget`, `webfetch`, `clock`, `sdk`, `weather`,
  `network`, `system`, `ai`, and `audio`.
- Bounded synthesized Audio effects and credential-free public HTTPS WebFetch.
- One provider-neutral AI executor for Gemini, OpenRouter, and remote Custom
  HTTPS endpoints, with explicit provider selection and no silent failover.
- Navigator multi-turn streaming chat grounded in an always-attempted bounded
  snapshot of Plot Components, recent story, Memory Bank, and Story Cards.
- Six bounded retrieval tools for Story Cards, story history, and Memory Bank.
  Plot Components are supplied directly and have no redundant retrieval tool.
- Three Navigator change modes: **Automatic** by default, **Proposed changes**
  for per-change approval, and **No changes** with mutation tools removed.
- Automatic applies verified non-deletion changes immediately. Permanent Story
  Card and Memory Bank deletions always remain pending for explicit approval.
- Compact change cards, verified writes, dedicated last-request Inspector, and
  per-adventure conversation persistence.
- Navigator integrated into AI Dungeon's Gameplay settings on PC and Mobile,
  with platform-specific navigation and input polish.
- Chromium, Firefox/Gecko, and Android WebView support.
- The undecided Artisan teaser remains hidden from current release surfaces.

## Settled Product Boundaries

- Navigator is player-initiated. It does not run scheduled, event-triggered, or
  unattended automations.
- Context selection controls and the Read Plot Components tool are removed.
  Navigator always attempts every canonical context section within its budget.
- User Edit, assistant Retry, message action rows, and Navigator clipboard
  export are removed. Clear conversation and request cancellation remain.
- Inspector retains only the latest request in memory, is replaced by the next
  request or page reload, and never stores credentials or transport secrets.
- Every write remains conflict-checked, serialized, and verified with a fresh
  server read. Storage uncertainty fails closed as No changes.
- Navigator has no mutation Undo command or durable audit log.
- Provider selection is explicit. BetterDungeon never silently fails over
  between Gemini, OpenRouter, and Custom services.
- Local HTTP model endpoints, arbitrary scenario-supplied JavaScript execution,
  a third-party module marketplace, and a broad TypeScript/bundler migration
  remain outside v2.1.

## Remaining Release Work

- Tighten browser and Android README, release-note, store, and promotional copy.
- Prepare current screenshots and other promotional images outside release
  packages.
- Fix confirmed defects and visual inconsistencies without redesigning settled
  Navigator behavior.
- Complete browser and Android manual checks and produce clean release builds.
- Align BetterRepository entries and public guidance with the final v2.1
  implementation.

## Ongoing Maintenance

- Keep the shared web runtime aligned across browser and Android while
  preserving deliberate platform differences: the browser keeps overflow
  arrows for settings-tab access; Android uses native drag/swipe navigation
  without custom arrows.
- Preserve the public `ai.query` and Ultrascripts Story Card contracts.
- Run the deterministic monorepo quality gate for every change. Use the retained
  live module scripts only for targeted compatibility or release checks.
- Prefer implementation and durable contracts over completed planning notes.
- Treat additional provider services and Navigator capabilities as post-v2.1
  work requiring explicit security and migration review.

## Canonical References

- [Monorepo, build, branch, and CI/CD guide](../BetterDungeon/docs/MONOREPO.md)
- [v2.1 release roadmap](./ultrascripts/planning/current-roadmap.md)
- [Navigator architecture and product contract](./navigator/navigator-design.md)
- [Navigator verified mutation reference](./navigator/navigator-mutation-contract.md)
- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Ultrascripts verification reference](./ultrascripts/reference/verification.md)
