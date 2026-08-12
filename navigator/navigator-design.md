# Navigator — Architecture and Product Contract

> V2.1 headline feature. This document locks the decisions needed to build
> Navigator's shell and live chat, and records what is deliberately deferred.

Implementation status: the first-party streaming chat surface, grounded
Navigator, compact Story Card tools, confirmed mutation proposals, provider
setup, and Android port are complete. Mobile uses a native transport and
touch-first full-screen overlay. The shipped mutation contract is recorded in
[`navigator-mutation-tools-plan.md`](./navigator-mutation-tools-plan.md).

## 1. Product Definition

Navigator is an adventure copilot: a chat surface attached to the AI Dungeon
adventure page that is grounded in how AI Dungeon actually works and in the
player's current adventure.

It exists to solve two problems that no existing AI Dungeon tool addresses:

- **Rot** — plot components and story cards drift out of alignment with the
  story as it progresses, because the story changes and they do not.
- **Modification** — adapting someone else's scenario to your own taste is
  common, tedious, and immersion-breaking.

Every existing AI agent tool in the AI Dungeon space (Multiple Choice
Assistant, Flyer's tooling, and the equivalents in other platforms such as
Voyage Studio and Puppeteer) targets **scenario authors**. Navigator targets
**players in live adventures**. That is the untapped position.

### Non-goals

- Navigator is not a scenario builder. Scenario-creation assistance may fall
  out of it, but is never a design driver.
- Navigator does not write or play the story. It maintains the machinery
  around the story.
- Navigator is not a general chatbot bolted onto the page. Grounding in the
  live adventure is the entire value proposition.

## 2. Locked Decisions

| Decision | Choice |
|---|---|
| PC surface | Right-pinned overlay drawer; full-screen sheet when narrow |
| Mobile surface | Full-screen touch overlay using the visual viewport and Android lifecycle coordination |
| First build | Shell + live grounded chat, read-only, streaming |
| Tool loop | Two bounded read tools plus five proposal-only mutation tools |
| Mutations | Model proposes; an explicit user action applies; optional Read-only mode removes proposals |
| Grounding | Hand-written paraphrase, ~1k tokens. No documentation injection |
| Provider | Gemini plus a configurable OpenAI-compatible endpoint through the shared first-party chat surface |
| Provider UX | Complete: explicit Gemini or OpenAI-compatible selection; OpenRouter and Custom are the compatible service choices |
| Streaming | In scope for the first pass |
| Mobile | Complete in the separate Android repository with a touch-first full-screen UI |
| Automations | Cancelled; Navigator remains player-initiated |

## 3. Why the AI Layer Must Change First

Navigator cannot be built on the existing script-facing AI contract.

`UltrascriptsAIExecutor.query()` accepts a single `prompt` string, caps it at
`PROMPT_MAX_CHARS = 12000`, returns one non-streaming text or JSON result, and
holds no conversation state. Those constraints are correct for `ai.query` —
third-party Ultrascripts depend on that contract and V2.1 has migration rules
protecting it.

Navigator is first-party and does not need to go through `ai.query` at all.

### The split

- **`ai.query`** — frozen. Single-shot, 12k cap, non-streaming. Scripts keep
  working. No migration note, no contract version bump.
- **First-party chat surface** — additive. Multi-turn `messages[]`, a system
  instruction, streaming, and its own larger budget. Consumed only by
  BetterDungeon features.

Both route through the **same provider registry**. Gemini and the implemented
OpenAI-compatible adapter translate the shared provider-neutral contract.
`registerProvider` / `resolveProvider` / `setProviderForConsumer` already exist
in `modules/ai/executor.js`, so Navigator registers as `consumer: 'navigator'`
and provider selection requires zero Navigator caller changes.

This is why the backend upgrade is a prerequisite rather than a follow-up:
multi-turn conversation and streaming are both required by the first pass, and
neither is expressible through `ai.query`.

### Streaming transport

The implemented chat path uses a versioned long-lived runtime port. On PC, the
background worker reads provider streams and forwards deltas to the content
script. On Mobile, `chrome.runtime.connect()` is a compatible virtual port backed
by a private Kotlin `HttpsURLConnection` session. Abort propagates from the UI
through the port to the active provider request. Completion, error, abort,
disconnect, navigation, page exit, startup timeout, extension-context
invalidation, Android backgrounding, and activity destruction terminate the
corresponding transport.

## 4. Grounding

### The primer

A single hand-written system primer, budgeted at roughly **1k tokens**. It
paraphrases only what Navigator needs to reason correctly:

- What AI Dungeon is, and the adventure/scenario/action model.
- What each plot component is *for* and how the model consumes it:
  **AI Instructions** (standing behavioral direction), **Plot Essentials**
  (persistent world/plot facts, the `memory` field in the API),
  **Author's Note** (short-range tonal and stylistic steering),
  **Story Summary** (auto-maintained compression of earlier story).
- What story cards are: title, type, triggers/keys, value, and the fact that
  they are injected only when a trigger matches recent context.
- The failure modes Navigator is meant to catch: stale facts, contradictions
  with the current story, bloated values, broken or overly generic triggers.

Deliberately excluded: the internal documentation corpus in
`Project Management/docs/`. It is ~460k characters written for our own
engineering, is heavily redundant for this purpose, and injecting it would cost
more tokens, add latency, and widen the content-filter surface for no gain.
The docs remain the *source* the primer is written from, not a payload.

### Adventure context

Everything needed for reads is already in memory and requires no new transport:

| Data | Source |
|---|---|
| Adventure identity, `shortId`, action count | `Ultrascripts.ws.getAdventureShortId()` / `getAdventureId()` |
| Story cards (id, type, title, keys, value) | Authoritative GraphQL read per Navigator turn; live cache fallback |
| Recent actions with text | `Ultrascripts.ws.getActions()` |
| GraphQL credentials for replay | `Ultrascripts.ws.getBaseCredentials()` |

Plot components need one new read query. `Adventure` exposes them directly:

```graphql
adventure(shortId: $shortId) {
  id shortId actionCount thirdPerson
  memory        # Plot Essentials
  authorsNote
  instructions  # Legacy AI Instructions fallback
  state {
    instructions # UI-backed AI Instructions JSON value
    storySummary
  }
}
```

Live verification resolved the read ambiguity: the current AI Instructions UI
maps to `Adventure.state.instructions`. Navigator normalizes that JSON/string
value to text and prefers it over the flat `Adventure.instructions` fallback.

### Context budget

| Segment | Target |
|---|---|
| Primer + complete system snapshot | 46k chars maximum |
| Adventure identity | 1.2k chars |
| Plot components (verbatim) | 7k chars |
| Recent story actions | 20k chars; 3k per action |
| Story Card directory | Remaining snapshot space; `id \| type \| title` only |
| Rolling conversation history | 16k chars, truncated oldest-first |

**Implemented Story Card directory.** Every turn refreshes the complete current
card collection through GraphQL and retains it in a non-persisted, content-side
index. The baseline injects only stable IDs, types, and titles, sorted by type,
title, and ID. Recent Story keeps its full allocation before the directory is
filled. The snapshot reports directory coverage, and search can still inspect
cards omitted from the injected directory because it uses the complete index.
No raw card entry is carried into later turns.

## 5. Shell Architecture

### Files

| Path | Role |
|---|---|
| `features/navigator_feature.js` | Lifecycle, adventure detection, launcher, drawer mount |
| `services/navigator/session.js` | Transcript, send/abort, per-adventure persistence |
| `services/navigator/context.js` | Grounding assembly and budget accounting |
| `services/navigator/tools.js` | Typed, bounded read-tool registry and execution |
| `services/navigator/primer.js` | The versioned system primer |
| `services/graphql-service.js` | Authenticated current Plot Component and Story Card reads |
| `styles.css` | `.bd-navigator-*` rules, tokens only |

Registered in `core/feature-manager.js` as `navigator`, **default on**, with a
popup toggle. Follows the `NotesFeature` lifecycle pattern: URL plus
`MutationObserver` adventure detection, `createUI` / `removeUI`, and per-adventure
state reset.

### Surface

The play page is Tamagui with an absolutely-positioned layer stack and a fixed
1067px content container. A layout-reflowing sidebar is not safely achievable.
Navigator therefore uses a fixed-position overlay drawer pinned to the right
gutter, reusing the available-space measurement approach already proven in
`story_card_modal_dock_feature.js` (`getAvailableDockWidth`). Below a width
threshold it becomes a full-screen sheet.

No backdrop — the story stays readable and interactive while Navigator is open.
Width is user-draggable and persisted via a `--bd-navigator-width` custom
property.

### Anatomy

- **Header** — Navigator mark, adventure title and context-coverage subtitle,
  clear-conversation action, and close.
- **Transcript** — user and assistant messages, plus error and status cards.
  Assistant messages use a bounded DOM-only Markdown renderer supporting
  headings, emphasis, nested lists, blockquotes, safe links, inline and fenced
  code, rules, and tables. Streaming may re-render an incomplete construct, but
  raw HTML is always text and model output is never assigned via `innerHTML`.
  Scoped display rules isolate Markdown layout from AI Dungeon's global styles.
- **Composer** — autosizing textarea, send, and stop-while-streaming. Confirmed
  mutation proposals render beneath assistant responses without widening the
  composer or holding a provider stream open.

### Launcher

A fixed Navigator button mounts independently of AI Dungeon's changing toolbar
DOM. `Alt+N` toggles the drawer directly, and Escape closes it while focus is
inside Navigator.

### Session

`NavigatorSession` owns `messages[]`, per-adventure persisted transcript,
`send()`, and `abort()`. The drawer talks only to the session; the session talks
only to the first-party chat surface. Read tools stay behind that session
boundary, so the drawer and persisted transcript do not carry provider
continuation state or raw tool results.

### Read tool loop

Phase 7B exposes two typed, read-only Story Card functions:

- `search_story_cards` searches title, type, triggers, description, and entry in
  the per-turn card index. It returns at most ten bounded candidates with a
  240-character entry preview and a 4k result cap.
- `get_story_card` reads one card by stable ID with complete bounded metadata and
  at most 6k entry characters, reporting source length and truncation.

The internal chat task can carry provider-neutral function declarations, tool
results, and opaque provider continuation state. The OpenAI-compatible adapter
translates that contract to each selected service's function-call format. The
same service selected for `consumer: 'navigator'` handles every
round; no cross-provider failover is introduced. A turn may execute at most six
tool rounds and 16k cumulative tool-result characters, and the same caller
`AbortSignal` covers every model and tool step.
Tool output is treated as untrusted adventure data. None of this is exposed in
the Ultrascripts operations dispatcher: `ai.status` and `ai.query` remain the
only script-facing AI operations.

## 6. Remaining Platform Work and Non-Goals

Recorded so the shell does not foreclose it.

**Read tools — implemented.** `search_story_cards` and `get_story_card` let the
model discover and inspect exact cards without spending baseline context on card
entries. Plot Components and the expanded Recent Story window are supplied
directly, so they do not need redundant model-facing tools.

**Mutation tools** — the write paths already exist and are confirmed:

| Target | Mutation |
|---|---|
| Plot Essentials, Author's Note, third person | `updateAdventurePlot(input: AdventurePlotInput)` |
| AI Instructions, Story Summary | `updateAdventureState(input: { shortId, state })` |
| Story cards | `updateStoryCard` upsert / `deleteStoryCard` |

`services/ai-dungeon-service.js` already performs authenticated
`updateStoryCard` via credential replay, so the pattern is established.
Mutations must never go through DOM automation the way Plot Presets currently
does; that path is too fragile for agent-driven edits.

The verified payloads, merge behavior, concurrency evidence, and restoration recipes
are frozen in
[`navigator-mutation-contract.md`](./navigator-mutation-contract.md).
`updateAdventureState` merges a partial state object; AI Instructions write as
`{ type: "custom", custom: <string> }`. Plot fields are optional and omitted
fields remain unchanged. Story Card updates are full-record writes because all
`UpdateStoryCardInput` fields are non-null. The current UI creates cards by
upserting a client-generated ID rather than calling a separate create mutation.

Phase 7C implements safe-DOM previews, stable-ID and current-value
preconditions, serialized writes, and mandatory server read-back. The model
receives proposal tools only; Apply, Reject, and Delete are direct player
actions that are never registered as model-callable functions. The synchronized
Read-only mode removes proposal definitions and blocks pending Apply controls.

The deliberately basic V2.1 contract does not include Undo or a durable audit
log. Story Card deletion therefore carries explicit irreversible wording. Card
creation uses a cryptographically generated nine-digit numeric ID, fresh-list
collision checks, and a bounded retry loop; the format round-tripped through a
live create, update, and delete probe.

**OpenAI-compatible provider UX — complete.** The popup exposes an explicit
active-provider selector, inline validation, save/test/clear controls, detailed
status, OpenRouter as the default compatible service, and Custom as the only
other service choice. Provider changes remain explicit; content never silently
fails over between providers.

**Automations — cancelled.** Navigator will not gain scheduled, event-triggered,
or unattended execution. It remains player-initiated, and every mutation
requires a direct approval action.

**Mobile — complete.** The separate Android repository
now uses a touch-first full-screen overlay, native Gemini/OpenAI-compatible
transport, virtual streaming ports, private provider settings, cross-WebView
storage notifications, and Android Back/navigation/background/destruction
cleanup. It preserves the PC grounding, read-tool budgets, proposal-only
mutations, confirmation, preconditions, verification, transcript, and Read-only
contracts. It intentionally excludes desktop dragging, drawer resizing, and
hotkeys.

## 7. Verified Mutation Contract

Phase 7A live capture resolved the write-path unknowns:

- `updateAdventureState` merges partial state, and `changedFields` is not
  required by the resolver.
- `Adventure.state.instructions` is authoritative and round-trips as
  `{ type: "custom", custom: <string> }`.
- `updateAdventurePlot` preserves omitted fields; empty strings clear its string
  fields.
- `updateStoryCard` requires a complete card record and acts as both create and
  update when given a client-generated ID.
- `Adventure.editedAt` is adventure-wide and can change for unrelated card
  writes. Preconditions therefore combine timestamps with normalized
  target-slice hashes; cards also use `updatedAt`.

Deleted-ID restoration remains unsupported. Story Card creation is enabled with
the live-verified secure nine-digit strategy described above. See the mutation
contract for the underlying resolver evidence and restoration recipes.

## 8. Build Order

1. **Complete:** first-party chat surface with `messages[]`, system instruction,
   streaming port, and per-consumer budget. `ai.query` remains untouched.
2. **Complete:** Navigator shell with drawer, launcher, session, transcript, and
   composer.
3. **Complete:** grounding primer, context assembly, budget accounting, and Plot
   Component reads.
4. **Complete:** mutation contract research with disposable-adventure read-back
   and restoration probes.
5. **Complete:** a compact Story Card directory, two typed card tools, and a
   bounded provider-native tool loop, including live sequential, parallel,
   abort, recovery, and formatting checks.
6. **Complete:** five mutation proposal tools with inline player confirmation,
   Read-only mode, preconditions, serialized GraphQL writes, and read-back
   verification across Plot Components and Story Cards.
7. **Complete:** PC provider setup and selection polish for Gemini, OpenRouter,
   and custom OpenAI-compatible endpoints.
8. **Complete:** Android full-screen Navigator, native
   provider transport, virtual streaming ports, settings migration, and lifecycle
   integration.

All V2.1 delivery steps are complete. Future work should preserve the explicit
provider-selection and player-confirmation boundaries.

Proposed additive work — configurable thinking with a traced reasoning stream,
a configurable context aggregation budget with full Story Card injection, a
Navigator settings surface, and Auto/YOLO approval modes — is planned in
[`navigator-enhancement-plan.md`](./navigator-enhancement-plan.md). Auto and
YOLO modes would deliberately revise the per-change confirmation boundary
recorded above; nothing in that plan is implemented.
