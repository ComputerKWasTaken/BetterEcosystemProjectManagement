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

The Ultrascripts improvement pass is complete. Navigator is now the active V2.1
development track, and its architecture and product contract are locked in the
[Navigator design doc](./navigator/navigator-design.md).

Navigator Automations are **out of V2.1**. Deterministic triggers, run history,
budgets, and unattended mutation policy are a larger problem than the release
can absorb, and they depend on mutation safety that will only just have been
established. They remain the intended direction for a later release.

## V2 Baseline

- Ultrascripts transport, write queue, heartbeat discovery, and two-way envelopes.
- State-card dispatch, module registry, lifecycle handling, and popup settings.
- Nine modules: `widget`, `webfetch`, `clock`, `sdk`, `weather`, `network`,
  `system`, `ai`, and `audio`.
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

Status: **Complete — Audio, WebFetch, and AI modernization verified on PC and Mobile**

- Add `audio` as a stateful module for bounded, one-shot synthesized effects.
- Keep WebFetch 1.0 focused on bounded, credential-free public HTTPS reads:
  `GET`/`HEAD` only, text-like responses only, validated redirects, strict
  request/response limits, blocked local/literal non-public targets, and no
  per-origin prompt or search wrapper.
- **Completed foundation:** the PC and Mobile AI executors now provide a
  provider-neutral registry/router, and Scripts plus Character Presets use
  consumer-specific routing without depending directly on Gemini.
- **Completed implementation:** Gemini now uses stateless Interactions API
  requests on PC and Mobile, distinguishes adjustable `SAFETY` blocks from
  non-adjustable `PROHIBITED_CONTENT`, and uses this automatic model chain:
  `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemma-4-31b-it` →
  `gemma-4-26b-a4b-it`.
- **Completed UX:** Character Prefill presents concise, actionable messages for
  policy blocks, safety blocks, setup failures, rate limits, and timeouts without
  exposing raw provider diagnostics.
- Keep Gemini as the only configured provider for V2.1 to preserve the lowest-
  friction setup. The provider-neutral executor remains in place so OpenRouter,
  local models, or another backend can be evaluated later without recoupling
  Scripts, Character Presets, or Navigator to Gemini.

### Stage 3 — First-Party AI Chat Surface

Status: **Active — the prerequisite for everything Navigator does**

- Keep the script-facing `ai.query` contract frozen: single-shot prompt, 12k
  character cap, non-streaming. Third-party scripts must not need migration.
- Add an additive first-party chat surface with multi-turn `messages`, a system
  instruction, streaming, and its own budget, consumed only by BetterDungeon.
- Route both surfaces through the existing provider registry and Gemini adapter
  so Navigator registers as an ordinary consumer.
- Stream over a long-lived background port with abort propagation, replacing the
  single blocking request for first-party chat only.

### Stage 4 — Navigator Shell and Grounded Chat

- Add an adventure-page overlay drawer that never reflows the AI Dungeon layout,
  collapsing to a full-screen sheet when there is no room for a side panel.
- Ship a session that owns the transcript, streaming, abort, and per-adventure
  persistence, with the drawer talking only to the session.
- Ground Navigator in a hand-written platform primer of roughly 1k tokens. No
  documentation corpus is injected into prompts.
- Assemble bounded adventure context from current Plot Components, Story Cards,
  and recent actions, with explicit budget accounting.
- Ship read-only. Navigator answers questions, diagnoses problems, brainstorms,
  and drafts replacement text the player applies themselves.

### Stage 5 — Navigator Tools and Mutations

- Add typed read tools first so Navigator can inspect cards and components on
  demand instead of relying on pre-selected context.
- Add mutation tools over the GraphQL write paths, never DOM automation.
- Preview a structured change set before application by default.
- Use stable IDs plus read-version preconditions to prevent stale overwrites.
- Store an audit log and reversible before/after data for every applied change.
- Keep mutation access behind a permission that is off by default, and keep
  read-only chat fully useful when it is disabled.

### Stage 6 — V2.1 Release Closeout

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
- Navigator grounding is paraphrased and budgeted, never a documentation dump.
  Context cost is a product constraint, not an afterthought.
- Navigator states what it cannot see rather than reasoning confidently over
  context it was never given.
- First-party AI needs are met by adding internal surfaces, never by loosening
  the script-facing contract.
- Ultrascripts capability claims must describe the active client, not merely a
  card written by a previous client.
- New high-power modules get explicit quotas and narrow contracts rather than
  becoming general escape hatches.

## V2.1 Release Gates

- Scripts stop treating an unchanged durable heartbeat as live and recover
  automatically when the beat advances again.
- Heartbeat reports `PC` or `Mobile` correctly.
- Audio has a documented contract, lifecycle cleanup, quotas, and tests.
- WebFetch is useful without weakening blocked-target and data-exfiltration rules.
- AI errors—including content blocks—are visible and branchable, never silently dropped.
- The frozen `ai.query` contract behaves identically before and after the
  first-party chat surface is added.
- Navigator streaming can be aborted mid-response without leaving a broken
  transcript or a leaked background port.
- Navigator opening, resizing, and closing never disturbs the AI Dungeon layout
  or blocks ordinary play.
- Navigator edits cannot silently overwrite data that changed after it was read.
- Every applied Navigator mutation can be reviewed and reversed.
- Navigator is useful with mutation access disabled.

## Out of the V2.1 Critical Path

- Navigator Automations: deterministic triggers, run history, cooldowns, request
  budgets, dry-run/approval modes, and the global kill switch.
- Navigator on mobile. The APK lives in a separate repository and Navigator
  ships PC-first; the port is a distinct later pass.
- Stateboy publication and its remaining feature work.
- Brainiac implementation and publication.
- Chronos V2 implementation and publication.
- Third-party module marketplace work.
- Broad TypeScript/NPM/bundler migration.
- OpenRouter, local-model, and multi-provider settings UX. This remains the
  intended next provider step after the Navigator foundation lands, and matters
  because Gemini is documented as unreliable for explicit content, but it is not
  a V2.1 gate.
- BetterVoyage implementation.

## Canonical References

- [Navigator architecture and product contract](./navigator/navigator-design.md)
- [Ultrascripts internal docs](./ultrascripts/README.md)
- [V2.1 roadmap](./ultrascripts/planning/current-roadmap.md)
- [V2.1 investigation and design notes](./ultrascripts/planning/v2.1-design-notes.md)
- [Documentation sync plan](./ultrascripts/planning/docs-sync.md)
- [Module quality plan](./ultrascripts/planning/module-quality-pass.md)
