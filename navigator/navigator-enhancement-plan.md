# Navigator Enhancement Plan — Thinking, Context, Settings, Auto Modes

> Additive plan on top of the shipped Navigator contract in
> [`navigator-design.md`](./navigator-design.md). Nothing here changes
> `ai.query`. Planning only: no implementation is authorized by this document.

Four requested capabilities:

1. Configurable model thinking, with a traced thinking stream where a provider
   actually supports one.
2. A Navigator-specific, user-configurable context aggregation budget that can
   exceed today's fixed 46k-character snapshot, including full Story Card
   entries when the budget allows.
3. A real Navigator settings surface.
4. Auto mode (auto-apply safe proposals) and YOLO mode (auto-apply everything,
   including deletions).

## 0. Current Implementation Baseline

Verified against both worktrees. The shared Navigator/AI JavaScript is
byte-identical between PC and Mobile for `services/navigator/context.js`,
`mutations.js`, `tools.js`, `primer.js`, `modules/ai/executor.js`,
`modules/ai/module.js`, and `modules/ai/openai-compatible-backend.js`.
`session.js` differs only by Mobile's `setReadOnlyMode()` synchronization.
`features/navigator_feature.js`, both popups, and `styles.css` diverge for the
Android full-screen sheet. PC has a privileged
`background-ai-openai-compatible.js`; Mobile has no counterpart and routes the
same requests through Kotlin `AiTransportClient` → `BetterDungeonBridge` → the
WebView `fetch`/stream polyfill.

| Thing | Today |
|---|---|
| Thinking levels | `minimal`, `low`, `medium`, `high`; default `minimal` |
| Navigator's level | Hard-coded `{ level: 'low' }` per chat round |
| Provider application | Gemini only. Gemma maps any non-`minimal` to `thinking_level: high`. OpenRouter and Custom receive no reasoning parameter at all |
| Reasoning content | Never parsed. SSE handling reads `delta.content` and tool-call fragments only; other delta keys are merged opaquely and dropped from the delta callback |
| Thinking UI | A generic animated indicator, plus `meta.thinking` stored invisibly on the finished message |
| `ai.query` cap | `PROMPT_MAX_CHARS = 12000`, enforced in the executor and again in the PC background |
| Navigator chat caps | `MAX_INPUT_CHARS 100000`, `MAX_OUTPUT_TOKENS 2048`, `MAX_HISTORY_CHARS 16000`, `MAX_TOOL_ROUNDS 6`, `MAX_TOOL_RESULT_CHARS_PER_TURN 16000` |
| Context budgets | Frozen `BUDGETS`: snapshot 46000, identity 1200, plot 7000, recent actions 20000, action text 3000; Story Cards as an `id \| type \| title` directory only |
| Settings storage | One key: `betterDungeon_navigator_read_only` in `chrome.storage.sync`; transcripts per adventure in `chrome.storage.local` |
| Settings UI | A feature toggle plus a read-only checkbox in the popup. No Navigator settings surface |
| Approval | Every proposal requires a direct Apply/Delete click; deletion is `irreversible: true` with a warning |
| Tests | Mobile has three Navigator contract suites; PC has none |

Two constraints that shape everything below:

- **Every budget is enforced twice on PC** (executor plus background) and the
  Mobile native transport caps a request body at 1,000,000 bytes. A 1M-token
  context is roughly 4 MB of characters, so large contexts are a *native*
  change on Mobile, not only a JavaScript one.
- **Character-based budgets, token-based providers.** All existing accounting
  is in characters. This plan keeps characters as the enforcement unit and
  treats tokens as a displayed estimate (`chars / 4`), rather than introducing
  a tokenizer per provider.

## 1. Provider Capability Reality

Documented behavior, gathered from provider docs rather than assumed:

| Capability | Gemini (OpenAI-compat) | OpenRouter | Custom endpoint |
|---|---|---|---|
| Effort control | `reasoning_effort: minimal\|low\|medium\|high`; `none` only on 2.5 models; cannot be disabled on 2.5 Pro or 3.x | `reasoning: { effort: none\|minimal\|low\|medium\|high\|xhigh\|max }` or `reasoning: { max_tokens }` | Unknown; `reasoning_effort` is the most common spelling |
| Reasoning returned | Thought *summaries*, requested through `extra_body.google.thinking_config.include_thoughts`; `reasoning_effort` and `thinking_config` are mutually exclusive | `message.reasoning` / `delta.reasoning`, plus structured `reasoning_details[]` (`reasoning.text`, summary, and encrypted variants); some upstreams return nothing | Commonly `delta.reasoning_content`; frequently nothing |
| Round-tripping | Gemini 3 thought signatures exist in the chat-completions shape | `reasoning_details` should be echoed back on later turns for correct multi-turn tool use | Unknown |
| Context limit discovery | Native `models` listing exposes `inputTokenLimit`; the OpenAI-compat `models` route does not | `/api/v1/models` exposes `context_length` and `top_provider.max_completion_tokens` | Not discoverable |

Consequences:

- Thinking level is a *request* everywhere and an *effect* only sometimes. The
  UI must report requested versus applied, which `applyThinking()` already
  models (`requestedLevel`, `appliedLevel`, `applied`, `family`, `defaulted`).
- Where exactly Gemini's OpenAI-compatible layer places thought summaries in a
  streamed chunk is **not documented**. Treat it as unknown until Spike A.
- A Custom endpoint may reject unknown parameters outright, so sending
  reasoning parameters to Custom must be opt-in.

## 2. Phase Plan

Ordering is chosen so that each phase is shippable and default-neutral: after
Phase 1 the observable behavior is identical to today, and every later phase is
gated behind a setting.

```text
Spikes A/B/C ──► P1 settings schema + page ──► P2 thinking control
                                   │                  │
                                   ├──► P3 reasoning trace (needs A)
                                   ├──► P4 context profiles (needs B)
                                   └──► P5 Auto/YOLO
P6 parity, tests, docs runs alongside every phase, not after it
```

### Spikes (do first, cheap, no shipped code)

- **Spike A — reasoning capture.** Against a live key per service, stream one
  reasoning-capable request and record the raw SSE frames for: Gemini with
  `include_thoughts`, Gemini with `reasoning_effort`, an OpenRouter model that
  returns `reasoning`, an OpenRouter model that returns encrypted
  `reasoning_details`, and one Custom/OpenAI-compatible endpoint. Deliverable: a
  frozen fixture file per case. Phase 3 is written against fixtures, not
  against hope.
- **Spike B — large payload transport.** Push ~200k, ~800k, and ~3M characters
  through the PC background port and the Mobile native transport. Establish
  where each layer fails (port message size, `evaluateJavascript` chunking,
  Kotlin body cap, provider 400/413) and the wall-clock cost of assembling a
  large snapshot. Deliverable: the maximum defensible ceiling per platform.
- **Spike C — full-card cost.** On a large real adventure, measure snapshot
  characters and latency for directory, hybrid, and full Story Card modes.
  Deliverable: the default profile sizes used in Phase 4.

### Phase 1 — Settings schema and Navigator settings surface

The prerequisite for the other three features: they are all settings.

- One versioned object, `betterDungeon_navigator_settings` (`version: 1`), in
  `chrome.storage.sync`, defaulting to exactly today's behavior.
- Migration reads the legacy `betterDungeon_navigator_read_only` key into
  `readOnly` and keeps writing the legacy key for one release, so a mixed
  PC/Mobile/older-install user is never silently un-protected.
- A single normalizer (`services/navigator/settings.js`) owns defaults,
  clamping, unknown-key rejection, and change notification. Session, mutations,
  context, and both popups read only through it. Unknown or corrupt values fall
  back to defaults rather than throwing.
- Mobile additionally broadcasts `SET_NAVIGATOR_SETTINGS` to the content
  runtime, mirroring the existing `SET_NAVIGATOR_READ_ONLY` path, and reaches
  storage through the WebView polyfill.
- Two surfaces, one schema: a Navigator section in the popup (full settings,
  provider/capability readout, explanations) and a gear in the Navigator header
  opening an in-drawer panel with the mid-adventure subset (thinking, reasoning
  visibility, context profile, approval mode). Configuring Navigator from the
  popup while playing is the wrong ergonomics for the settings that matter per
  turn.
- API credentials stay out of Navigator settings. The panel shows provider
  status and links to Ultrascripts > AI.

Proposed schema:

| Key | Type | Default | Notes |
|---|---|---|---|
| `readOnly` | bool | `false` | Migrated from the legacy key; still the top-priority gate |
| `thinkingLevel` | `off\|minimal\|low\|medium\|high` | `low` | Matches today's hard-coded request |
| `reasoningDisplay` | `off\|collapsed\|expanded` | `collapsed` | Only meaningful where a provider returns reasoning |
| `contextProfile` | `standard\|extended\|max\|custom` | `standard` | `standard` == today's 46k |
| `contextChars` | int | `46000` | Used when `contextProfile: custom`; clamped per platform |
| `storyCardMode` | `directory\|hybrid\|full` | `directory` | Today's behavior is `directory` |
| `maxOutputTokens` | int | `2048` | Bounded by the provider's completion limit when known |
| `approvalMode` | `manual\|auto\|yolo` | `manual` | Section 5 |
| `sendReasoningToCustom` | bool | `false` | Custom endpoints may reject unknown parameters |

### Phase 2 — Configurable thinking

- Add `off` (mapped to provider `none`/omission) to the Navigator-facing level
  set. `ai.query` keeps its current level set and default; scripts never gain
  thinking control, so the frozen contract is untouched.
- Extend `applyThinking()` beyond Gemini:
  - **Gemini** — keep the current mapping; `off` uses `none` where the model
    supports it and otherwise reports `applied: false` with a reason.
  - **OpenRouter** — send `reasoning: { effort }`; `off` sends
    `reasoning: { enabled: false }`. Unsupported effort values are clamped
    rather than passed through.
  - **Custom** — send `reasoning_effort` only when `sendReasoningToCustom` is
    on, and treat a 400 mentioning an unknown parameter as a capability
    discovery: retry once without it and report `applied: false`.
- `applyThinking()` already returns a diagnosis object; propagate
  `requested`/`applied`/`family`/`reason` all the way to
  `meta.thinking` and render it in the settings capability readout and on the
  message ("requested high, provider ignored thinking").
- Both PC layers (`executor.js` and the PC background) validate levels, so any
  new level lands in both, plus the Mobile mirror of `executor.js`.

### Phase 3 — Reasoning trace

Depends on Spike A. If a service returns nothing usable, it reports "no
reasoning trace available" rather than faking one.

- **Delta contract.** Today the background emits `onDelta(text, sequence)` and
  the backend forwards `message.text`. Widen to a typed delta,
  `{ channel: 'text' | 'reasoning', text, sequence }`, keeping `text` populated
  for existing consumers so a stale content script still works against a new
  background. Version the port handshake.
- **Parsing**, in the shared SSE reader: `delta.reasoning` (string),
  `delta.reasoning_content` (string), `delta.reasoning_details[]` (emit
  text/summary entries, never render encrypted or signature payloads), and
  whatever Spike A shows for Gemini thought summaries. Unknown shapes stay
  opaque and are ignored for display.
- **Continuation correctness.** Structured reasoning that a provider expects
  echoed back (`reasoning_details`, thought signatures) must ride in the
  existing opaque continuation state so multi-round tool loops stay valid. It
  must *not* enter the visible transcript payload.
- **Persistence.** Reasoning is live-only: rendered while streaming, retained
  in memory for the current session, and excluded from the persisted transcript
  along with the existing rule that raw tool results are not persisted. This
  keeps the 120,000-character transcript bound meaningful and avoids storing
  model chain-of-thought on the player's machine.
- **UI.** Replace the generic indicator with a collapsible "Thinking" block
  above the answer: live reasoning text when available, otherwise the applied
  level and elapsed time, plus `reasoning_tokens` from usage metadata when the
  provider reports it. Collapsed by default. Reasoning text is rendered through
  the existing bounded text path, never as Markdown-with-links, and is bounded
  per turn (proposed 20k characters, then truncated with a notice).

### Phase 4 — Configurable context aggregation

- `ai.query` stays at 12k. This phase only touches the first-party chat budget,
  which is already independent.
- Replace frozen `BUDGETS` with a profile derived from `contextChars`:
  identity and plot components keep fixed floors, Recent Story scales with a
  cap, and Story Cards receive the remainder. `standard` must reproduce today's
  numbers exactly so the existing context contract tests still pass.
- **Story Card modes.** `directory` is today's `id | type | title` listing.
  `hybrid` injects full entries for the highest-value cards (proposed ordering:
  recently updated, then trigger-matched against recent actions, then
  alphabetical) and directory rows for the rest. `full` injects every card's
  complete entry, and degrades to `hybrid` — with an explicit coverage note in
  the snapshot — when the budget cannot hold them. The per-turn card index and
  the two read tools stay exactly as they are: they remain how the model
  inspects anything the snapshot omitted.
- **Ceilings.** `contextChars` is clamped to a platform maximum from Spike B,
  and separately to the model's discovered limit when known (OpenRouter
  `context_length`, Gemini `inputTokenLimit`), leaving headroom for output and
  tool rounds. The UI shows the effective value and why it was reduced. Raising
  the Mobile native 1,000,000-byte body cap (or chunking the write) is part of
  this phase, not an afterthought.
- **Failure handling.** A provider context/size rejection maps to a normalized
  `context_too_large` error whose message names the profile and suggests a
  smaller one. No silent truncation, no provider failover.
- **Honesty about cost.** Tokens are money and latency. The settings panel
  shows estimated tokens per turn for the chosen profile, and the snapshot
  meta already reports coverage and truncation — extend it with the profile
  name and card mode so the header subtitle stays accurate.
- `MAX_HISTORY_CHARS` and `MAX_OUTPUT_TOKENS` scale with the profile;
  `MAX_TOOL_ROUNDS` and per-turn tool-result caps stay as they are, because
  those bound provider round-trips rather than context.

### Phase 5 — Auto mode and YOLO mode

The mode is a **user policy gate around the existing verified apply path**. It
never becomes a model-callable capability, and the model is never told it can
self-apply: proposals are still proposals, and `apply()` still runs
preconditions, the live-adventure identity check, the serialized GraphQL write,
and the server read-back.

Risk classification, derived from the proposal itself rather than its name:

| Class | Proposals | Auto | YOLO |
|---|---|---|---|
| Reversible | `story_card_create`, `third_person_change` | apply | apply |
| Overwrite | `story_card_update`, plot component change with non-empty new value | apply | apply |
| Destructive | `story_card_delete` (`irreversible: true`), any change clearing a non-empty plot component to empty | hold for review | apply |

Rules:

- `readOnly` outranks every mode. Under read-only, proposal tools are not even
  offered.
- Auto-apply is limited to proposals produced by the current turn for the
  current live adventure. Proposals restored from a persisted transcript, or
  belonging to a different adventure, always require a click.
- Per-turn ceilings (proposed: 8 auto-applies, and at most 1 destructive apply
  in YOLO). The first failure, precondition mismatch, or conflict stops
  auto-applying for the remainder of the turn and drops those proposals into
  normal pending state marked "needs review".
- Applies stay serialized in the existing queue; concurrency is not introduced.
- Every auto-applied proposal keeps its card, marked `Auto-applied`, and the
  turn ends with a summary of what was written. Silent mutation is the failure
  mode to avoid — the point of these modes is fewer clicks, not less
  information.
- YOLO requires an explicit one-time acknowledgement that names the
  consequence (no Undo, no audit log, deletion unrecoverable), shows a
  persistent badge in the Navigator header while active, and offers a
  session-only variant that resets when the adventure is left.

**This reverses a settled product boundary.** `BetterDungeon.md` and
`navigator-design.md` both state that every Navigator mutation requires a
direct approval action, and that Automations are cancelled. Auto/YOLO does not
resurrect scheduled or unattended execution — a turn still starts with the
player sending a message — but it does remove the per-change approval. That
line must be rewritten deliberately in both documents as part of this phase,
and it strengthens the case for the deferred Undo/audit-log work: auto-applied
writes are exactly the case where "verified from the server" is the only record
a player gets.

### Phase 6 — Parity, tests, documentation

- **Parity rule:** shared JavaScript changes land in both repositories in the
  same change, since those files are byte-identical today. Divergence belongs
  only in `navigator_feature.js`, popups, `styles.css`, and the native
  transport.
- **PC has no Navigator contract tests.** Port Mobile's three suites to PC
  first, so both platforms have a baseline before behavior changes.
- New suites: settings normalization and legacy-key migration; thinking mapping
  per service including the ignored/rejected paths; profile derivation
  (`standard` reproduces the current numbers byte-for-byte) and card-mode
  degradation; reasoning-delta parsing against the Spike A fixtures, including
  encrypted-payload suppression and non-persistence; risk classification and
  auto-apply gating (read-only precedence, stale proposal refusal, per-turn
  caps, stop-on-failure).
- Both repositories run standalone Node test scripts with no npm scripts, CI
  workflows, or lint/typecheck commands. New tests follow the existing
  self-contained `tests/*.test.js` pattern.
- Documentation to update on completion: `navigator-design.md` (thinking,
  reasoning, budgets, modes), `BetterDungeon.md` (approval boundary, V2.1
  scope), and `v2.1-design-notes.md` (Navigator modes now include Auto/YOLO).

## 3. Risks

| Risk | Handling |
|---|---|
| Reasoning content is unavailable or shaped differently per provider | Spike A first; ship level-only reporting where no trace exists |
| Chain-of-thought stored or leaked into the transcript | Live-only reasoning, excluded from persistence, encrypted payloads never rendered |
| Large contexts break the Mobile native transport | Spike B sets the ceiling; raising the body cap is in scope for Phase 4 |
| Large contexts cost real money silently | Estimated tokens per turn in the settings panel; profile named in the snapshot meta |
| Auto/YOLO destroys player data | Destructive class held in Auto; per-turn destructive cap, acknowledgement, badge, stop-on-failure, and no bypass of preconditions or read-back |
| Two enforcement layers drift | Any budget or level change lands in both `executor.js` and the PC background, plus the Mobile mirror |
| Settings migration leaves read-only unset | Legacy key still written for one release; defaults reproduce current behavior |

## 4. Acceptance Criteria

1. With default settings, Navigator behaves exactly as it does today: `low`
   thinking, 46k snapshot, Story Card directory, manual approval.
2. Thinking level is user-selectable and the UI states whether the provider
   applied it.
3. Where a provider returns reasoning, it streams into a collapsible block and
   is not persisted; where it does not, Navigator says so.
4. A raised context profile demonstrably injects full Story Card entries on a
   large adventure, on PC and Mobile, and a too-large request produces a
   named, actionable error rather than a truncation surprise.
5. Auto mode applies non-destructive proposals without a click and still holds
   deletions; YOLO applies deletions only after acknowledgement, subject to
   per-turn caps and stop-on-failure.
6. Read-only mode overrides every mode on both platforms.
7. `ai.query` is byte-for-byte unchanged in contract and limits.
8. Both repositories have Navigator contract suites covering the above.
