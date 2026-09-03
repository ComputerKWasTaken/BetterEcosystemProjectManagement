# BetterDungeon v2.1 Release Plan

## Status

BetterDungeon v2.1 is functionally complete on the browser extension and
Android client. The completed Navigator simplification and Inspector redesign
are part of this release.

Feature scope is closed. Remaining work is release polish, documentation and
promotional alignment, confirmed bug fixes, compatibility checks, packaging,
and publication. Chronos V2 has already shipped independently and does not gate
this release.

## Completed Scope

- Nine Ultrascripts modules: `widget`, `webfetch`, `clock`, `sdk`, `weather`,
  `network`, `system`, `ai`, and `audio`.
- Persistent heartbeat liveness with explicit `PC` and `Mobile` reporting.
- One OpenAI-compatible backend for Gemini, OpenRouter, and remote Custom HTTPS
  services, with explicit provider selection and no silent failover.
- Navigator streaming chat, always-attempted bounded adventure grounding,
  Story Card, story-history, and Memory Bank retrieval, per-adventure
  conversation persistence, and latest-request inspection.
- Navigator's three change modes: Automatic, Proposed changes, and No changes.
  Automatic is the recommended default; permanent Story Card and Memory Bank
  deletions always require explicit approval.
- Compact change cards, conflict-safe serialized writes, server read-back, and
  fail-closed storage checks.
- Dedicated Inspector views and Gameplay-settings integration on PC and Mobile.
- Removed Context selectors, Read Plot Components, message action rows, user
  Edit, assistant Retry, and Navigator clipboard export.
- Deliberate platform polish: PC retains settings-tab overflow arrows; Mobile
  uses native swipe navigation, IBM Plex, IME-safe sizing, and touch targets.
- The Artisan teaser is hidden while its future remains undecided.

Durable behavior belongs in the
[Navigator contract](../../navigator/navigator-design.md),
[verified mutation reference](../../navigator/navigator-mutation-contract.md),
and Ultrascripts [`reference/`](../reference/) documents.

## Remaining Release Work

### Documentation and promotion

- Finish PC and Mobile README cleanup and keep release claims synchronized.
- Align popup/tutorial copy, BetterRepository entries, and public author guides
  with the final implementation.
- Prepare final release notes, store descriptions, screenshots, and promotional
  images outside the browser-extension and APK payloads.
- Remove superseded planning documents once their durable decisions are
  represented in canonical references.

### Polish and bug fixes

- Review user-facing labels, empty states, errors, diagnostics, focus behavior,
  narrow layouts, reduced motion, and noisy logs.
- Fix confirmed defects without reopening settled feature design.
- Keep shared browser and Mobile runtime behavior aligned while preserving
  intentional platform differences.

### Verification and packaging

- Run all durable Node contract suites for both repositories.
- Run Android unit checks and `assembleDebug`, then produce the release build.
- Manually check Navigator chat, all three change modes, approval-gated
  deletions, retrieval, Inspector, cancellation, navigation, and hydration on
  representative browser and Android environments.
- Live-check the nine Ultrascripts modules, emphasizing permission,
  unavailable, and recovery paths.
- Validate Chromium, Firefox/Gecko, and Android packages contain only intended
  release files and are accepted by their targets.
- Confirm v2.1 version metadata before publication.

## Release Gate

v2.1 is ready when:

- no release-blocking regression remains on PC or Mobile;
- all applicable automated suites and manual checks pass;
- final documentation, store copy, and promotional material match the shipped
  behavior;
- release packages contain no development or marketing artifacts; and
- clean browser and Android artifacts are ready to publish.

## After v2.1

Stateboy remains parked in [its direction document](./stateboy.md). Brainiac,
Artisan (pending a ship/no-ship decision), additional Navigator capabilities,
local HTTP models, arbitrary scenario-supplied JavaScript, and broad
architecture migrations remain outside this release.
