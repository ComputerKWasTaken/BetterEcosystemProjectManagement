# 08 - Snippet Review Checklist

> Review walkthrough for public Ultrascripts code snippets, copy-paste blocks, and starter examples.

## Purpose

Use this checklist whenever we add or change:

- `UltrascriptsQuickStartGuide.vue`
- `UltrascriptsCookbookGuide.vue`
- `UltrascriptsSdkGuide.vue`
- module guide snippets under `BetterRepository/src/components/guides/Ultrascripts*.vue`
- starter template code in BetterRepository or BetterDungeon

The goal is simple: every public snippet should be copy-paste-safe, conceptually
correct, and aligned with the shipped runtime.

## Walkthrough

### 1. Confirm the snippet's role

Before reviewing details, label the snippet correctly:

- `enhanced` if plain AI Dungeon still works without BetterDungeon
- `required` if the core flow depends on Ultrascripts
- `raw protocol` only if the snippet is intentionally teaching cards/wire format

If the snippet is not raw protocol, it should prefer the `bd.us.*` helper style.

### 2. Check copy-paste safety

Every code block intended for copy-paste must pass these checks:

- Copying the block must produce literal code, not HTML-escaped code.
- Do not leave `&amp;&amp;`, `&lt;`, `&gt;`, or similar escapes inside JS snippets that
  are copied from strings or JS data sources.
- The rendered block must use the boxed/scrollable/copy-button presentation.
- Long snippets must scroll vertically and horizontally without clipping text.
- The copy button must not shift the code content or hide the first lines.

If a snippet is stored in a JS string for rendering/copying, review the string
content itself, not just the browser-rendered result.

### 3. Check state vs runtime storage

Public snippets must never teach authors to store functions on serializable
state.

Rules:

- Runtime helpers belong on `globalThis.bd`, not `state.bd`.
- Persistent plain data can live on `state.*`.
- Do not assign functions to `state`.
- Do not teach patterns that can trigger clone/serialization failures.

Examples:

- good: `globalThis.bd = globalThis.bd || {};`
- good: `state.questTracker = state.questTracker || {};`
- bad: `state.bd.sendOpRequest = function () { ... }`

### 4. Check the live transport contract

Review against the current runtime contract:

- heartbeat discovery comes from `ultrascripts:heartbeat`
- module discovery comes from `heartbeat.modules`
- requests are written to `ultrascripts:out`
- request objects use `module`, not `moduleId`
- responses are read from `ultrascripts:in:<module>`
- response payloads are keyed objects under `responses`, not response arrays
- acks are sent through `acks`

If any snippet disagrees with the live card/envelope shape, fix it before
publication.

### 5. Check helper semantics

For `bd.us` snippets, verify the documented behavior matches the shipped helper
contract:

- `bd.us.tick()` reads responses and queues acks
- `bd.us.available()` means heartbeat is present
- `bd.us.has(module, op?)` checks mounted capability
- `bd.us.call()` queues the request for this turn
- `bd.us.latest()` returns the newest cached completed response
- `bd.us.commit()` writes queued requests/acks to `ultrascripts:out`

Do not describe `latest()` as undo-proof by itself. When freshness matters,
snippets should mention or check `completedLiveCount`.

### 6. Check module truth

For module-specific snippets:

- use the canonical module id
- use the canonical op names
- use the canonical request arg names
- read fields that actually exist in the live result shape
- do not teach deprecated aliases unless the snippet is explicitly about compatibility

Examples:

- teach `ai`, not `providerAI`
- teach `maxTokens`, not `max_tokens`
- teach `responseFormat`, not `response_format`
- read `clock.now.data.local` / `data.iso` / `data.time`, not invented fields

### 7. Check capability gating

Every snippet should communicate the right gating model:

- enhanced snippets gate optional behavior and keep plain AI Dungeon viable
- required snippets stop clearly when runtime or required modules are missing
- permissioned/configured modules must still check setup state

Examples:

- AI snippets should account for `sdk.config`
- geolocation snippets should account for permission state
- WebFetch snippets should respect consent and blocked-target constraints

### 8. Check turn timing

Snippets must respect the one-turn request/response rhythm:

- read previous results first
- queue new requests after that
- commit once at the end unless the example is intentionally showing a staged early return

If the snippet consumes a response in the same turn it queues it, that is
usually wrong unless the example is explicitly synthetic.

### 9. Check Scripture correctness

If the snippet publishes widgets:

- manifest is declared in the right place
- history is keyed by live count
- widget ids match between manifest and values
- event handling uses `scriptureEvents()` / ack flow correctly if shown
- the snippet does not imply widgets are command calls

### 10. Check public teaching quality

Public snippets should teach the paved path, not clever-but-fragile shortcuts.

Prefer:

- short helper-first snippets
- capability-checked flows
- plain names and comments
- examples that match the starter templates

Avoid:

- planning-era helpers
- obsolete runtime shapes
- raw card manipulation unless that is the point of the section
- unnecessary complexity that fights the Quick Start mental model

## Verification steps

When a snippet changes, run this verification pass:

1. Read the snippet in source form.
2. Check it against `07-example-contract-reference.md`.
3. Compare claims/field names with the live module/runtime code if the snippet
   is module-specific.
4. Open the relevant BetterRepository page and confirm the block renders inside
   the boxed, scrollable, copy-button treatment.
5. Copy the block and verify the pasted text is literal code.
6. If the snippet lives in BetterRepository, run `npm.cmd run build`.

## High-risk failure modes

These deserve an explicit final look before calling snippet work done:

- HTML escapes leaking into copied code
- functions being attached to `state`
- stale field names from older planning docs
- wrong request/response envelope shape
- snippets that skip capability/setup checks
- snippets that imply same-turn request completion
- code blocks that render correctly but copy incorrectly

## Minimum sign-off

A snippet update is not done until we can say:

- the snippet is copy-paste-safe
- the snippet matches the shipped runtime contract
- the snippet teaches the right enhanced/required posture
- the snippet uses the standard presentation pattern
- the BetterRepository build still passes
