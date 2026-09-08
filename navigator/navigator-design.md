# Navigator — Architecture and Product Contract

> Durable contract for the Navigator implementation shipping with
> BetterDungeon v2.1 on PC and Android.

Implementation status: **functionally complete; release polish remains.**
Verified GraphQL behavior and mutation safety evidence live in
[`navigator-mutation-contract.md`](./navigator-mutation-contract.md).

## 1. Product Definition

Navigator is an adventure copilot embedded in AI Dungeon's Gameplay settings.
It combines a multi-turn chat with bounded knowledge of the current adventure
and verified tools for researching or changing the surrounding adventure data.

Navigator primarily addresses:

- **Rot** — Plot Components, Memory Bank entries, and Story Cards drift away
  from the story as an adventure develops.
- **Modification** — adapting an adventure or scenario to the player's taste is
  useful but tedious through individual editors.

Navigator targets players in live adventures. It is not a story-playing model,
a replacement for AI Dungeon's generation model, a general chatbot, or an
unattended automation system.

## 2. Shipped Product Decisions

| Area | v2.1 contract |
|---|---|
| Surface | A Navigator subtab inside AI Dungeon's Gameplay settings on PC and Mobile |
| Conversation | Per-adventure, multi-turn, streaming, and cancellable |
| Context | Always attempts Plot Components, recent story, Memory Bank, and Story Card directory within a fixed budget |
| Read tools | Bounded Story Card, story-history, and Memory Bank retrieval; no Plot Components retrieval tool |
| Changes | Automatic by default, Proposed changes, or No changes |
| Automatic exception | Permanent Story Card and Memory Bank deletions always require explicit Delete approval |
| Write safety | Fresh preconditions, target hashes, serialized writes, and mandatory server read-back |
| Inspector | Dedicated, live, latest-request-only transparency view with no clipboard export |
| Message controls | No user Edit, assistant Retry, action row, or message copy controls |
| Providers | Gemini or an explicitly selected OpenAI-compatible service through the shared first-party chat layer |
| Automations | Not supported; every Navigator turn is player-initiated |

## 3. AI and Transport Architecture

The script-facing `UltrascriptsAIExecutor.query()` contract remains frozen:
single-shot input, a 12,000-character prompt cap, non-streaming completion, and
no conversation state. Third-party Ultrascripts continue to depend on it.

Navigator instead uses the additive first-party chat surface:

- multi-turn `messages[]` plus a canonical system instruction;
- provider-native streaming and function calls;
- a configurable input limit, with 128k tokens as the default cap;
- one selected provider for every round in a turn; and
- one `AbortSignal` spanning model requests and tool execution.

On PC, the background worker reads the provider stream and forwards deltas over
a versioned runtime port. On Mobile, the compatible virtual port is backed by a
private Kotlin HTTPS session. Completion, error, cancellation, disconnect,
navigation, extension invalidation, Android backgrounding, and activity
destruction terminate the associated transport.

Navigator never silently fails over between Gemini, OpenRouter, and Custom
services. Provider credentials, headers, keys, cookies, and transport
authentication data are never copied into the transcript or Inspector.

## 4. Context Assembly

### Always-attempted snapshot

Players no longer select Context sections. Every request attempts the complete
canonical snapshot:

1. adventure identity;
2. Plot Components;
3. recent story;
4. Memory Bank; and
5. Story Card directory.

The bounded text rendered for those sections is inserted into the final system
instruction. Context rendering also returns matching `inspectionSections`; each
Inspector section must be exactly the text sent for that section, including
truncation, degraded, unavailable, or dropped-state wording.

Persisted legacy `contextSections` values are ignored rather than destructively
rewritten. Plot Components are always supplied directly when available, so the
former `get_plot_components` / Read Plot Components tool is intentionally
absent.

### Snapshot budgets

Current character ceilings are:

| Segment | Ceiling or rule |
|---|---:|
| Complete system instruction | 46,000 |
| Adventure identity | 1,200 |
| Plot Components | 24,000 |
| Recent story | 20,000; 3,000 per action |
| Memory Bank | 12,000 |
| Story Card directory | 16,000 |
| Conversation history | 16,000; oldest messages omitted first |

Plot Components are treated honestly: oversized fields may be truncated and
reported as such. Other sections yield space within the aggregate budget, and
coverage metadata records included items, source counts, source characters,
truncation, and incomplete retrieval.

### Read tools

The model can receive six bounded, read-only tools:

- `search_story_cards` and `get_story_card`;
- `search_story_history` and `get_story_actions`; and
- `search_memory_bank` and `get_memory`.

Searches return at most ten results. A Story Card entry is capped at 6,000
characters, an action window at 20 actions and about 8,000 characters, and a
Memory Bank entry at 4,000 characters. Tool results report truncation instead
of implying completeness.

A turn may execute at most six model/tool rounds and retain at most 16,000 tool
result characters. If the provider input budget is exhausted, the runtime may
reduce history, tools, or raw results and records a plain-language Inspector
warning.

## 5. Changes and Mutation Safety

### Canonical modes

The runtime setting is:

```text
changeMode: 'automatic' | 'proposed' | 'none'
```

- **Automatic** — recommended default. Validated non-deletion changes queue and
  apply immediately, then appear as verified applied-change cards.
- **Proposed changes** — every mutation remains pending until the player
  approves or rejects it.
- **No changes** — mutation tools are not exposed, existing pending controls are
  disabled, and all write attempts fail closed.

Permanent Story Card and Memory Bank deletions are never automatic. They remain
pending with irreversible wording and require an explicit player Delete action
in both Automatic and Proposed changes modes.

Legacy settings remain read-only migration inputs for out-of-sync clients. An
effective legacy Read-only setting maps to `none`; Review maps to `proposed`;
other valid legacy states map to `automatic`. New code reads and writes only
`changeMode`.

### Model and runtime boundary

The model can stage seven proposal types:

- Plot Component text change;
- Third Person change;
- Story Card create, update, or delete; and
- Memory Bank update or delete.

The model cannot call Apply or Delete. The interface/runtime owns mutation
application according to the active mode. Each application performs an
independent storage check immediately before writing; unreadable or unavailable
settings behave as No changes.

Writes compare stable identity, current target values, relevant timestamps, and
normalized hashes. They are serialized, sent through authenticated GraphQL,
and verified by a fresh authoritative read before being reported as applied.
Conflicts and errors remain visible and are never retried as blind overwrites.

Navigator has no mutation Undo command and no durable audit log. A later chat
request may propose a compensating edit using visible prior values, but that is
a normal new mutation. Deleted Story Cards and Memory Bank entries are treated
as permanently destructive.

## 6. Interface Contract

### Shared PC and Mobile structure

Navigator mounts as a full content view within an injected Gameplay settings
subtab. Its main header remains visible for Chat, Inspector, Settings, and Clear
conversation actions.

The chat view contains:

- a transcript of user, assistant, tool, error, and compact change cards;
- suggested prompts for an empty conversation;
- a bounded Markdown renderer that treats raw HTML as text;
- an autosizing composer with Send and Stop states; and
- a settings view with Thinking level and one three-way icon toggle for Changes.

The header does not repeat the selected change mode in a pill, and the Changes
control does not need explanatory body copy. Accessible labels retain the full
mode names and behavior.

Message action rows, user-message editing, edit confirmation, assistant Retry,
and all Navigator message clipboard controls are absent. Clear conversation and
request cancellation remain.

### Inspector

Inspector replaces the transcript and composer while preserving Navigator's
main header. A visible **Back to chat** action returns to chat. Escape returns
to chat before it closes Navigator. Opening Settings also exits Inspector and
opens Settings over the chat view.

Inspector remains live while a request runs. Its player-readable view includes:

- status: Running, Complete, Attention, or Error;
- Model, Thinking, Input usage, Context health, and Tool activity summaries;
- warnings for reduced context, omitted history, dropped tools/results,
  provider limits, and request errors;
- expanded-by-default Context sent coverage and exact rendered sections;
- collapsed Conversation sent with exact role-labelled messages and omitted
  history count;
- Tool activity with rounds, friendly names, and success/error states, opened
  automatically when tools were used or failed; and
- collapsed Technical details with selectable rounds, exact request payloads,
  system instruction, messages, tool schemas/results, continuation state,
  budgets, response metadata, and bounded raw metadata.

Inspector content may contain adventure and conversation text. It is ephemeral,
replaced by the next request or page reload, and cannot be copied through a
Navigator-provided control. Clearing the conversation also clears inspection
data.

### Platform differences

- **PC** retains custom settings-tab overflow arrows because otherwise later
  Gameplay subtabs can become inaccessible. Mouse, keyboard, narrow-window,
  focus, and reduced-motion behavior must remain usable.
- **Mobile** uses AI Dungeon's native drag/swipe tab navigation and therefore
  does not inject custom arrows. Navigator uses IBM Plex, touch-sized controls,
  IME-aware composer sizing, and Inspector-first Android Back handling.

## 7. Persistence and Inspection Capture

`NavigatorSession` owns the per-adventure transcript, settings resolution,
send/cancel lifecycle, proposal state, and latest inspection record. Persisted
transcripts are bounded and exclude raw provider payloads, continuation state,
and raw tool results.

The in-memory inspection contract contains:

- `snapshot` — coverage, metrics, warnings, and exact rendered sections;
- `conversation` — sent messages, included characters, truncation, and omitted
  message count;
- `rounds` — exact request payloads, provider tool calls, execution results,
  response metadata, and friendly bounded summaries; and
- aggregate `meta`, `status`, and `error` fields.

Only the latest Navigator request is retained, with an approximately 4 MiB
inspection ceiling. When reducing retained diagnostics, preserve the structured
overview, context sections, and bounded summaries first; omit intermediate raw
round bodies before truncating the first or latest raw payload.

## 8. Implementation Map

| Path | Responsibility |
|---|---|
| `features/navigator_feature.js` | Gameplay-subtab integration, views, rendering, focus, and lifecycle |
| `services/navigator/session.js` | Transcript, settings, send/cancel, tool loop, changes, and inspection capture |
| `services/navigator/context.js` | Always-attempted snapshot, budgets, coverage, and exact inspection sections |
| `services/navigator/tools.js` | Six bounded read tools |
| `services/navigator/mutations.js` | Seven proposal definitions, validation, conflict checks, writes, and verification |
| `services/navigator/primer.js` | Versioned system guidance and mode-aware behavior |
| `services/graphql-service.js` | Authenticated Plot, Story Card, Memory Bank, and write operations |
| `styles.css` | Shared Navigator styling plus platform-specific overrides |

The Android project lives at `android/` in the same repository. Gradle composes
shared JavaScript and CSS from the root with the declared files in
`android/web/` and `android/overrides/`; native transport and lifecycle code
remain under `android/app/`. Generated assets are build output, not source.

## 9. Release and Maintenance Boundary

Navigator's v2.1 feature design is closed. Before release, limit work to:

- confirmed defects and visual inconsistencies;
- documentation, tutorial, release-note, and promotional alignment;
- accessibility, focus, narrow-layout, reduced-motion, and IME polish;
- cross-platform parity where behavior is meant to be shared; and
- automated, manual, browser-package, and Android-package verification.

Additional tools, automations, providers, durable audit/Undo systems, or broad
architecture changes belong after v2.1 and require a new scoped decision.
