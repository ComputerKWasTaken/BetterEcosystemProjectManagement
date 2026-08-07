# BetterDungeon V2.1 Roadmap

## Status Snapshot

BetterDungeon V2 is complete. The V2.1 Ultrascripts improvement pass is
complete, and Navigator is now the active development track.

Navigator's architecture and product contract are locked in the
[Navigator design doc](../../navigator/navigator-design.md). Navigator ships in
three phases: the first-party AI chat surface it depends on, the shell with
grounded read-only chat, then tools and mutations.

The first-party chat surface and grounded Navigator shell are complete and
live-tested. Phase 7 tools and mutations are the next development stage.

Navigator Automations are **removed from V2.1**. They are deferred, not
cancelled.

The old Stateboy → Brainiac → Chronos V2 release sequence is retired. Those
scripts are independent consumers, not gates for BetterDungeon work.

## Phase 0 — Baseline and Contract Freeze

Status: **Complete — baseline contracts recorded and regression coverage established**

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

Status: **Complete — implemented and live-verified on PC and Mobile**

Goal: keep the public `ai.status`/`ai.query` contract stable while making provider
behavior current, visible, and replaceable.

- **Completed foundation:** the PC and Mobile executors now register multiple
  providers, resolve a provider per consumer, snapshot routing for each request,
  and expose provider-neutral status/results. Ultrascripts and Character Presets
  use the shared executor without registering or refreshing Gemini directly.
- Keep Gemini as the only configured V2.1 provider. Preserve the internal
  provider registry and per-consumer routing boundary so another backend can be
  added later without changing first-party features or the script contract.
- Keep provider and model selection out of the script-facing request contract.
  Scripts ask for supported capabilities such as text, structured JSON, and
  thinking; the selected provider adapter performs the translation.
- Rely on Gemini 3's documented default-off adjustable filters because custom
  safety settings are not currently supported by the Interactions API. Return
  generation block reasons through stable Ultrascripts errors.
- Treat `SAFETY` as an adjustable-filter result and `PROHIBITED_CONTENT` as a
  separate provider policy/core-protection result that safety thresholds cannot
  be expected to override.
- **Verified limitation:** live testing confirmed that Gemini cannot be relied
  on for explicit NSFW scenarios. BetterDungeon surfaces the resulting content
  block clearly and accepts the limitation while Gemini remains the sole V2.1
  provider.
- **Implemented:** migrate Gemini execution from legacy `generateContent` to
  stateless Interactions requests with `store: false`, `steps` response parsing,
  Interactions usage metadata, and `response_format` JSON schemas.
- **Implemented:** update auto stepdown to `gemini-3.5-flash-lite`,
  `gemini-3.1-flash-lite`, `gemma-4-31b-it`, `gemma-4-26b-a4b-it`.
- **Implemented:** translate public thinking levels into model-family-specific
  Interactions payloads and keep structured output behind the shared JSON
  contract. The local suite covers payloads, parsing, metadata, blocks, and
  rate-limit stepdown, and the live contract suite has passed on the completed
  PC and Mobile implementation.
- Defer OpenRouter, local models, multi-provider credential UX, and provider
  switching to a future release. Never add silent cross-provider failover.

Exit gate: blocks are never silent, model fallback is observable, contracts stay
stable, the Gemini Interactions path passes a live smoke test, and all first-party
AI features continue to work through the provider-neutral executor.

## Phase 5 — First-Party AI Chat Surface

Status: **Complete — implemented and live-verified without changing `ai.query`**

Goal: give first-party features multi-turn streaming AI without touching the
script-facing contract.

Navigator needs conversation state, a system instruction, a context budget far
above 12k characters, and streaming. `ai.query` provides none of those, and
cannot be changed: third-party Ultrascripts depend on its single-shot 12k
non-streaming shape and V2.1 protects it. The answer is an additive internal
surface, not a contract revision.

- Keep `ai.query` byte-for-byte behaviorally identical. No migration note, no
  contract version bump, no change to `PROMPT_MAX_CHARS` for scripts.
- Add a first-party chat surface accepting `messages`, a system instruction, and
  a per-consumer budget, exposed only to BetterDungeon features.
- Reuse the existing provider registry, per-consumer routing, and Gemini
  adapter. Navigator registers as `consumer: 'navigator'` so an alternate
  provider is later additive.
- Stream Gemini Interactions responses from the background worker to the content
  script over a long-lived port, replacing the single blocking request for
  first-party chat only.
- Propagate abort from the caller through the port to an `AbortController`, and
  guarantee port teardown on adventure change, drawer close, and page unload.
- Keep provider blocks, rate limits, and stepdown observable through the same
  stable error shapes already used by `ai.query`.
- Never add silent cross-provider failover.

Implemented foundation:

- `UltrascriptsAIExecutor.chat()` is an internal-only, provider-neutral surface
  with multi-turn messages, a system instruction, independent per-consumer
  budgets, optional thinking, streaming deltas, and structured terminal results.
- Gemini chat uses a versioned long-lived runtime port. The background owns the
  API key and request `AbortController`; both sides tear down on completion,
  error, abort, disconnect, page exit, startup timeout, and invalidated extension
  context.
- Provider blocks, missing credentials, rate limits, and observable model
  stepdown retain the stable AI error vocabulary. There is no cross-provider
  failover.
- The frozen script path and Character Presets continue to use `ai.query()` with
  its existing 12k single-shot contract.

Exit gate: multi-turn streaming chat works end to end with clean abort and no
leaked ports, and the existing `ai.query` regression suite passes unchanged.

## Phase 6 — Navigator Shell and Grounded Chat

Status: **Complete — grounded read-only shell implemented and live-tested**

Goal: a trustworthy, useful, read-only adventure copilot.

- Overlay drawer pinned to the right gutter of the adventure page. The play page
  is Tamagui with an absolutely-positioned layer stack and a fixed 1067px content
  container, so a layout-reflowing sidebar is not safely achievable. Reuse the
  available-space measurement already proven by the story card dock, and collapse
  to a full-screen sheet when there is no gutter.
- No backdrop. The story stays readable and interactive while Navigator is open.
- `NavigatorSession` owns the transcript, send, abort, and per-adventure
  persistence. The drawer talks only to the session.
- Ground with a hand-written platform primer of roughly 1k tokens covering the
  adventure model, the purpose of each Plot Component, how Story Card triggers
  work, and the rot/modification failure modes Navigator exists to catch. The
  internal documentation corpus is the source for that primer, never a payload.
- Assemble adventure context from data already in memory: `Ultrascripts.ws`
  cards and actions, the normalized story card cache, and one new adventure
  query for `memory`, `authorsNote`, legacy `instructions`, and
  `state.instructions` plus `state.storySummary`.
- Account for every context segment against an explicit budget.
- With no tool loop available, pre-select story cards by relevance with per-card
  truncation, and always report how many cards were omitted so Navigator can say
  what it cannot see.
- Render assistant output with Navigator's bounded DOM-only Markdown renderer.
  It supports headings, emphasis, lists and nested lists, blockquotes, safe
  links, inline and fenced code, rules, and tables. Model output is never
  assigned via `innerHTML`, and scoped layout resets prevent AI Dungeon's global
  element styles from flattening lists or code blocks.
- Read-only. Navigator explains, diagnoses, brainstorms, and drafts text the
  player applies themselves.

Implemented foundation:

- Right-gutter overlay drawer with draggable persisted width, full-screen narrow
  fallback, launcher, transcript, composer, stop control, and per-adventure
  persisted sessions.
- Versioned platform primer plus an explicitly budgeted snapshot covering
  identity, all Plot Components, relevance-ranked Story Cards, recent actions,
  omission counts, and truncation metadata.
- Plot reads prefer the UI-backed `Adventure.state.instructions` value and fall
  back to legacy flat `Adventure.instructions`, normalizing the returned JSON or
  string shape into text.
- Context refreshes before each user turn, and partial-source failures remain
  visible in snapshot metadata and the drawer subtitle.

Exit gate: Navigator holds a grounded multi-turn conversation about a real
adventure, respects its context budget, is honest about omitted context, and
opening or closing it never disturbs play.

## Phase 7 — Navigator Tools and Mutations

Status: **Next — design and implementation not started**

Goal: let Navigator act, without ever being able to quietly damage an adventure.

- Add typed read tools first — list, inspect, and search Story Cards, read Plot
  Components, read recent story. These remove the context pre-selection problem
  from Phase 6 and validate the tool loop on operations that cannot cause harm.
- Add mutation tools over the confirmed GraphQL write paths:
  `updateAdventurePlot` for Plot Essentials, Author's Note, and third person;
  `updateAdventureState` for AI Instructions and Story Summary; and
  `createStoryCard`/`updateStoryCard`/`deleteStoryCard` for cards. Never DOM
  automation — the current Plot Presets DOM path is too fragile for agent edits.
- Resolve before writing: whether `updateAdventureState` merges or replaces a
  partial `state`, and the exact write payload required for the UI-backed
  `AdventureState.instructions` value. The read path is resolved: state wins,
  with the flat `Adventure.instructions` string retained only as fallback.
- Preview a structured change set before application by default.
- Use stable IDs plus read-version preconditions to prevent stale overwrites.
- Store an audit log and reversible before/after data for every applied change.
- Keep mutation access behind an off-by-default permission, and keep read-only
  chat fully useful when it is off.

Exit gate: Navigator performs representative maintenance tasks, explains its
intended changes before applying them, detects conflicts, and reverses its own
mutations.

## Phase 8 — Documentation and V2.1 Release

Status: **Planned**

- Update nine-module reference and public guide coverage.
- Update Enhanced/Required helpers for liveness semantics.
- Document WebFetch migration and AI provider/safety behavior.
- Document that `ai.query` is unchanged and that first-party chat is internal.
- Add Navigator onboarding, permission, privacy, audit, and recovery docs.
- Verify Chromium and Firefox/Gecko parity for Navigator; Ultrascripts parity
  still includes Android WebView.
- Publish V2.1 independently of Stateboy, Brainiac, and Chronos V2.

## Sequencing Rules

- Heartbeat correctness precedes reliance on new modules.
- The first-party chat surface precedes any Navigator UI, because multi-turn and
  streaming are not expressible through `ai.query`.
- Read-only grounded chat precedes tools; read tools precede mutation tools.
- Mutation safety — preview, preconditions, audit, undo — precedes any future
  unattended execution.
- Gemini is the sole V2.1 provider. Multi-provider support requires a future
  product decision and must never introduce silent cross-provider fallback.
- Showcase scripts may inform tests, but cannot block phase progression.

## Deferred Beyond V2.1

- **Navigator Automations.** Deterministic triggers, monotonic last-run markers,
  dry-run and approval modes, cooldowns, request budgets, failure backoff, run
  history, and a global kill switch. Removed from V2.1 as too large to absorb on
  top of newly established mutation safety.
- **Navigator on mobile.** Separate repository; PC-first, ported later.
- **OpenRouter and multi-provider UX.** The intended next provider step after
  the Navigator foundation. Relevant because Gemini is documented as unreliable
  for explicit content, which affects Navigator more than any other feature
  since Navigator reads live adventure text as input.

## Practical Next Action

Begin Phase 7 with read tools and the tool loop. Define typed list, inspect, and
search operations behind `NavigatorSession`, validate multi-step streaming tool
turns without mutations, and preserve the completed read-only chat path as the
safe fallback.
