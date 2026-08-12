# Navigator Enhancement MVP — Reasoning, Context Budget, Settings

> Prototype MVP design, additive to the shipped contract in
> [`navigator-design.md`](./navigator-design.md). `ai.query` is untouched, and
> the per-change approval boundary is unchanged. Planning only: no
> implementation is authorized by this document.

Three capabilities in the MVP:

1. **Reasoning** — the player chooses how hard Navigator thinks, and the UI
   makes an actively-reasoning Navigator obviously distinguishable from a
   broken or hung one.
2. **Context aggregation budget** — a Navigator-specific, user-selectable
   budget that can exceed today's fixed 46k-character snapshot, including full
   Story Card entries when the budget allows.
3. **Settings surface** — a real Navigator settings panel, because the first
   two are settings.

Explicitly **out of the MVP**: reasoning traces (no provider-thought text is
displayed), Auto mode, YOLO mode, Undo, a mutation audit log, per-provider
tokenizers, and provider failover. Every mutation still requires a direct
player action.

## 0. Baseline

Verified against both worktrees. The shared Navigator/AI JavaScript is
byte-identical across PC and Mobile for `services/navigator/context.js`,
`mutations.js`, `tools.js`, `primer.js`, `modules/ai/executor.js`,
`modules/ai/module.js`, and `modules/ai/openai-compatible-backend.js`;
`session.js` differs only by Mobile's `setReadOnlyMode()`. PC has a privileged
`background-ai-openai-compatible.js`; Mobile has no counterpart and routes the
same requests through Kotlin `AiTransportClient` → `BetterDungeonBridge` → the
WebView `fetch`/stream polyfill.

| Thing | Today |
|---|---|
| Thinking levels | `minimal`, `low`, `medium`, `high`; default `minimal` |
| Navigator's level | Hard-coded `{ level: 'low' }` per chat round |
| Provider application | Gemini only. Gemma maps any non-`minimal` request to `thinking_level: high`. OpenRouter and Custom receive no reasoning parameter at all |
| Thinking UI | One generic animated indicator; `meta.thinking` is stored on the finished message and never shown |
| `ai.query` cap | `PROMPT_MAX_CHARS = 12000`, enforced in the executor and again in the PC background |
| Navigator chat caps | `MAX_INPUT_CHARS 100000`, `MAX_OUTPUT_TOKENS 2048`, `MAX_HISTORY_CHARS 16000`, `MAX_TOOL_ROUNDS 6`, `MAX_TOOL_RESULT_CHARS_PER_TURN 16000` |
| Context budgets | Frozen `BUDGETS`: snapshot 46000, identity 1200, plot 7000, recent actions 20000, action text 3000; Story Cards as an `id \| type \| title` directory |
| Settings storage | One key, `betterDungeon_navigator_read_only`, in `chrome.storage.sync`; transcripts per adventure in `chrome.storage.local` |
| Settings UI | A feature toggle and a read-only checkbox in the popup |
| Tests | Mobile has three Navigator contract suites; PC has none |

## 1. Provider Reality

Documented behavior, from provider docs rather than assumption:

| | Gemini (OpenAI-compat) | OpenRouter | Custom |
|---|---|---|---|
| Effort control | `reasoning_effort: minimal\|low\|medium\|high`; `none` only on 2.5 models — 2.5 Pro and 3.x cannot disable thinking | `reasoning: { effort }` (`none`…`max`) or `reasoning: { max_tokens }`; `reasoning: { exclude: true }` suppresses returned thoughts | Unknown; `reasoning_effort` is the common spelling and unknown parameters may 400 |
| Context limit discovery | Native `models` listing exposes `inputTokenLimit`; the OpenAI-compat `models` route does not | `/api/v1/models` exposes `context_length` and `top_provider.max_completion_tokens` | Not discoverable |

Two consequences the MVP is built around:

- **A level is a request, not a guarantee.** `applyThinking()` already returns
  `requestedLevel` / `appliedLevel` / `applied` / `family` / `defaulted`. The
  MVP's job is to extend it past Gemini and then actually surface it.
- **Reasoning tokens are billed as output tokens and count against
  `max_tokens`.** With today's fixed `MAX_OUTPUT_TOKENS = 2048`, a `high`
  request can spend the entire completion budget thinking and return empty
  text with `finish_reason: "length"`. Scaling output budget with the level is
  therefore part of the reasoning feature, not a follow-up.

## 2. Settings (the foundation)

One versioned object, `betterDungeon_navigator_settings` (`version: 1`), in
`chrome.storage.sync`, whose defaults reproduce today's behavior exactly.

| Key | Type | Default | Notes |
|---|---|---|---|
| `readOnly` | bool | `false` | Migrated from the legacy key; still the top-priority gate |
| `thinkingLevel` | `off\|minimal\|low\|medium\|high` | `low` | Matches today's hard-coded request |
| `contextProfile` | `standard\|extended\|max\|custom` | `standard` | `standard` == today's 46k |
| `contextChars` | int | `46000` | Used when `contextProfile: 'custom'`; clamped to the platform ceiling |
| `storyCardMode` | `directory\|hybrid\|full` | `directory` | Today's behavior is `directory` |
| `sendReasoningToCustom` | bool | `false` | Custom endpoints may reject unknown parameters |

- A new `services/navigator/settings.js` owns defaults, clamping, unknown-key
  rejection, and change notification. Session, context, mutations, and both
  popups read only through it; corrupt or unknown values fall back to defaults
  instead of throwing.
- **Migration:** read the legacy `betterDungeon_navigator_read_only` key into
  `readOnly`, and keep writing the legacy key for one release so a mixed
  PC/Mobile/older-install user is never silently un-protected.
- **Mobile:** broadcast `SET_NAVIGATOR_SETTINGS` to the content runtime,
  mirroring the existing `SET_NAVIGATOR_READ_ONLY` path, and reach storage
  through the WebView polyfill.
- **Two surfaces, one schema.** The popup gets the full Navigator section
  (every setting, the provider/capability readout, explanations, and a link to
  Ultrascripts > AI). A gear in the Navigator header opens an in-drawer panel
  with the per-turn subset: thinking level, context profile, Story Card mode.
  Opening the extension popup mid-adventure to change effort is the wrong
  ergonomics for exactly the settings a player changes most.
- API credentials stay out of Navigator settings; the panel only reports
  provider status.

## 3. Reasoning

### Request path

Navigator sends the configured level instead of a literal:

```js
// services/navigator/session.js
thinking: { level: settings.thinkingLevel },
budget: {
  maxInputChars: profile.maxInputChars,
  maxOutputTokens: outputTokensFor(settings.thinkingLevel, profile),
},
```

`off` is a **chat-only** level. The script-facing validation list stays exactly
as it is so the frozen `ai.query` contract does not gain a value:

```js
const THINKING_LEVELS      = ['minimal', 'low', 'medium', 'high'];        // ai.query, unchanged
const CHAT_THINKING_LEVELS = ['off', ...THINKING_LEVELS];                 // first-party chat only
```

`applyThinking()` in the PC background grows from Gemini-only to per-service,
with one shared capability-probe helper:

- **Gemini** — unchanged mapping for `minimal`…`high`, including the existing
  Gemma toggle. `off` sends `reasoning_effort: 'none'`; if the model rejects it
  (2.5 Pro and 3.x cannot disable thinking), retry once without the parameter
  and report `applied: false, reason: 'not_supported'`.
- **OpenRouter** — `reasoning: { effort, exclude: true }`; `off` sends
  `reasoning: { enabled: false }`. `exclude: true` because the MVP displays no
  thoughts, so there is no reason to stream or store them. Effort values
  outside our set are clamped, never passed through.
- **Custom** — send `reasoning_effort` only when `sendReasoningToCustom` is on;
  a 400 naming an unknown parameter is treated as capability discovery: retry
  once without it and report `applied: false`.

Capability results are cached per `service:model` in background memory only —
no persisted capability store in the MVP.

### Output-budget scaling

```js
function outputTokensFor(level, profile) {
  const base = { off: 2048, minimal: 2048, low: 3072, medium: 6144, high: 12288 }[level];
  return Math.min(base, profile.maxOutputTokensCeiling);   // clamped by discovered model limit when known
}
```

An empty response with `finish_reason: 'length'` maps to a normalized,
actionable error — "Navigator used its whole output budget reasoning; lower the
thinking level" — rather than today's silent empty message.

### Making reasoning visible without a trace

No provider thought text is parsed or rendered. The requirement is only that a
thinking model looks like it is *thinking*, so the streaming lifecycle becomes
three explicit states instead of one spinner:

| State | Condition | Shown |
|---|---|---|
| Connecting | request sent, no frame yet | "Connecting…" |
| Reasoning | frames arriving, no text delta yet | "Reasoning (high) · 0:14", live elapsed timer, Stop emphasized |
| Writing | first text delta received | today's streaming render |

- A watchdog escalates the copy while still in Reasoning past a level-dependent
  threshold (proposed 30s at `low`, 90s at `high`): "Still reasoning — high
  effort can take a while." No new timeout is introduced; the provider and
  transport timeouts remain authoritative.
- The finished message carries a one-line footer built from existing metadata:
  "Reasoned at high · 1,432 reasoning tokens · 18s", falling back to level and
  duration when the provider reports no
  `completion_tokens_details.reasoning_tokens`.
- When the provider ignored or rejected the level, the footer says so
  ("requested high; this provider does not expose thinking control"), which is
  the whole point of propagating `applied` / `reason` into `meta.thinking`.

## 4. Context Aggregation

`ai.query` stays at 12k; this section touches only the already-independent
first-party chat budget.

- **Profiles.** `standard` 46,000 chars (today, ~12k tokens), `extended`
  200,000 (~50k), `max` 800,000 (~200k), plus `custom`. Characters remain the
  enforcement unit everywhere; tokens are a displayed estimate at `chars / 4`.
  No tokenizer is introduced.
- **Derived budgets.** `context.js` `BUDGETS` becomes a function of the
  profile: identity and Plot Components keep fixed floors, Recent Story scales
  to a cap, Story Cards take the remainder. `standard` must reproduce today's
  numbers exactly, so the existing context expectations still hold.
- **Story Card modes.** `directory` is today's `id | type | title` listing.
  `hybrid` injects full entries for the highest-value cards — proposed
  ordering: recently updated, then trigger-matched against recent actions, then
  alphabetical — and directory rows for the rest. `full` injects every entry
  and degrades to `hybrid` with an explicit coverage note when the budget
  cannot hold them. The per-turn card index and the two read tools are
  unchanged: they remain how the model inspects whatever the snapshot omitted.
- **Ceilings.** `contextChars` is clamped to a platform ceiling established by
  the transport spike, and warns (does not silently clamp) against a discovered
  model limit — OpenRouter `context_length`, Gemini `inputTokenLimit`. The panel
  shows the effective value and why it was reduced.
- **Mobile transport.** The native `AiTransportClient` body cap is 1,000,000
  bytes today, and ~1M tokens is roughly 4 MB of characters, so the cap is
  raised (proposed 8 MB) with a chunked body write. This is Kotlin work inside
  the MVP, not a follow-up.
- **Failures.** A provider context or size rejection maps to a normalized
  `context_too_large` error naming the current profile and suggesting a smaller
  one. No silent truncation, no failover.
- **Cost honesty.** The panel shows estimated tokens per turn for the selected
  profile, and the snapshot meta gains the profile name and card mode so the
  Navigator header subtitle stays accurate.
- `MAX_HISTORY_CHARS` scales with the profile. `MAX_TOOL_ROUNDS` and the
  per-turn tool-result cap do not: they bound provider round-trips, not context.

## 5. Build Order

```text
Spikes ──► S1 settings module + panels ──┬──► S2 reasoning (level, scaling, states)
                                         └──► S3 context profiles + card modes + native cap
                                                       S4 tests + docs
```

**Spikes, before any shipped code.**

- **Transport size** — push ~200k, ~800k, and ~3M characters through the PC
  background port and the Mobile native transport; record where each layer
  fails (port message size, `evaluateJavascript` chunking, Kotlin body cap,
  provider 400/413) and the cost of assembling a large snapshot. Sets the
  platform ceiling and validates the 8 MB target.
- **Thinking capability** — one live request per service at `off`, `low`, and
  `high`; confirm which parameters are accepted, whether Gemini `none` is
  rejected as documented, and that OpenRouter `exclude: true` does not break a
  multi-round tool loop.
- **Output interaction** — reproduce the empty-text `finish_reason: length`
  case at `high` with 2048 output tokens, then confirm the scaled budget fixes
  it.
- **Full-card cost** — on a large real adventure, measure snapshot characters
  and latency for `directory`, `hybrid`, and `full`, which fixes the profile
  sizes above.

**S1 — settings.** Schema, normalizer, migration, Mobile broadcast, popup
section, and in-drawer gear. Behavior after S1 is byte-identical to today; only
the plumbing exists.

**S2 — reasoning.** Level from settings, `CHAT_THINKING_LEVELS`, per-service
`applyThinking()`, output-budget scaling, the length-exhaustion error, and the
three-state streaming UI with the footer.

**S3 — context.** Profile-derived budgets, Story Card modes, ceilings and
warnings, the `context_too_large` error, the native body cap, and the snapshot
meta additions.

**S4 — parity, tests, docs.** Shared JavaScript changes land in both
repositories in the same change, since those files are byte-identical today;
divergence belongs only in `navigator_feature.js`, the popups, `styles.css`,
and the native transport. PC has **no** Navigator contract tests, so Mobile's
three suites are ported to PC first, before behavior changes. New suites:
settings normalization and legacy-key migration; per-service thinking mapping
including the ignored and rejected paths; output-token scaling and the
exhaustion error; profile derivation (`standard` reproduces current numbers)
and card-mode degradation; streaming-state transitions including the watchdog.
Both repositories run standalone Node `tests/*.test.js` scripts — no npm
scripts, CI workflows, or lint/typecheck commands exist — so new tests follow
that self-contained pattern. On completion, update `navigator-design.md`
(thinking, budgets, settings) and `BetterDungeon.md`.

## 6. Risks

| Risk | Handling |
|---|---|
| A `high` request returns empty text | Output budget scales with level; exhaustion becomes a named, actionable error |
| A long reasoning pause reads as a hang | Explicit Reasoning state with a live timer, escalating copy, and an emphasized Stop |
| Custom endpoints 400 on reasoning parameters | Opt-in only, single capability-probe retry, `applied: false` reported |
| `exclude: true` breaks multi-round tool loops on some upstreams | Covered by the thinking-capability spike before S2 ships |
| Large contexts break the Mobile native transport | Transport spike sets the ceiling; raising the body cap is in S3 |
| Large contexts cost real money quietly | Estimated tokens per turn in the panel; profile named in the snapshot meta |
| Two enforcement layers drift | Every budget or level change lands in both `executor.js` and the PC background, plus the Mobile mirror |
| Migration leaves read-only unset | Legacy key still written for one release; defaults reproduce current behavior |

## 7. Acceptance Criteria

1. With default settings, Navigator behaves exactly as today: `low` thinking,
   46k snapshot, Story Card directory, manual approval.
2. Thinking level is user-selectable and takes effect on Gemini, OpenRouter,
   and (opt-in) Custom; when a provider ignores or rejects it, Navigator says
   so instead of pretending.
3. A `high` reasoning turn shows an unmistakable Reasoning state with elapsed
   time and never returns a silent empty message.
4. A raised profile demonstrably injects full Story Card entries on a large
   adventure, on PC and Mobile, and an over-limit request produces a named
   error rather than a truncation surprise.
5. Read-only mode still overrides everything, and every mutation still requires
   a direct player action.
6. `ai.query` is unchanged in contract and limits, including its thinking-level
   set.
7. Both repositories have Navigator contract suites covering the above.
