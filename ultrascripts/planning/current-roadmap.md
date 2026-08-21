# BetterDungeon V2.1 Release Plan

## Status

BetterDungeon V2.1 is functionally complete on the browser extension and
Android client. It is the active BetterEcosystem priority while final polish,
cleanup, release verification, and publication preparation are completed.

V2.1 will publish alongside the completed Chronos V2 script.

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

### Cleanup and polish

- Remove obsolete planning, test, and packaging artifacts.
- Review user-facing labels, empty states, errors, diagnostics, and noisy logs.
- Remove dead code and stale comments without expanding V2.1's scope.
- Keep shared browser and Mobile behavior aligned for every touched runtime
  file.

### Verification

- Run the durable Node contract suites for AI compatibility, Apollo reads and
  caching, consumers, and verified write hydration.
- Live-check Navigator chat, retrieval, proposal approval, Read-only mode,
  request inspection, cancellation, and adventure navigation.
- Live-check the nine Ultrascripts modules on representative browser and
  Mobile environments, focusing on permission, unavailable, and recovery
  paths.
- Confirm Chromium, Firefox/Gecko, and Android packaging contains only intended
  release files and that each manifest/build is accepted by its target.

### Documentation and publication

- Keep BetterDungeon, BetterRepository, and private reference claims aligned
  with the final implementation.
- Finalize release notes and store copy outside the extension package.
- Confirm version metadata and produce clean browser and Android artifacts.
- Publish BetterDungeon V2.1 and Chronos V2 together.

## Release Gate

V2.1 is ready when:

- no release-blocking regression remains on browser or Mobile;
- all applicable durable suites pass;
- the manual Navigator and module checks pass;
- release packages contain no development or marketing artifacts that block
  publication; and
- final public documentation matches the shipped behavior.

## After V2.1

Stateboy remains parked in [its direction document](./stateboy.md). Brainiac,
new Navigator capabilities, local HTTP models, arbitrary scenario-supplied
JavaScript, and broad architecture migrations are outside this release.
