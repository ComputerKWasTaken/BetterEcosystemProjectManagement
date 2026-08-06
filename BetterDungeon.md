# BetterDungeon Project Management

> Active planning for BetterDungeon V2.1 following the completed V2 release.

## Current Status

BetterDungeon V2 is released, polished, and complete. V2 remains the stable
baseline while development moves to V2.1.

V2.1 has two release-critical tracks, in order:

1. harden and complete Ultrascripts as a platform; and
2. build Navigator as the release's headline player-facing feature.

Stateboy, Brainiac, and Chronos V2 are no longer BetterDungeon release gates.
They remain useful Ultrascripts consumers and may be developed independently,
but V2.1 must not wait for their publication.

## V2 Baseline

- Ultrascripts transport, write queue, heartbeat discovery, and two-way envelopes.
- State-card dispatch, module registry, lifecycle handling, and popup settings.
- Eight modules: `widget`, `webfetch`, `clock`, `sdk`, `weather`, `network`,
  `system`, and `ai`.
- Per-module AI Dungeon regression suites.
- Enhanced and Required starter templates.
- Chromium, Firefox/Gecko, and Android WebView support.
- Widget V2 polish and PC/mobile Ultrascripts resynchronization.

## V2.1 Roadmap

### Stage 1 — Ultrascripts Reliability

Status: **Complete and verified on PC and Mobile**

- Advance a persistent heartbeat `beat` after every observed adventure action
  and whenever the advertised runtime/module state is refreshed.
- Teach scripts to compare consecutive beats once per logical turn and treat an
  unchanged beat as a stale BetterDungeon client.
- Advertise `PC` for the browser extension and `Mobile` for the APK runtime.
- Accept the deliberate one-turn detection window so async module calls can
  fall back cleanly without invasive action interception.

### Stage 2 — Module Expansion and Revision

Status: **Active — Audio and WebFetch complete on PC and Mobile; AI revision is next**

- Add `audio` as a stateful module for bounded, one-shot synthesized effects.
- Add `js` as an isolated, quota-bound compute module.
- Keep WebFetch 1.0 focused on bounded, credential-free public HTTPS reads:
  `GET`/`HEAD` only, text-like responses only, validated redirects, strict
  request/response limits, blocked local/literal non-public targets, and no
  per-origin prompt or search wrapper.
- Distinguish adjustable Gemini `SAFETY` blocks from non-adjustable
  `PROHIBITED_CONTENT`, migrate the backend to the Interactions API, and update
  the automatic model chain to:
  `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemma-4-31b-it` →
  `gemma-4-26b-a4b-it`.
- Add OpenRouter only if an explicit-content compatibility spike shows Gemini
  remains unsuitable after supported safety controls are configured.

### Stage 3 — Navigator Foundation

- Add an adventure-page sidebar chat grounded in AI Dungeon behavior, current
  Plot Components, Story Cards, and a bounded slice of adventure context.
- Let Navigator propose, preview, apply, and undo changes through explicit tools.
- Support brainstorming and story questions without requiring a mutation.
- Establish audit history, stale-data checks, conflict handling, and recovery
  before introducing unattended changes.

### Stage 4 — Navigator Automations

- Add deterministic triggers such as every N turns and action-type triggers.
- Run the same validated tools used by interactive Navigator.
- Give every automation enable/disable controls, run history, cooldowns, failure
  handling, and a dry-run/manual-approval mode.
- Begin with conservative, bounded mutation policies; expand autonomy only after
  interactive editing is dependable.

### Stage 5 — V2.1 Release Closeout

- Complete desktop/mobile parity and regression coverage.
- Align private references, public guides, templates, settings, and release copy.
- Run migration, upgrade, permission, failure, and rollback checks.
- Publish V2.1 without coupling release readiness to showcase-script status.

## Product Principles

- Navigator serves players maintaining live adventures first; scenario creation
  assistance is useful but secondary.
- Every agent mutation is inspectable, attributable, and recoverable.
- Suggestions and read-only chat should remain available when mutation access is
  disabled.
- Automation triggers are deterministic even when the resulting AI work is not.
- Ultrascripts capability claims must describe the active client, not merely a
  card written by a previous client.
- New high-power modules get explicit quotas and narrow contracts rather than
  becoming general escape hatches.

## V2.1 Release Gates

- Scripts stop treating an unchanged durable heartbeat as live and recover
  automatically when the beat advances again.
- Heartbeat reports `PC` or `Mobile` correctly.
- Audio and JS have documented contracts, lifecycle cleanup, quotas, and tests.
- WebFetch is useful without weakening blocked-target and data-exfiltration rules.
- AI errors—including content blocks—are visible and branchable, never silently dropped.
- Navigator edits cannot silently overwrite data that changed after it was read.
- Every applied Navigator mutation can be reviewed and reversed.
- Automations can be paused globally and cannot create unbounded request loops.

## Out of the V2.1 Critical Path

- Stateboy publication and its remaining feature work.
- Brainiac implementation and publication.
- Chronos V2 implementation and publication.
- Third-party module marketplace work.
- Broad TypeScript/NPM/bundler migration.
- BetterVoyage implementation.

## Canonical References

- [Ultrascripts internal docs](./ultrascripts/README.md)
- [V2.1 roadmap](./ultrascripts/planning/current-roadmap.md)
- [V2.1 investigation and design notes](./ultrascripts/planning/v2.1-design-notes.md)
- [Documentation sync plan](./ultrascripts/planning/docs-sync.md)
- [Module quality plan](./ultrascripts/planning/module-quality-pass.md)
