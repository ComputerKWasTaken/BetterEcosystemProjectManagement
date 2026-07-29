# Stateboy Direction and Implementation Plan

## Purpose

This document defines the focus of `stateboy.js` for its dedicated release
stage. It records the current implementation, the intended product direction,
and the changes required before Stateboy is ready to publish.

Stateboy should lean on the AI module. Modern LLMs are capable enough to infer
and maintain useful state from generous story context, while the readable
Stateboy card gives the user a simple place to correct, add, or remove anything
the AI gets wrong. Script-side validation should protect the data contract, not
try to duplicate the AI's reasoning with a large collection of heuristics.

## Product Direction

Stateboy is an AI-maintained, user-editable state sheet for AI Dungeon.

The intended experience is:

1. The user installs Stateboy in a BetterDungeon adventure.
2. Stateboy checks that its required Ultrascripts capabilities are usable and
   gives specific setup guidance when they are not.
3. The AI receives enough recent story and Stateboy history to make informed
   updates.
4. The AI may set, add, or remove states according to the user's settings.
5. Stateboy validates and applies the proposed operations.
6. The Stateboy card remains readable and authoritative, so user edits can
   immediately correct or reshape the system.
7. Widget presents the current state when available.

Stateboy's Context hook opts into AI Dungeon's cache-compatible V1 script
contract. Every Context change preserves the entire assembled prompt unchanged
and appends Stateboy's setup guidance and state-sheet suffix afterward. This
keeps Stateboy effective when a player enables Optimized Context on a
cache-efficient model, without requiring a separate `info.useCacheEfficient`
runtime branch.

Stateboy is a **Requires Ultrascripts** showcase. Manual parsing and context
injection should remain usable during setup problems so users do not lose their
state sheet, but missing required features must never fail silently.

## Current State

### Runtime flow

The Library function runs from the Context and Output hooks. On each call it:

- initializes persistent Stateboy and embedded Ultrascripts SDK state;
- reads Ultrascripts heartbeat and completed responses;
- creates `Stateboy`, `Stateboy Settings`, and `Stateboy Guide` cards if absent;
- parses settings and the Markdown-like state sheet;
- detects manual card edits and optionally records them;
- requests AI status, consumes a pending AI response, and applies accepted
  changes;
- injects visible state into Context;
- publishes visible states to Widget; and
- queues one asynchronous AI analysis after an Output turn.

The Context modifier begins with `// @cache-compatible`. Both normal state
injection and required setup warnings are suffix-only, satisfying AI Dungeon's
cache-efficient prefix check while retaining the existing behavior on other
models.

The `Stateboy` card is the source of truth. Script-written changes are rendered
back into it. Manual edits are detected with semantic sheet fingerprints, while
a short script-write handshake prevents delayed Story Card snapshots from
being mistaken for repeated user edits.

### State model

The current parser supports:

- categories declared with `##` through `######` headers;
- states written as `Name: Value`;
- optional descriptions in trailing parentheses;
- inferred ratio, percent, boolean, number, list, text, object, and null values;
- JSON literal notation normalized into those actual value types;
- category-level directives inherited by child states; and
- state-level directives that override the category.

The updater currently accepts only `set` operations against an exact,
already-existing category and state name. It rejects unknown states,
unsupported operations, low-confidence changes, incompatible types, and
AI-readonly entries. Ratio and percent updates are clamped.

### Current settings

The settings card controls:

- Stateboy on/off;
- AI on/off;
- Widgets on/off;
- Debug Mode;
- minimum accepted confidence;
- changelog on/off;
- manual-edit changelog on/off.

Changelog window sizes are implementation details rather than player settings:
the updater receives the newest 20 changes and Stateboy card Notes mirror up to
the newest 40. Legacy count fields are removed from existing Settings cards.

### Current Widget presentation

Widget presentation is type-aware and always names the displayed state:

- ratios use labeled bars and percentages use labeled progress indicators;
- numbers, booleans, and nulls use labeled stats;
- text uses titled panels instead of unlabeled text widgets;
- short lists use labeled tag groups, long lists use titled lists, and empty
  lists explicitly show `Empty`;
- objects use titled structured-data panels with named fields;
- stable per-state colors and optional category dividers make adjacent states
  easier to distinguish; and
- output is bounded to Widget's 40-widget and field-length limits without
  changing the source Stateboy card or AI Context.

JSON is not exposed as a Stateboy type. It is an optional notation: `true`
becomes a boolean, arrays become lists, objects become structured objects, and
`null` becomes an empty value. The Guide card explains this distinction with
examples.

### Current AI context and limits

The AI prompt currently includes:

- the explicit current AI Dungeon turn number;
- the complete parsed state sheet;
- the newest 20 changelog entries when changelog use is enabled;
- the last 8 history actions, each truncated to 900 characters; and
- the most recent model output, truncated to 2,500 characters.

Normal story Context wraps the visible state sheet in square brackets as an
editorial reference block. It tells the story model that this is the world's
current state and explicitly instructs it to continue the story rather than
continue or reproduce the sheet.

Stateboy keeps at most 40 accepted changes and 40 rejected changes in script
state. Notes are truncated to 3,000 characters, individual reasons to 160
characters, and AI summaries to 240 characters.

The released Ultrascripts AI contract currently advertises an executor
`promptMaxChars` value of 12,000. Stateboy therefore cannot safely enlarge its
prompt past that contract until the AI module limit is raised or the prompt
builder becomes aware of the advertised limit.

### Current directives

Directives use concise trailing flags:

```text
## Secrets [hidden, locked]
Public Clue: Found [visible, unlocked]
Internal Counter: 3 [no-widget]
Main Quest: Find the Crown [important]
Poisoned: On [temporary]
```

The parser resolves every state to:

```js
{ contextVisible, widgetVisible, aiMutable, important, temporary }
```

Category flags are inherited and state flags override them by domain. `hidden`
and `visible` control story Context and Widget together, `no-widget` and
`widget` provide a Widget-only override, and `locked`/`unlocked` control AI
mutation. The dedicated updater still sees hidden states.

`important` and `temporary` are semantic roles. Their conflicting combination
is treated as normal. Other conflicting or unknown flags are ignored, omitted
by the next canonical Stateboy write, and reported only through Debug Mode.
The former `widget:`, `context:`, and `ai:` syntax is unsupported.

### Gaps

- The prompt and logs are intentionally conservative despite the intended
  AI-first experience.
- AI cannot add or remove states.
- There is no complete prompt-budget policy or command/history system yet.

## Target 1: Enforce Required-Mode Setup Warnings

### Warning states

Evaluate setup in this order so the most fundamental problem wins:

1. **No valid heartbeat**
   - Treat BetterDungeon/Ultrascripts as unavailable.
   - Tell the user that Stateboy requires BetterDungeon with Ultrascripts
     enabled.
   - Skip AI requests and Widget writes for that turn.
2. **AI capability missing**
   - If heartbeat does not advertise both `ai.status` and `ai.query`, tell the
     user to enable/update the AI module.
3. **AI present but not ready**
   - Request `ai.status` asynchronously.
   - Do not warn while the first status request is merely pending.
   - When status reports `ready: false`, use its safe `message` when available
     and explicitly direct the user to configure the AI module and add a Gemini
     API key.
   - Never attempt `ai.query` until status reports `ready: true`.
4. **Widget unavailable**
   - If heartbeat does not advertise Widget, or safe SDK configuration reports
     it disabled, advise that Stateboy works best with Widget enabled.
   - This warning is advisory and must not block AI or manual state behavior.

Do not infer API-key contents or read secrets. `ai.status` is the authority for
whether the backend is configured.

### Presentation

Warnings should be visible without repeatedly polluting story prose:

- set `state.message` when a warning first appears or materially changes;
- append a compact `[Stateboy setup: ...]` note to Context while a required
  condition remains unresolved;
- deduplicate identical messages across hooks and turns;
- allow a higher-priority warning to replace a lower-priority one; and
- clear remembered warning state once the condition is resolved.

Missing Ultrascripts should not erase or rewrite the Stateboy card. Context
injection may continue from the local card, but Stateboy must clearly identify
that its required AI and Widget experience is unavailable.

### Implementation shape

Add a single setup assessment function that returns structured status rather
than scattering availability checks:

```js
{
  level: 'ok' | 'advisory' | 'required',
  code: 'runtime_missing' | 'ai_missing' | 'ai_not_ready' |
        'widget_disabled' | 'ok',
  message: '...',
  canQueryAi: true,
  canPublishWidget: true
}
```

All AI queuing, Widget publication, debug display, and player warnings should
consume this result.

## Target 2: Increase AI Context and Logging

### Prompt budget

Build prompts against a character budget instead of unrelated hard-coded
slices. Read the AI executor's advertised `promptMaxChars` from `ai.status`
when available and leave a small serialization margin.

Target:

- raise the BetterDungeon AI executor limit from 12,000 to at least 48,000
  characters, subject to a live Gemini validation;
- use up to 90% of the advertised limit for the complete Stateboy request;
- fall back to 12,000 when no reliable limit is advertised; and
- never knowingly submit a prompt larger than the executor contract.

Prompt content priority, highest to lowest:

1. updater instructions and response rules;
2. complete current state sheet;
3. latest model output;
4. the compiled Context captured from AI Dungeon's Context hook; and
5. recent accepted/manual changes, newest first.

The builder should allocate the remaining budget dynamically. It should retain
whole sections where practical and report truncation in Debug Mode. After the
executor limit is raised, allow up to 8,000 characters from the latest output
and up to 30 recent changelog entries, then give the remaining budget to the
compiled Context.

Stateboy does not need to select individual Plot Components, Story Cards, or
history actions: AI Dungeon already assembles those sources into Context. The
complete current state sheet must not be truncated just to retain the oldest
part of compiled Context.

### Logging

Increase retained detail so both the AI and user can understand past changes:

- accepted/manual change log: 200 records;
- rejected change log: 100 records;
- fixed AI changelog window: target 30;
- fixed Notes changelog window: target 50;
- Notes rendering budget: target 12,000 characters, confirmed against live
  Story Card behavior before release;
- individual reason: up to 600 characters; and
- AI summary: up to 1,000 characters.

Store full structured old/new entries for add and remove operations. Keep the
human-readable summary concise even when the structured record is detailed.

Gemini's low cost/free availability supports this more generous default, but
correctness still requires respecting the advertised executor and provider
limits. Usage optimization is secondary to giving the updater enough evidence.

## Target 3: Let AI Add and Remove States

### Settings

Add:

```text
AI May Add States: On
AI May Remove States: On
Add Confidence: 0.70
Remove Confidence: 0.80
Important Change Confidence: 0.85
```

Both default to `On` to match Stateboy's AI-first direction. Turning either off
must reject that operation without affecting `set`.

`Stateboy Settings` is Stateboy-owned and may be rewritten into its canonical
layout. Show Add Confidence only while adding is enabled, and Remove Confidence
only while removal is enabled. Preserve their last parsed values in script
state while hidden so re-enabling the capability restores the user's choices.
Important Change Confidence remains visible whenever important states are
supported.

Manual card edits remain unrestricted and authoritative regardless of these
settings.

### AI operation contract

Expand the response schema to allow `set`, `add`, and `remove`.

- `set`: update an existing state as today.
- `add`: create a new state in an existing category.
- `remove`: remove an existing state.

For the first release, AI should not create, remove, or rename categories.
Users can reshape categories directly in the Stateboy card. This bounds the
write path while still covering the common need for evolving state.

An added state should include category, name, value, reason, and confidence.
Description may be optional. Its type should be inferred by the same local
value parser used for manual states. States use duck typing rather than a
persistent declared-type contract. New states inherit their category
directives and receive no state-specific directives unless AI marks the new
state as temporary or the user later adds directives. Ordinary updates may not
create important states; initial generation may.

### Validation

Script validation remains mandatory:

- require the corresponding setting for add/remove;
- require set confidence at or above Minimum Confidence;
- require add/remove confidence at or above their separate thresholds;
- require Important Change Confidence when setting an important state;
- reject duplicate category/name pairs on add;
- reject unknown categories on add;
- reject unknown states on set/remove;
- reject set/remove for locked states;
- reject every attempt to remove an important state;
- reject empty or malformed names;
- reserve Stateboy syntax delimiters that cannot round-trip safely;
- apply operations in response order against the evolving in-memory sheet;
- cap operations per response to prevent accidental bulk rewrites; target 20;
- render and persist once after the entire accepted batch; and
- record a rejection reason for every refused operation.

Removing the final state in a category may leave the category absent after
rendering. This is acceptable because categories are presentation structure,
not independent state.

### Recovery and observability

An add log stores the full new entry. A remove log stores the full removed
entry, including value, type, description, and effective directives. This makes
the change explainable and gives the user enough information to restore it
manually.

Debug Mode should show counts for accepted sets/adds/removes and rejected
operations from the latest response.

## Target 4: Simplify State Directives

### Proposed user syntax

Replace the common punctuation-heavy forms with intent-based flags:

```text
## Secrets [hidden, locked]
Public Clue: Found [visible]
Internal Counter: 3 [no-widget]
Main Quest: Find the Crown [important]
Poisoned: On [temporary]
```

Canonical flags:

- `hidden` — hide from normal story Context and Widget;
- `visible` — show in normal story Context and Widget, overriding an inherited
  `hidden`;
- `locked` — AI may read the state but may not set or remove it;
- `unlocked` — allow AI updates, overriding an inherited `locked`;
- `no-widget` — keep in Context but omit from Widget;
- `widget` — show in Widget, overriding inherited `no-widget`;
- `important` — the state cannot be removed, requires Important Change
  Confidence for ordinary updates, and is completely immutable to cleanup; and
- `temporary` — tell AI that the state represents a short-lived condition and
  should be removed or promoted to normal when the story supports doing so.

Flags remain valid on both category headers and state lines. State flags
override category flags.

This covers the common intents directly:

- no directive means normal visibility and AI management;
- `[locked]` means user-managed;
- `[hidden]` means private from the story model and dashboard while still
  available to the Stateboy updater;
- `[hidden, locked]` means fully private and user-managed.

`temporary` is an AI-interpreted semantic hint, not a turn counter or automatic
expiration system. Ordinary updates and cleanup may remove the flag when a
temporary concept becomes permanent. Ordinary AI may create temporary states.
Only initial generation or the user may create important states.

`[important, temporary]` is invalid. Ignore both flags and treat the state as a
normal state. Preserve the user's text until another Stateboy write naturally
canonicalizes the card; report the conflict only in Debug Mode.

### Canonical policy

Replace the old directive parser and renderer outright. Only the new flags are
supported, and the internal policy object is:

```js
{ contextVisible, widgetVisible, aiMutable, important, temporary }
```

Unknown or contradictory flags are ignored and may be surfaced in Debug Mode.
Every Stateboy write renders only the canonical shorthand syntax. Update the
generated Guide card with a short, examples-first explanation of the new flags.

`hidden` affects normal story Context and Widget, not the dedicated AI updater
prompt. `locked` controls AI mutation. Keeping those concepts separate allows
the updater to reason about private state without leaking it into story
generation.

## Target 5: Initial Generation and Cleanup Jobs

### Shared job model

Generation and cleanup are explicit heavyweight AI jobs, separate from the
ordinary per-turn updater. This separation keeps requests easy to trace and
lets each prompt use a task-appropriate thinking level:

- ordinary update: `low`;
- initial or commanded generation: `high`; and
- cleanup: `medium`.

Only one Stateboy AI job is authoritative at a time. While generation or
cleanup is pending, skip ordinary update requests; the next ordinary request
will see the accumulated story context. A new generation/cleanup command takes
precedence over an older pending special job: abandon the old request id,
ignore any late response, and start the newly requested job. This prevents a
stalled request from deadlocking Stateboy.

Special jobs must never block normal play. The regular Widget shows that
Stateboy is thinking during generation or cleanup, but ordinary background
updates remain silent outside Debug Mode. Responses are applied on the first
later script invocation that can consume them.

Use the compiled Context exposed by AI Dungeon's normal lifecycle. Stateboy
does not choose separate scenario sources or pretend it can request additional
platform context. Cache the most recent compiled Context when necessary so a
command stopped in the Input hook can schedule its job without changing how AI
Dungeon assembles context.

### Automatic initial generation

If the scenario creator supplied a `Stateboy` card, use it exactly as the
initial sheet. If no card exists, create one containing:

```text
Stateboy is currently generating an initial state sheet. Please wait...
```

Do not inject this placeholder into story Context. Automatically request a new
sheet using the compiled scenario context, without bias from an old default
sheet. Initial generation may organize categories, add descriptions, and mark
appropriate states as important or temporary.

The automatic initial generation is not added to undo history because it
creates the starting point rather than modifying an established sheet. If it
cannot start because AI is unavailable, or if the request fails or times out,
do not retry automatically. Keep the setup/error message actionable and wait
for the user to run `/stateboy generate`.

The player may continue taking story actions while generation is pending.

### User-triggered generation

`/stateboy generate` creates an entirely new state sheet. Its prompt must not
include the previous Stateboy sheet; generation is deliberately unbiased by
the existing design. The old sheet is retained only in the inverse history
batch so the command can be undone.

Generation replaces all categories, states, values, descriptions, and
directives, including important states. Cleanup—not generation—is the command
for improving the existing sheet.

### Cleanup

Cleanup runs only through `/stateboy cleanup`; there is no periodic cleanup.
It is a dedicated AI request and applies without review.

Ask the AI for one complete proposed sheet. Stateboy then parses it, protects
important states, computes the difference from the current sheet, applies the
candidate, and stores an inverse batch. Cleanup may:

- add or remove ordinary states and categories;
- merge duplicates;
- rename or move ordinary states;
- create, rename, reorder, or remove categories;
- improve descriptions;
- simplify or restructure values using the normal duck-typed representation;
- change temporary states into permanent states; and
- simplify overly detailed data.

Cleanup may not change any aspect of an important state: category, position,
name, value, inferred type, description, or directives. It has no confidence
threshold because the user explicitly requested the operation. Structural
validation and important-state protection still apply.

If cleanup produces no effective difference, report that the sheet is already
clean and do not create a history batch.

## Target 6: Batch Undo and Redo

### History model

Store inverse operation batches rather than full snapshots wherever possible.
Each successful ordinary AI response is one batch, and each successful cleanup
is one batch regardless of how many states it changes. A user-triggered
generation is also one reversible replacement batch. Automatic initial
generation and manual card edits are not history entries.

Keep the latest 100 applied batches. Each operation retains enough structured
old/new data to reverse sets, additions, removals, description edits, moves,
renames, directive changes, and sheet replacement. This is intentionally a
simple count limit; the AI Dungeon sandbox's 16 MB allowance leaves ample room
for this bounded history under ordinary use.

### Undo behavior

`/stateboy undo` reverses one complete batch. `/stateboy undo N` reverses up to
N batches, newest first, and creates the corresponding redo entries. If fewer
than N exist, reverse all available batches and report the actual number.

Undo must be conflict-safe. Before reversing an operation, confirm that the
current state still matches the result originally written by that batch. If a
later manual edit changed it, skip that operation rather than overwrite the
user's correction. Continue reversing non-conflicting operations in the same
batch and report how many were skipped.

### Redo behavior

`/stateboy redo` and `/stateboy redo N` replay whole batches. Clear the redo
stack after any new ordinary AI update, cleanup, generation, or manual card
edit, because the sheet has branched. Reject undo and redo while an AI job is
pending so a late response cannot land on a restored sheet.

There is no history browser or batch-id command. Status only needs undo and
redo counts.

## Target 7: Command System

Add an Input modifier and accept both `/stateboy` and `/sb` prefixes:

```text
/stateboy status
/stateboy undo [count]
/stateboy redo [count]
/stateboy generate
/stateboy cleanup
/stateboy help
```

Every recognized command returns `stop: true`, preventing the game loop from
progressing the story. Put feedback in `state.message` and, where relevant,
the regular Widget. Do not send a neutral replacement action to the story
model.

Command behavior:

- `status` reports runtime, AI, Widget, state count, active job, and undo/redo
  counts;
- `undo` and `redo` operate on whole batches and reject while AI is pending;
- `generate` replaces the complete sheet and is reversible;
- `cleanup` improves the current sheet in a separate request; and
- `help` lists commands and their concise purpose.

There is no review, history, regenerate, sync, or confirmation command. A new
generation/cleanup command supersedes an older special request rather than
being rejected as busy.

## Internal Refactor

Keep the script ES5-compatible with the AI Dungeon environment, but organize
the flow around a few explicit phases:

1. parse Input commands and stop recognized commands;
2. bootstrap cards and persistent state;
3. read Ultrascripts responses and assess setup;
4. parse settings and state sheet;
5. reconcile manual edits and redo invalidation;
6. process the authoritative ordinary/special AI response;
7. apply or reverse a validated operation batch;
8. capture/inject Context or queue the appropriate request;
9. publish Widget/status; and
10. commit Ultrascripts requests.

Recommended internal boundaries:

- `assessStateboySetup`
- `buildStateboyPromptWithinBudget`
- `validateStateboyOperation`
- `applyStateboyOperationBatch`
- `diffStateboySheets`
- `undoStateboyBatch`
- `startStateboyJob`
- `processStateboyCommand`
- `resolveStateboyPolicy`
- `publishStateboyWarning`

Keep the embedded SDK aligned with the Required template contract. If a shared
helper cannot be used in AI Dungeon's paste model, copy only the contractually
identical behavior and cover the duplicated surface with tests.

## Implementation Order

### Phase 1: Required-mode setup

- add structured setup assessment;
- request and consume `sdk.config` if needed to distinguish Widget disabled
  from unavailable;
- implement deduplicated warnings;
- gate AI and Widget work from the assessment result; and
- verify recovery when capabilities become available on a later turn.

### Phase 2: Budgeted context and expanded logs

- make prompt construction budget-aware;
- coordinate the AI executor limit increase;
- raise settings ranges and persistent log caps;
- add Debug Mode prompt-size/truncation details; and
- validate large-card and long-history behavior.

### Phase 3: Add/remove operations

- make the Settings card canonical and conditionally render add/remove
  confidence fields;
- add settings and guide text;
- expand the JSON schema and AI instructions;
- implement ordered batch validation/application;
- extend changelog records and summaries; and
- test mixed set/add/remove responses.

### Phase 4: Directive simplification

- introduce the normalized policy model;
- replace the old parser with the new flags;
- render canonical shorthand;
- update Guide examples; and
- test inheritance, overrides, invalid combinations, and round trips.

### Phase 5: Generation and cleanup

- replace the static default sheet with automatic initial generation;
- add the placeholder and regular-Widget thinking state;
- implement authoritative special-job precedence and stale-response ignoring;
- implement unbiased user-triggered generation;
- implement full-sheet cleanup, diffing, and important-state protection; and
- verify that special jobs never block story play.

### Phase 6: Undo, redo, and commands

- add the Input modifier and both command prefixes;
- implement 100 inverse batches plus redo;
- add conflict-safe partial reversal;
- clear redo on every branch-producing change;
- return `stop: true` for recognized commands; and
- test asynchronous command and pending-job interactions.

### Phase 7: Publication alignment

- update the Script Contract Reference to the final operation and directive
  contracts;
- update BetterRepository metadata and public documentation;
- run live BetterDungeon tests;
- publish only after the Stateboy roadmap exit gate is satisfied; and
- verify the public copy/download matches the tested raw script byte-for-byte.

## Test Matrix

At minimum, verify:

| Area | Cases |
|---|---|
| Runtime | heartbeat absent, malformed, archived, appears after warning |
| AI capability | module absent, op absent, status pending, no key, ready, query error, timeout |
| Widget | module absent, disabled, enabled, later enabled, Stateboy setting off |
| Warnings | priority, deduplication, change, recovery, no story-card damage |
| Context | large state sheet, long output, long history, advertised budget, fallback budget |
| Logging | cap rollover, long reasons, Notes truncation, manual corrections, no-op suppression |
| Set | every supported type, clamp behavior, low confidence, locked state |
| Add | allowed/disabled, duplicate, unknown category, inferred types, invalid name |
| Remove | allowed/disabled, unknown state, locked state, final category entry |
| Confidence | set/add/remove thresholds, conditionally displayed settings, important threshold |
| Batch | ordered dependencies, mixed operations, partial rejection, 20-operation cap |
| Directives | canonical flags, inheritance, override, unknown flags, important/temporary conflict, render/parse round trip |
| Initial generation | creator sheet preserved, absent sheet, placeholder, failure without retry, play continues |
| Generate | unbiased prompt, complete replacement, important replacement, undo/redo |
| Cleanup | separate request, full-sheet diff, category changes, duck typing, no-op, important immutability |
| Job control | ordinary update skipped, new special job supersedes old, late response ignored |
| Undo/edit | whole batches, multiple counts, partial conflicts, manual edits clear redo, 100-batch rollover |
| Commands | both prefixes, parsing, `stop: true`, pending undo rejection, status and help feedback |

## Release Acceptance Criteria

Stateboy is ready to publish when:

- missing BetterDungeon/Ultrascripts produces a clear required warning;
- unavailable or unconfigured AI produces accurate API-key/module guidance;
- Widget-off produces a helpful advisory without blocking Stateboy;
- setup recovery happens automatically without resetting the adventure;
- AI receives substantially more context within a verified executor budget;
- expanded logs remain bounded and readable;
- add/remove settings and all three operations behave predictably;
- Add/Remove confidence settings appear only while their capabilities are on;
- users can understand the shorthand directives from examples alone;
- important states receive their higher-confidence and cleanup protections;
- temporary states behave as AI-interpreted lifecycle hints;
- automatic generation replaces the old static default without blocking play;
- user generation is unbiased by the old sheet and can be undone;
- cleanup is explicit, separate, immediately applied, and reversible;
- 100-batch undo/redo skips conflicts instead of overwriting manual edits;
- every recognized command stops story progression and reports its result;
- manual edits remain authoritative and do not create update loops;
- live AI, Widget, manual-edit, and failure-path tests pass; and
- the script, Guide card, contract reference, repository entry, and public
  release copy agree.

## Explicit Non-Goals

- replacing the Stateboy card with opaque script state;
- exposing or reading API keys;
- selecting provider-native models from Stateboy;
- automatic or periodic cleanup;
- a review/approval queue for AI changes;
- deterministic expiration timers for temporary states;
- evidence requirements beyond the existing AI reason/debug information;
- state-count limits or anti-bloat heuristics;
- periodic full reconciliation or correction-specific prompt logic;
- a history browser or batch-id rollback interface;
- blocking story play while generation or cleanup is pending;
- removing validation because the AI is trusted; or
- supporting a no-Ultrascripts mode as an equal product experience.
