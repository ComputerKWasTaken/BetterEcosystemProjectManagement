# Stateboy Implementation Roadmap

## Purpose

This roadmap turns the Stateboy direction into small implementation stages.
Each stage changes one coherent behavior, adds focused verification, and has an
exit gate. Do not begin the next stage until the current stage passes in the AI
Dungeon sandbox and its behavior is understandable from the Stateboy cards or
Widget.

The product decisions live in [Stateboy Direction and Implementation Plan](./stateboy.md).
This document owns sequencing only.

## Implementation Rules

- Keep `BetterRepository/src/data/raw-scripts/library/stateboy.js` as the
  implementation source of truth.
- Make one stage independently reviewable and revertible before starting the
  next.
- Add tests or sandbox fixtures in the same stage as the behavior they protect.
- Do not combine parser, AI schema, command, history, and lifecycle changes in
  one rewrite.
- Preserve the readable `Stateboy` card as the source of truth throughout.
- Keep ordinary story play working after every completed stage.
- Update the generated Settings and Guide cards whenever their owning behavior
  changes; do not postpone card documentation until final publication.
- Record any required BetterDungeon AI executor change as a separate dependency
  rather than hiding it inside Stateboy work.

## Stage Overview

| Stage | Deliverable | Status | Depends on |
|---|---|---|---|
| 0 | Baseline characterization and regression harness | Partial focused coverage | Current script |
| 1 | Required-mode setup assessment and warnings | Completed and live-verified | Stage 0 |
| 1A | Widget clarity and value-type guidance | Implemented locally; live verification pending | Stage 1 |
| 1B | Optimized Context compatibility | Implemented locally; live verification pending | Stage 1 |
| 1C | Turn grounding, story Context framing, and fixed changelog windows | Implemented locally; live verification pending | Stage 1B |
| 2 | Canonical directive cutover | Implemented locally; live verification pending | Stage 0 |
| 3 | Canonical Settings card | Pending | Stage 0 |
| 4 | Operation batches and inverse records | Pending | Stages 2-3 |
| 5 | AI add/remove operations | Pending | Stage 4 |
| 6 | Input command foundation and job coordinator | Pending | Stages 1, 4 |
| 7 | Undo and redo | Pending | Stage 6 |
| 8 | Automatic initial generation | Pending | Stage 6 |
| 9 | User-triggered generation | Pending | Stages 7-8 |
| 10 | Command-triggered cleanup | Pending | Stages 7, 9 |
| 11 | Expanded Context budget and logging | Pending | Stable feature set |
| 12 | Integrated verification and publication alignment | Pending | All stages |

## Stage 0: Characterize the Existing Script

Goal: establish a trustworthy baseline without changing product behavior.

Work:

- capture fixtures for settings parsing, state parsing, rendering, Context
  filtering, Widget filtering, AI validation, manual-edit detection, and
  changelog rendering;
- cover the current asynchronous request/response lifecycle;
- record representative Stateboy, Settings, Guide, heartbeat, AI response, and
  Widget cards;
- add a fixture that proves script writes do not appear as manual edits; and
- record the current behavior when heartbeat, AI, or Widget is unavailable.

Exit gate:

- the existing behaviors that must survive later stages have executable checks;
- failures identify which layer changed; and
- no intentional runtime behavior has changed.

## Stage 1: Required-Mode Warnings

Goal: replace silent feature loss with one structured setup assessment.

Work:

- add runtime, AI capability, AI readiness, and Widget availability states;
- request `ai.status` and safe SDK configuration as needed;
- add prioritized, deduplicated `state.message` and Context warnings;
- provide explicit BetterDungeon, Ultrascripts, AI-module, Gemini API-key, and
  Widget guidance;
- gate AI and Widget work from the assessment result; and
- preserve local card parsing and Context injection during setup failures.

Exit gate:

- every missing/disabled/unconfigured path produces the intended message;
- pending AI status does not produce a premature warning;
- repeated hooks do not spam the same warning; and
- restoring a capability clears its warning without resetting Stateboy.

## Stage 1A: Widget Clarity and Value-Type Guidance

Goal: make the existing state sheet understandable from Widget without opening
the source card.

Work:

- ensure every state widget visibly includes the state name;
- use distinct type-appropriate presentations for ratios, percentages,
  numbers, booleans, text, lists, objects, and nulls;
- assign stable per-state colors and add category dividers when the manifest
  limit leaves room;
- render empty text, lists, and objects explicitly instead of as blank UI;
- explain that JSON is notation which normalizes into real Stateboy types;
- bound names, content, list items, and the manifest to Widget's contract; and
- add focused fixtures checked against BetterDungeon's Widget validators.

Exit gate:

- every visible state can be identified without opening the Stateboy card;
- adjacent numeric states no longer all share one hard-coded color;
- empty lists and structured objects remain understandable;
- lowercase JSON booleans behave and document themselves as booleans;
- oversized sheets produce a valid bounded manifest; and
- the result passes live narrow/mobile Widget verification.

## Stage 1B: Optimized Context Compatibility

Goal: preserve immediate Stateboy Context injection when AI Dungeon uses a
cache-efficient model with Optimized Context enabled.

Work:

- place `// @cache-compatible` above the Stateboy Context modifier;
- preserve the complete incoming Context as the unchanged output prefix;
- keep state-sheet injection as an appended suffix;
- move required setup guidance into the appended suffix as well;
- avoid unnecessary behavior branches based on `info.useCacheEfficient`; and
- add a fixture covering the annotation, normal injection, and missing-setup
  warning path.

Exit gate:

- the annotation is in the exact position recognized by AI Dungeon;
- every Context return path either returns the input unchanged or begins with
  the complete original input;
- Optimized Context retains Stateboy's current-turn state injection;
- non-cache-efficient models retain their existing behavior; and
- the result passes live verification with Optimized Context both On and Off.

## Stage 1C: Turn Grounding, Context Framing, and Changelog Windows

Goal: ground both models more clearly while simplifying changelog settings.

Work:

- include the current AI Dungeon turn number in every ordinary updater prompt;
- wrap the story-model state sheet in a square-bracket editorial block;
- identify it as the world's current state and instruct the model to continue
  the story rather than continue or reproduce the sheet;
- retain suffix-only injection for Optimized Context compatibility;
- replace configurable changelog counts with a fixed 20-entry updater window
  and fixed 40-entry Notes window;
- remove the retired fields and stock help text from existing Settings cards;
  and
- add fixtures for turn grounding, bracket framing, window size, and migration.

Exit gate:

- the updater prompt reports the same turn used by Stateboy's request lifecycle;
- the story model receives one complete bracketed state reference;
- the original cache-efficient Context remains an unchanged prefix;
- exactly the newest 20 available changes are sent to the updater;
- legacy count fields no longer appear or influence behavior; and
- live story output continues prose instead of imitating the state sheet.

## Stage 2: Canonical Directive Cutover

Goal: replace the unpublished legacy syntax with the final flag system.

Work:

- remove the `widget:`, `context:`, and `ai:` directive contract;
- parse and render `hidden`, `visible`, `locked`, `unlocked`, `no-widget`,
  `widget`, `important`, and `temporary`;
- normalize flags into one resolved policy object;
- implement category inheritance and state overrides;
- treat `important` plus `temporary` as neither flag;
- expose unknown/conflicting flags only in Debug Mode; and
- rewrite the Guide card around concise examples.

At this stage, `important` and `temporary` may be parsed and rendered before all
of their later AI behaviors exist. Do not implement add/remove or cleanup here.

Exit gate:

- parse/render round trips are stable;
- Context and Widget visibility match the resolved policy;
- locked states retain current readonly behavior; and
- no legacy parser branch remains.

## Stage 3: Canonical Settings Card

Goal: make settings safe to render conditionally before adding new controls.

Work:

- define Stateboy as the owner of Settings card presentation;
- separate persisted setting values from the currently rendered fields;
- implement deterministic canonical rendering;
- preserve hidden setting values in script state;
- retain existing settings behavior; and
- add focused checks for user edits followed by canonical rewrite.

Do not add the new Add/Remove settings yet. This stage proves ownership and
conditional rendering independently.

Exit gate:

- parsing then rendering is stable;
- user changes survive the next hook;
- hidden values can be restored; and
- unrelated state/card content is untouched.

## Stage 4: Operation Batches and Inverse Records

Goal: create the mutation substrate needed by add/remove, undo, generation, and
cleanup without exposing new gameplay behavior.

Work:

- represent an ordinary AI response as one operation batch;
- route existing `set` changes through a shared validator and batch applier;
- record complete forward and inverse data for each accepted set;
- persist batches in a bounded 100-entry undo stack;
- clear redo data when a new AI batch or manual card edit branches the sheet;
- keep existing changelog output; and
- continue writing the Stateboy card once per accepted batch.

Do not add undo commands yet. The history can remain internal while its capture
and memory behavior are validated.

Exit gate:

- existing set behavior is unchanged;
- a multi-set response creates exactly one batch;
- inverse records reproduce the prior values in fixtures;
- no-op responses create no batch; and
- the oldest entry rolls off after 100 batches.

## Stage 5: AI Add and Remove

Goal: allow the ordinary updater to evolve the state-sheet shape.

Work:

- add `AI May Add States` and `AI May Remove States`, both defaulting On;
- conditionally show Add Confidence and Remove Confidence;
- add the always-visible Important Change Confidence;
- expand the ordinary AI schema to `set`, `add`, and `remove`;
- allow AI-created descriptions and temporary states;
- keep ordinary AI from creating important states;
- apply separate set/add/remove/important thresholds;
- reject removal of important states; and
- store complete inverse records for add and remove.

Exit gate:

- each operation works alone and in an ordered mixed batch;
- disabled operations are rejected without affecting allowed operations;
- conditional settings retain their hidden values;
- important-state protections hold; and
- one response still produces one undo batch and one card write.

## Stage 6: Command Foundation and Job Coordinator

Goal: introduce commands and explicit job state without implementing the
heavyweight jobs yet.

Work:

- add `src/data/raw-scripts/input/stateboy.js`;
- recognize `/stateboy` and `/sb` prefixes;
- implement `status` and `help` first;
- return `stop: true` for every recognized command;
- add ordinary, generation, and cleanup job kinds to persistent state;
- make only the current request id authoritative;
- ignore late responses from abandoned requests;
- let a new special command supersede an older special job;
- skip ordinary update requests while a special job is pending; and
- add regular-Widget thinking state for special jobs only.

Exit gate:

- commands never advance the story;
- unknown non-Stateboy input passes through normally;
- status accurately reports setup, state count, active job, and stack counts;
- abandoned responses cannot mutate the sheet; and
- ordinary background AI remains invisible outside Debug Mode.

## Stage 7: Undo and Redo

Goal: expose the internal batch history as simple recovery commands.

Work:

- implement `/stateboy undo [count]` and `/sb undo [count]`;
- implement matching redo commands;
- reverse/replay complete batches newest-first;
- skip individual inverse operations whose expected current value was changed
  manually;
- continue applying non-conflicting operations in the same batch;
- report applied and skipped counts;
- reject undo/redo while any AI job is pending; and
- clear redo after AI updates or manual edits.

Exit gate:

- single and multiple undo/redo work;
- requesting more batches than exist uses all available batches and reports the
  actual count;
- conflicts never overwrite manual corrections;
- partial reversal remains redoable in a predictable form; and
- card observation does not misclassify undo/redo writes as manual edits.

## Stage 8: Automatic Initial Generation

Goal: replace the static default state sheet with AI-generated scenario state.

Work:

- distinguish a scenario-supplied Stateboy card from an absent card;
- preserve every scenario-supplied sheet;
- create the exact waiting placeholder when absent;
- omit the placeholder from story Context;
- capture the compiled Context through the normal lifecycle;
- submit one high-thinking generation request;
- allow initial generation to create important and temporary states;
- exclude the initial sheet from undo history;
- keep story play moving while generation is pending; and
- on unavailable AI, failure, or timeout, stop retrying and direct the user to
  `/stateboy generate`.

Exit gate:

- custom scenario sheets never trigger generation;
- absent sheets generate once;
- no automatic retry loop exists;
- failure leaves an understandable card/message; and
- the generated sheet becomes the normal source of truth on a later hook.

## Stage 9: User-Triggered Generation

Goal: let the player deliberately replace the entire schema and recover it with
undo.

Work:

- implement `/stateboy generate` and `/sb generate`;
- do not include the previous Stateboy sheet in the generation prompt;
- allow the generated sheet to replace important states and all categories;
- store the prior and generated sheets as one reversible replacement batch;
- use high thinking and regular-Widget progress;
- do not block intervening story actions; and
- do not retry a failed request automatically.

Exit gate:

- the generated design is not biased by the old sheet;
- the entire replacement is one undo step;
- undo restores the former sheet and redo restores the generated sheet; and
- a newer special command safely supersedes the pending generation.

## Stage 10: Command-Triggered Cleanup

Goal: provide explicit, autonomous maintenance without a review workflow.

Work:

- implement `/stateboy cleanup` and `/sb cleanup`;
- send one separate medium-thinking request;
- request a complete proposed sheet;
- parse and structurally validate the candidate;
- diff the candidate against the current sheet;
- preserve every aspect of every important state;
- permit category and ordinary-state additions, removals, moves, renames,
  description changes, value reshaping, and temporary promotion;
- apply accepted cleanup immediately as one batch; and
- report a no-op without creating history.

Exit gate:

- cleanup is never automatic;
- it never enters a review state;
- important states are byte-equivalent in semantic content before and after;
- a cleanup batch can be undone and redone; and
- a no-op cleanup changes neither card nor history.

## Stage 11: Expanded Context and Logging

Goal: give the stable feature set substantially more evidence and history.

Work:

- coordinate and verify the BetterDungeon executor increase before relying on
  a prompt larger than 12,000 characters;
- read the advertised prompt limit from AI status;
- implement the 90% request budget and fallback limit;
- prioritize instructions, state sheet, latest output, compiled Context, and
  recent Stateboy changes;
- raise log caps, reason/summary lengths, and fixed changelog windows;
- raise the Notes budget only after live Story Card validation; and
- expose prompt size and truncation details in Debug Mode.

Exit gate:

- no request knowingly exceeds the advertised limit;
- large compiled Context is trimmed deterministically;
- the state sheet and response contract are never sacrificed for older context;
- logs roll over at their documented bounds; and
- ordinary, generation, and cleanup prompts each use the shared budget safely.

## Stage 12: Integrated Verification and Publication

Goal: prove the complete gameplay flow and align every published surface.

Work:

- run the complete setup, normal-play, command, failure, and recovery matrix;
- test long-running play with asynchronous responses arriving on later turns;
- test narrow/mobile Widget presentation;
- update the Stateboy Guide card and Script Contract Reference;
- update BetterRepository metadata and release copy;
- build BetterRepository and verify the public script copy/download; and
- publish only after live BetterDungeon verification succeeds.

Exit gate:

- every earlier stage remains green together;
- public documentation describes the actual script;
- the downloadable script matches the tested source;
- Stateboy is predictable with missing, unconfigured, delayed, and ready AI;
  and
- the dedicated Stateboy release gate in the main roadmap is complete.

## Change Discipline

For each stage:

1. begin from a passing previous-stage baseline;
2. implement only the named behavior;
3. run focused fixtures before broad integration tests;
4. live-test if the stage touches AI Dungeon lifecycle, Widget, or Ultrascripts;
5. update Settings/Guide text owned by that behavior;
6. review the diff for accidental cross-stage work; and
7. record the stage as complete before starting the next.

If a stage exposes a prerequisite defect, fix and verify that prerequisite as a
small stage amendment. Do not use it as permission to pull later features into
the same change.
