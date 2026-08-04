# BetterDungeon V2.1 Roadmap

## Status Snapshot

BetterDungeon V2 is complete. V2.1 is now active and begins with an
Ultrascripts improvement pass before Navigator development.

The old Stateboy → Brainiac → Chronos V2 release sequence is retired. Those
scripts are independent consumers, not gates for BetterDungeon work.

## Phase 0 — Baseline and Contract Freeze

Status: **Active**

- Record the V2 heartbeat, module, permission, and AI behavior in regression tests.
- Define migration expectations for existing Enhanced and Required scripts.
- Decide versioning for heartbeat and module contract changes.
- Preserve compatibility where practical; make changed semantics explicit.

Exit gate: V2 behavior is reproducible and every V2.1 contract change has an
owner, migration note, and test surface.

## Phase 1 — Heartbeat Reliability

Goal: make availability claims reflect the client currently playing the adventure.

- Keep heartbeat as the capability-discovery snapshot.
- Add a short-lived liveness lease and a script-generated nonce challenge that
  BetterDungeon acknowledges through the existing two-way transport.
- Bind acknowledgement to adventure, client session, protocol version, and a
  current turn/action marker where available.
- Teach helpers to expose `available`, `uncertain`, and `unavailable`; a stale
  persisted heartbeat must never remain indefinitely `available`.
- Report client platform as `PC` or `Mobile`, with a separate implementation or
  version field if finer diagnostics are needed.
- Attempt best-effort invalidation on clean disable/leave, but do not depend on
  cleanup for correctness.

Exit gate: switching from a BetterDungeon client to a vanilla client stops a
Required script from treating Ultrascripts as live after the bounded handshake
window, including abrupt close and offline cases.

## Phase 2 — Audio Module

Goal: provide stateful sound without forcing scripts to ship or execute audio code.

- Ambient state: track id, play/pause/stop, volume, fade, and loop behavior.
- Synth effects: a declarative, bounded note/envelope/waveform sequence rather
  than arbitrary audio graphs.
- Ship a curated CC0 loop catalog with attribution/provenance metadata.
- Require a user gesture before first playback and respect browser autoplay,
  mute, visibility, and mobile lifecycle behavior.
- Define ownership and arbitration when multiple scripts request audio.
- Add global/module volume, panic stop, concurrency caps, and cleanup on adventure exit.

Exit gate: audio resumes/stops predictably across navigation, backgrounding,
client disable, conflicting scripts, and PC/mobile runtimes.

## Phase 3 — JS Module

Goal: offer heavier computation through a narrow, isolated execution service.

- Run code in a dedicated Worker or stronger isolated realm; never the page,
  extension, or privileged background global.
- Expose JSON-serializable input/output only and no DOM, extension APIs, network,
  storage, dynamic imports, or ambient credentials.
- Enforce wall-clock, memory, source-size, output-size, and concurrency quotas;
  terminate the worker on timeout.
- Version the execution environment and supported language features.
- Treat this as compute offload, not a promise of unlimited execution.

Exit gate: escape attempts, infinite loops, memory pressure, oversized output,
concurrency, cancellation, and mobile teardown are covered by tests and cannot
affect privileged BetterDungeon state.

## Phase 4 — WebFetch Revision

Goal: make safe public reads convenient while preserving meaningful boundaries.

- Remove mandatory per-origin prompts for the default safe-read profile.
- Keep `GET`/`HEAD`, header, redirect, body-size, content-type, timeout, and
  response-size limits.
- Keep DNS/IP revalidation and block loopback, link-local, private-network,
  credential-bearing URLs, extension URLs, and other sensitive targets.
- Do not allow arbitrary cookies, authorization headers, or adventure/user data
  in the default profile.
- Consider optional global modes: Disabled, Safe Reads, and Advanced. Advanced
  may retain explicit consent for broader methods or sensitive headers.
- Replace origin allowlisting UI with clear global controls, request logs, and
  actionable errors.

Exit gate: ordinary public API reads require no origin prompt, while SSRF,
credential forwarding, redirect bypass, data leakage, and abuse limits remain tested.

## Phase 5 — AI Backend Modernization

Goal: keep the public `ai.status`/`ai.query` contract stable while making provider
behavior current, visible, and replaceable.

- Add explicit Gemini safety settings for supported adjustable categories and
  return provider block reasons through stable Ultrascripts errors.
- Run an explicit-content compatibility matrix for AI queries and Character
  Presets using adult fictional input/output and structured-output cases.
- Migrate Gemini execution from legacy `generateContent` to the Interactions API.
- Preserve stateless request behavior initially; adopt server-side interaction
  state only with explicit lifecycle/privacy rules.
- Update auto stepdown to `gemini-3.5-flash-lite`,
  `gemini-3.1-flash-lite`, `gemma-4-31b-it`, `gemma-4-26b-a4b-it`.
- Revalidate thinking and structured-output payload differences per model.
- Introduce an internal provider adapter so Character Presets and Ultrascripts AI
  do not hardcode Gemini transport details.
- Gate OpenRouter implementation on the compatibility spike. If needed, add it
  as a user-selected provider with its own key, privacy disclosure, model
  compatibility metadata, moderation errors, and cost controls.

Exit gate: blocks are never silent, model fallback is observable, contracts stay
stable, and the OpenRouter decision is evidence-based.

## Phase 6 — Navigator Interactive MVP

Goal: ship a trustworthy adventure copilot before unattended automation.

- Sidebar chat attached to the adventure page.
- Grounding adapter for AI Dungeon platform concepts, current Plot Components,
  Story Cards, relevant story context, and current adventure identity.
- Read tools for listing, inspecting, searching, and diagnosing content.
- Mutation tools for creating/updating/deleting Plot Components and Story Cards.
- Preview a structured change set before application by default.
- Use stable IDs plus read-version/hash preconditions to prevent stale overwrites.
- Store an audit log and reversible before/after data for every applied change.
- Support a read-only brainstorm/question mode when mutation access is disabled.

Exit gate: Navigator can safely perform representative maintenance tasks,
explain its intended changes, detect conflicts, and undo its own mutations.

## Phase 7 — Navigator Automations

Goal: provide bounded, observable upkeep without disrupting play.

- Initial triggers: every N completed turns and selected action types.
- Separate trigger evaluation from agent execution and persist a monotonic
  last-run marker to prevent duplicate firing.
- Reuse Navigator's validated tools, conflict checks, audit log, and undo path.
- Add dry-run, require-approval, and auto-apply modes per automation.
- Add cooldowns, maximum runs, request budgets, failure backoff, and a global kill switch.
- Show queued/running/completed/failed state without blocking ordinary play.
- Defer semantic/event triggers until deterministic triggers are proven.

Exit gate: reloads, multi-device play, rapid actions, offline periods, delayed AI
responses, and failures do not duplicate or loop automations.

## Phase 8 — Documentation and V2.1 Release

- Update ten-module reference and public guide coverage.
- Update Enhanced/Required helpers for liveness semantics.
- Document WebFetch migration and AI provider/safety behavior.
- Add Navigator onboarding, permission, privacy, automation, audit, and recovery docs.
- Verify Chromium, Firefox/Gecko, and Android WebView parity.
- Publish V2.1 independently of Stateboy, Brainiac, and Chronos V2.

## Sequencing Rules

- Heartbeat correctness precedes reliance on new modules.
- JS threat modeling precedes implementation.
- Interactive Navigator mutation safety precedes auto-apply automations.
- OpenRouter is conditional, not assumed scope.
- Showcase scripts may inform tests, but cannot block phase progression.

## Practical Next Action

Build a heartbeat failure matrix and prototype the nonce acknowledgement using
the existing request/response envelope. In parallel planning, specify the Audio
state schema and complete the JS threat model; do not begin Navigator mutations
until the platform reliability gates are settled.
