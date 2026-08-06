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

Status: **Complete — implemented and live-tested on PC and Mobile**

Goal: make availability claims reflect the client currently playing the adventure.

- Keep heartbeat as the capability-discovery snapshot and turn it into an
  actual liveness signal with a persistent monotonic `beat`.
- Advance `beat` on every successful heartbeat write, including after every
  observed adventure action even when live count does not change.
- Teach helpers to compare the beat once from the Input hook. A changed beat is
  live; an unchanged beat is stale and triggers ordinary fallback behavior.
- Preserve the intentional one-turn detection delay instead of intercepting
  action submission or adding a separate ping/ack protocol.
- Report client platform as `PC` or `Mobile`, with a separate implementation or
  version field if finer diagnostics are needed.
- Attempt best-effort invalidation on clean disable/leave, but do not depend on
  cleanup for correctness.

Exit gate: switching from a BetterDungeon client to a vanilla client stops a
script from treating Ultrascripts as live after one unchanged observation,
including Retry, abrupt close, and offline cases.

## Phase 2 — Audio Module

Status: **Complete — implemented consistently on PC and Mobile**

Goal: provide a small, state-driven sound module without forcing scripts to ship
or execute audio code.

- Use `ultrascripts:state:audio` as the module's primary interface. Scripts
  describe the audio they want; BetterDungeon observes the latest state and
  reconciles playback.
- Begin with a declarative Web Audio synthesizer. Scripts describe bounded
  waveforms, notes or frequencies, timing, envelopes, and volume in state.
- Give one-shot sounds a changing event id or revision so the same sound can be
  intentionally triggered again without replaying during state hydration.
- Keep the first contract intentionally small: synth sound, stop, and volume.
- Require a user gesture before first playback and respect browser autoplay,
  mute, visibility, and mobile lifecycle behavior.
- Define the simplest predictable rule for replacement, repeated effects, and
  malformed state.
- Add a user-facing master mute/stop, conservative playback bounds, and cleanup
  on adventure exit or module disable.

Implemented foundation:

- `ultrascripts:state:audio` schema version 1 with one-shot `effect` state.
- Bounded sine, square, triangle, sawtooth, and generated-noise effects with
  frequency sweeps and attack/release envelopes.
- Per-adventure effect-id replay prevention across repeated state hydration.
- Web Audio gesture unlocking, suspended-context handling, module/adventure
  cleanup, popup enablement, local unit coverage, a live AI Dungeon suite, and
  an author-facing guide.
- Bundled background tracks were deliberately removed. Their size, limited
  catalog, copyright/provenance burden, and overlap with dedicated music
  services did not justify their value.

Final release verification:

- Live-test autoplay recovery, all waveform types, pitch sweeps, envelopes,
  replay prevention, stop behavior, and lifecycle cleanup on the device matrix.
- Keep the PC and Mobile copies behaviorally identical when Audio changes.

Exit gate: synthesized effects play and stop predictably across navigation,
backgrounding, client disable, repeated state hydration, and PC/mobile runtimes.

## Phase 3 — WebFetch Revision

Goal: make safe public reads convenient while preserving meaningful boundaries.

Status: **Complete and accepted on PC and Mobile**

- WebFetch 1.0 exposes only `fetch`; the DuckDuckGo `search` wrapper is removed.
- The module toggle is the sole player control. Per-origin prompts, saved origin
  decisions, consent UI, and SDK consent summaries are removed.
- Requests are HTTPS-only `GET`/`HEAD` reads with no body. Sensitive and
  browser-controlled headers are stripped, and custom headers are bounded.
- The privileged PC background transport and native Android transport both
  revalidate initial URLs and every manual redirect, cap redirects at five,
  omit ambient credentials, and drop custom headers across origins.
- Responses are text-like only and keep consistent timeout, response-size,
  header-filtering, truncation, rate-limit, response, and error shapes.
- Local names plus literal non-public IPv4/IPv6 targets are blocked. Full DNS
  rebinding prevention is deliberately not claimed.

Exit gate: ordinary public API reads require no origin prompt, while SSRF,
credential forwarding, redirect bypass, data leakage, and abuse limits remain tested.

## Phase 4 — AI Backend Modernization

Goal: keep the public `ai.status`/`ai.query` contract stable while making provider
behavior current, visible, and replaceable.

- **Completed foundation:** the PC and Mobile executors now register multiple
  providers, resolve a provider per consumer, snapshot routing for each request,
  and expose provider-neutral status/results. Ultrascripts and Character Presets
  use the shared executor without registering or refreshing Gemini directly.
- Add Gemini and OpenRouter as user-selectable providers with separately stored
  keys, provider-specific settings, clear readiness/status information, and the
  ability to switch at any time. A request uses the provider selected when it is
  dispatched; switching affects subsequent requests.
- Keep provider and model selection out of the script-facing request contract.
  Scripts ask for supported capabilities such as text, structured JSON, and
  thinking; the selected provider adapter performs the translation.
- Verify Gemini's documented `OFF` defaults for the adjustable harm categories
  and return prompt/candidate block reasons through stable Ultrascripts errors.
- Treat `SAFETY` as an adjustable-filter result and `PROHIBITED_CONTENT` as a
  separate provider policy/core-protection result that safety thresholds cannot
  be expected to override.
- Run an explicit-content compatibility matrix for AI queries and Character
  Presets using adult fictional input/output and structured-output cases.
- Migrate Gemini execution from legacy `generateContent` to the Interactions API.
- Preserve stateless request behavior initially; adopt server-side interaction
  state only with explicit lifecycle/privacy rules.
- Update auto stepdown to `gemini-3.5-flash-lite`,
  `gemini-3.1-flash-lite`, `gemma-4-31b-it`, `gemma-4-26b-a4b-it`.
- Revalidate thinking and structured-output payload differences per model.
- Add the OpenRouter backend with its own key, privacy disclosure, model and
  capability metadata, moderation/error mapping, and cost-conscious defaults.
  It is a committed alternative for explicit adult-fiction scenarios that
  Gemini does not reliably support.
- Do not silently fail over between providers. Preserve user control over which
  service receives scenario content and make the active provider visible.

Exit gate: blocks are never silent, model fallback is observable, contracts stay
stable, Gemini and OpenRouter can be selected at any time, and all first-party AI
features work without provider-specific coupling.

## Phase 5 — JS Module

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
- Gemini and OpenRouter are committed scope; provider selection is explicit and
  no cross-provider fallback occurs without a future product decision.
- Showcase scripts may inform tests, but cannot block phase progression.

## Practical Next Action

Add persistent provider selection and its settings UI, then implement the
OpenRouter adapter against the completed provider-neutral executor boundary.
Leave JS until the other Ultrascripts module revisions are complete.
