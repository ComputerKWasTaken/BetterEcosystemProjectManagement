# Navigator — Architecture and Product Contract

> V2.1 headline feature. This document locks the decisions needed to build
> Navigator's shell and live chat, and records what is deliberately deferred.

Implementation status: the first-party streaming chat surface and Phase 6
grounded read-only Navigator are complete and live-tested. Read and mutation
tools remain deferred to Phase 7.

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
| Surface | Right-pinned overlay drawer; full-screen sheet when narrow |
| First build | Shell + live grounded chat, read-only, streaming |
| Tool loop | **Deferred.** No tools in the first pass, read or write |
| Mutations | Deferred to a later stage, behind an off-by-default permission |
| Grounding | Hand-written paraphrase, ~1k tokens. No documentation injection |
| Provider | Gemini, via an upgraded first-party chat surface |
| OpenRouter | After the Navigator foundation lands |
| Streaming | In scope for the first pass |
| Mobile | PC extension first; mobile port is a separate later pass |
| Automations | **Out of V2.1.** Deferred, not cancelled |

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

Both route through the **same provider registry and the same Gemini adapter**.
`registerProvider` / `resolveProvider` / `setProviderForConsumer` already exist
in `modules/ai/executor.js`, so Navigator registers as `consumer: 'navigator'`
and OpenRouter later drops in with zero Navigator changes.

This is why the backend upgrade is a prerequisite rather than a follow-up:
multi-turn conversation and streaming are both required by the first pass, and
neither is expressible through `ai.query`.

### Streaming transport

The implemented chat path uses a versioned long-lived runtime port. The
background worker reads the Gemini Interactions stream and forwards deltas to
the content script, which appends them to the in-flight assistant message.
Abort propagates from the drawer's stop button through the port to an
`AbortController`. Completion, error, abort, disconnect, page exit, startup
timeout, and extension-context invalidation all terminate the port.

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
| Story cards (id, type, title, keys, value) | `Ultrascripts.ws.getCards()`, normalized by `storyCardCache` |
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
| Story cards | 16k chars; 1.6k per card value |
| Recent story actions | 8k chars; 1.8k per action |
| Rolling conversation history | 12k chars, truncated oldest-first |

**Implemented story card inclusion.** With no tool loop, cards are pre-selected
within a character budget. Cards whose triggers appear in recent story text are
ranked first, followed by recently updated cards. Values are truncated per card,
and the snapshot reports included and omitted counts so Navigator can state its
coverage honestly. This remains the primary limitation of the tool-free design
and the strongest argument for Phase 7 read tools.

## 5. Shell Architecture

### Files

| Path | Role |
|---|---|
| `features/navigator_feature.js` | Lifecycle, adventure detection, launcher, drawer mount |
| `services/navigator/session.js` | Transcript, send/abort, per-adventure persistence |
| `services/navigator/context.js` | Grounding assembly and budget accounting |
| `services/navigator/primer.js` | The versioned system primer |
| `styles.css` | `.bd-navigator-*` rules, tokens only |

Registered in `core/feature-manager.js` as `navigator`, **default off**, with a
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
- **Composer** — autosizing textarea, send, and stop-while-streaming. Mutation
  mode remains deferred with the Phase 7 permission and preview design.

### Launcher

A fixed Navigator button mounts independently of AI Dungeon's changing toolbar
DOM. `Alt+N` toggles the drawer directly, and Escape closes it while focus is
inside Navigator.

### Session

`NavigatorSession` owns `messages[]`, per-adventure persisted transcript,
`send()`, and `abort()`. The drawer talks only to the session; the session talks
only to the first-party chat surface. When tools arrive, they are added behind
the session boundary without touching the drawer's message rendering except to
introduce new card types.

## 6. Deferred Work

Recorded so the shell does not foreclose it.

**Read tools** — `list_story_cards`, `get_story_card`, `search_story_cards`,
`get_plot_components`, `get_recent_story`. Removes the pre-selection problem in
§4 and validates the tool loop on operations that cannot damage an adventure.

**Mutation tools** — the write paths already exist and are confirmed:

| Target | Mutation |
|---|---|
| Plot Essentials, Author's Note, third person | `updateAdventurePlot(input: AdventurePlotInput)` |
| AI Instructions, Story Summary | `updateAdventureState(input: { shortId, state })` |
| Story cards | `createStoryCard` / `updateStoryCard` / `deleteStoryCard` |

`services/ai-dungeon-service.js` already performs authenticated
`updateStoryCard` via credential replay, so the pattern is established.
Mutations must never go through DOM automation the way Plot Presets currently
does; that path is too fragile for agent-driven edits.

Requires before enabling: structured change-set preview, stable-ID plus
read-version preconditions against stale overwrites, an audit log with
before/after data, and undo.

**OpenRouter** — Gemini is documented as unreliable for explicit content, and a
large share of AI Dungeon adventures will trip provider filters on the *input*
context alone. Navigator will surface those blocks clearly rather than failing
silently, and an alternative provider is the real fix. The provider registry
makes this additive.

**Automations — out of V2.1.** Deterministic triggers (every N turns, action
types) running the same validated tools, with dry-run, approval, cooldowns,
request budgets, monotonic last-run markers, run history, and a global kill
switch. Removed from the release: it is a substantial subsystem in its own
right, and it would be built directly on top of mutation safety that has only
just been established. Still the intended direction later.

**Mobile** — separate repository. Navigator ships PC-first; the mobile port is
its own later pass and is not a V2.1 gate.

## 7. Verification Unknowns

To resolve by live capture before the mutation stage:

- Whether `updateAdventureState` merges a partial `state` object or replaces it.
- The exact mutation payload shape required to preserve and update the
  UI-backed `AdventureState.instructions` value. Its read mapping is resolved;
  the state value is authoritative and the flat string is a legacy fallback.

## 8. Build Order

1. **Complete:** first-party chat surface with `messages[]`, system instruction,
   streaming port, and per-consumer budget. `ai.query` remains untouched.
2. **Complete:** Navigator shell with drawer, launcher, session, transcript, and
   composer.
3. **Complete:** grounding primer, context assembly, budget accounting, and Plot
   Component reads.
4. **Next:** read tools and the tool loop.
5. Mutation tools with preview, preconditions, audit, and undo.

Steps 1–5 are V2.1. OpenRouter and Automations are beyond it.
