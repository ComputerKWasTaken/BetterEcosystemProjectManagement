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

The `Stateboy` card is the source of truth. Script-written changes are rendered
back into it, and manual edits are detected by comparing the observed card text
with the last script-written text.

### State model

The current parser supports:

- categories declared with `##` through `######` headers;
- states written as `Name: Value`;
- optional descriptions in trailing parentheses;
- inferred JSON, ratio, percent, boolean, number, list, string, object, and
  null values;
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
- manual-edit changelog on/off;
- number of changelog entries sent to AI; and
- number of changelog entries mirrored into Stateboy card notes.

### Current AI context and limits

The AI prompt currently includes:

- the complete parsed state sheet;
- up to 6 changelog entries by default, configurable from 0 to 20;
- the last 8 history actions, each truncated to 900 characters; and
- the most recent model output, truncated to 2,500 characters.

Stateboy keeps at most 40 accepted changes and 40 rejected changes in script
state. Notes are truncated to 3,000 characters, individual reasons to 160
characters, and AI summaries to 240 characters.

The released Ultrascripts AI contract currently advertises an executor
`promptMaxChars` value of 12,000. Stateboy therefore cannot safely enlarge its
prompt past that contract until the AI module limit is raised or the prompt
builder becomes aware of the advertised limit.

### Current directives

Directives use trailing bracket metadata:

```text
## Secrets [widget: off, context: off, ai: readonly]
Secret: Known [widget: off, context: off, ai: readonly]
```

The three independent domains are:

- `widget: on/off`;
- `context: on/off`; and
- `ai: on/readonly`.

This is flexible but verbose. It exposes implementation domains to users,
requires punctuation-heavy syntax, and makes common intents such as "hide this"
or "do not let AI change this" harder to express than necessary.

### Gaps

- Missing heartbeat, unavailable AI, and missing Widget currently cause
  features to be skipped without strong, actionable user warnings.
- AI status is requested but not translated into clear configuration guidance.
- The prompt and logs are intentionally conservative despite the intended
  AI-first experience.
- AI cannot add or remove states.
- The directive syntax is more technical than the rest of the card format.
- There is no explicit prompt-budget policy, warning-state model, or focused
  Stateboy regression suite.

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
- prepend a compact `[Stateboy setup: ...]` note to Context while a required
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
4. recent story actions, newest first;
5. recent accepted/manual changes, newest first.

The builder should allocate the remaining budget dynamically. It should retain
whole entries where practical and report truncation in Debug Mode. Generous
defaults after the executor limit is raised:

- up to 30 recent history actions;
- up to 2,500 characters per history action;
- up to 8,000 characters from the latest output; and
- up to 30 recent changelog entries.

These are ceilings, not fixed allocations. The complete current state sheet
must not be truncated just to include older story history.

### Logging

Increase retained detail so both the AI and user can understand past changes:

- accepted/manual change log: 200 records;
- rejected change log: 100 records;
- AI changelog setting range: 0-100, default 30;
- Notes changelog setting range: 0-100, default 50;
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
```

Both default to `On` to match Stateboy's AI-first direction. Turning either off
must reject that operation without affecting `set`.

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
value parser used for manual states, keeping one type system. New states inherit
their category directives and receive no state-specific directives unless the
user later adds them.

### Validation

Script validation remains mandatory:

- require the corresponding setting for add/remove;
- require confidence at or above the configured threshold;
- reject duplicate category/name pairs on add;
- reject unknown categories on add;
- reject unknown states on set/remove;
- reject set/remove for locked states;
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

Replace the common punctuation-heavy forms with three intent-based flags:

```text
## Secrets [hidden, locked]
Public Clue: Found [visible]
Internal Counter: 3 [no-widget]
```

Canonical flags:

- `hidden` — hide from normal story Context and Widget;
- `visible` — show in normal story Context and Widget, overriding an inherited
  `hidden`;
- `locked` — AI may read the state but may not set or remove it;
- `unlocked` — allow AI updates, overriding an inherited `locked`;
- `no-widget` — keep in Context but omit from Widget; and
- `widget` — show in Widget, overriding inherited `no-widget`.

Flags remain valid on both category headers and state lines. State flags
override category flags.

This covers the common intents directly:

- no directive means normal visibility and AI management;
- `[locked]` means user-managed;
- `[hidden]` means private from the story model and dashboard while still
  available to the Stateboy updater;
- `[hidden, locked]` means fully private and user-managed.

### Compatibility

Do not break existing cards on upgrade.

- Continue parsing legacy `widget:`, `context:`, and `ai:` directives.
- Normalize both syntaxes into one internal policy object:
  `{ contextVisible, widgetVisible, aiMutable }`.
- Prefer explicit state flags over inherited category policy.
- If one line mixes legacy and new syntax, apply tokens from left to right and
  record a parse warning in Debug Mode.
- When Stateboy rewrites a card, render the new shorthand flags.
- Update the generated Guide card with a short examples-first section and move
  the legacy syntax to a compatibility note.

`hidden` affects normal story Context and Widget, not the dedicated AI updater
prompt. `locked` controls AI mutation. Keeping those concepts separate allows
the updater to reason about private state without leaking it into story
generation.

## Internal Refactor

Keep the script ES5-compatible with the AI Dungeon environment, but organize
the flow around a few explicit phases:

1. bootstrap cards and persistent state;
2. read Ultrascripts responses and assess setup;
3. parse settings and state sheet;
4. reconcile manual edits;
5. process and validate the prior AI response;
6. inject Context or queue Output analysis;
7. publish Widget/status;
8. commit Ultrascripts requests.

Recommended internal boundaries:

- `assessStateboySetup`
- `buildStateboyPromptWithinBudget`
- `validateStateboyOperation`
- `applyStateboyOperationBatch`
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

- add settings and guide text;
- expand the JSON schema and AI instructions;
- implement ordered batch validation/application;
- extend changelog records and summaries; and
- test mixed set/add/remove responses.

### Phase 4: Directive simplification

- introduce the normalized policy model;
- parse new flags and legacy directives;
- render canonical shorthand;
- update Guide examples; and
- test inheritance, overrides, mixed syntax, and round trips.

### Phase 5: Publication alignment

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
| Batch | ordered dependencies, mixed operations, partial rejection, 20-operation cap |
| Directives | new flags, legacy syntax, inheritance, override, mixed syntax, render/parse round trip |
| Undo/edit | user restores removed entry, user edits after AI write, no write-observation loop |

## Release Acceptance Criteria

Stateboy is ready to publish when:

- missing BetterDungeon/Ultrascripts produces a clear required warning;
- unavailable or unconfigured AI produces accurate API-key/module guidance;
- Widget-off produces a helpful advisory without blocking Stateboy;
- setup recovery happens automatically without resetting the adventure;
- AI receives substantially more context within a verified executor budget;
- expanded logs remain bounded and readable;
- add/remove settings and all three operations behave predictably;
- users can understand the shorthand directives from examples alone;
- legacy Stateboy cards continue to parse correctly;
- manual edits remain authoritative and do not create update loops;
- live AI, Widget, manual-edit, and failure-path tests pass; and
- the script, Guide card, contract reference, repository entry, and public
  release copy agree.

## Explicit Non-Goals

- replacing the Stateboy card with opaque script state;
- exposing or reading API keys;
- selecting provider-native models from Stateboy;
- allowing AI to create/remove/rename categories in the first release;
- implementing automatic undo UI;
- removing validation because the AI is trusted; or
- supporting a no-Ultrascripts mode as an equal product experience.

