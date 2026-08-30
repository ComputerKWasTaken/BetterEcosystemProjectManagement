# BetterDungeon V3.0 Release Plan

## Status

The release formerly planned as V2.1 has been promoted to **V3.0** and is not
yet released. The former V2.1 scope is functionally complete on the browser
extension and Android client, and the release is reopened for the additional
Navigator work below. V3.0 is the active BetterEcosystem priority.

Chronos V2 has already been released independently as a standalone script; it
no longer gates this release.

## Completed Scope

- Nine Ultrascripts modules: `widget`, `webfetch`, `clock`, `sdk`, `weather`,
  `network`, `system`, `ai`, and `audio`.
- Persistent heartbeat liveness with explicit `PC` and `Mobile` reporting.
- One OpenAI-compatible backend for Gemini, OpenRouter, and remote Custom HTTPS
  services, with explicit provider selection and no silent failover.
- Navigator streaming chat, bounded adventure grounding, Story Card, Memory
  Bank, and story-history retrieval, request inspection, and per-adventure
  settings.
- Navigator proposal-only writes with direct approval, conflict checks,
  serialized mutations, server read-back, and synchronized Read-only mode.
- Desktop and touch-first Android Navigator interfaces.
- Chronos V2 implementation, documentation, and verification.

Durable product and implementation details live in the
[Navigator contract](../../navigator/navigator-design.md),
[verified mutation reference](../../navigator/navigator-mutation-contract.md),
and Ultrascripts [`reference/`](../reference/) documents.

## Remaining Release Work

### New V3.0 scope

- **Navigator Auto mode (default).** Navigator applies its changes
  automatically without per-change approval, while keeping the player informed
  through concise applied-change cards in the transcript. Preconditions,
  serialized writes, and server read-back are unchanged. A Review mode keeps
  the explicit approval flow, and Read-only mode still removes mutations
  entirely. Plan:
  [navigator-auto-mode-plan.md](../../navigator/navigator-auto-mode-plan.md).
- **Concise change-card redesign.** Replace the current large proposal cards
  with compact cards visually aligned with the tool usage indicators, on both
  PC and Mobile.
- **Hide the Artisan teaser.** Remove the Artisan teaser card and mentions from
  the PC and Mobile popups (and the README teaser line) while Artisan's fate is
  undecided. Hidden, not deleted: keep the work easy to restore.

### Cleanup and polish

- Remove obsolete planning, test, and packaging artifacts.
- Review user-facing labels, empty states, errors, diagnostics, and noisy logs.
- Remove dead code and stale comments without expanding V3.0's scope.
- Keep shared browser and Mobile behavior aligned for every touched runtime
  file.

### Verification

- Run the durable Node contract suites for AI compatibility, Apollo reads and
  caching, consumers, and verified write hydration.
- Live-check Navigator chat, retrieval, Auto mode application, Review mode
  approval, Read-only mode, request inspection, cancellation, and adventure
  navigation.
- Live-check the nine Ultrascripts modules on representative browser and
  Mobile environments, focusing on permission, unavailable, and recovery
  paths.
- Confirm Chromium, Firefox/Gecko, and Android packaging contains only intended
  release files and that each manifest/build is accepted by its target.

### Documentation and publication

- Keep BetterDungeon, BetterRepository, and private reference claims aligned
  with the final implementation.
- Finalize release notes and store copy outside the extension package.
- Confirm V3.0 version metadata and produce clean browser and Android
  artifacts.
- Publish BetterDungeon V3.0.

## Release Gate

V3.0 is ready when:

- no release-blocking regression remains on browser or Mobile;
- all applicable durable suites pass;
- Auto mode is the shipped default with the revised change cards on both
  platforms;
- the Artisan teaser is hidden on both platforms;
- the manual Navigator and module checks pass;
- release packages contain no development or marketing artifacts that block
  publication; and
- final public documentation matches the shipped behavior.

## After V3.0

Stateboy remains parked in [its direction document](./stateboy.md). Brainiac,
Artisan (pending a ship/no-ship decision), further Navigator capabilities,
local HTTP models, arbitrary scenario-supplied JavaScript, and broad
architecture migrations are outside this release.
