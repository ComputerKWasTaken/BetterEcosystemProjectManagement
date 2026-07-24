# Module Quality and Showcase Readiness

## Purpose

The BetterDungeon V2 module-quality pass is complete. This document now defines
small, showcase-driven maintenance gates for the final release sequence.

Ultrascripts is shipped infrastructure, not an active redesign project. A module
change should be accepted only when it improves the current release stage,
corrects a confirmed defect, or restores documentation/test alignment.

The release order lives in [Current Roadmap](./current-roadmap.md).

## Current Stage

BetterRepository V1.7 is active.

Module work during this stage is limited to:

- correcting public guide or info-dump inaccuracies
- keeping Enhanced and Required templates aligned
- fixing a regression that makes a documented V2 capability false
- removing stale public references to retired capabilities

Stateboy, Brainiac, and Chronos-specific enhancements do not belong in the V1.7
stage unless V1.7 already makes a concrete claim that must be corrected.

## Showcase Readiness Matrix

| Release | Relevant surfaces | Current status |
|---|---|---|
| BetterRepository V1.7 | All eight module guides, templates, metadata | Active documentation/build verification |
| Stateboy | AI, Widget, SDK, Required gating | Existing implementation; polish and publication pending |
| Brainiac | AI, Widget, SDK, card write safety | Planned after Stateboy |
| Chronos V2 | Clock, Weather, Widget, SDK | Planned after Brainiac |

## Standard Review Questions

For any touched module:

- Does the live API match the public guide?
- Does it match [Script Contract Reference](../reference/script-contract.md)?
- Does it degrade cleanly when disabled, unsupported, unconfigured, or offline?
- Are errors stable and branchable?
- Are response fields useful and naturally named?
- Does mobile/narrow behavior hold where relevant?
- Does the regression suite represent real author usage?
- Is the change required for the current release stage?

## Stage-Specific Gates

### BetterRepository V1.7

- The eight-module inventory is consistent everywhere.
- Public examples match released behavior.
- Templates and downloadable copies remain synchronized.
- No unpublished showcase is labeled as shipped.

### Stateboy

- Required-mode gating is clear.
- AI configuration failures leave manual behavior usable.
- Widget and debug/status surfaces remain readable on narrow screens.
- Manual edits do not create no-op update loops.
- Public documentation matches the exact published script.

### Brainiac

- AI JSON is validated before card writes.
- Card changes are bounded, observable, and recoverable.
- AI-unavailable behavior is non-destructive.
- Widget/SDK surfaces explain status rather than add decorative complexity.

### Chronos V2

- Base timekeeping works without BetterDungeon.
- Clock and Weather enhancement paths are optional.
- Place-name and coordinate weather flows are documented and tested.
- Weather failures do not block core scenario behavior.
- Timezone and formatting behavior is stable.

## Review Result Format

Record each review as:

- `No change needed`
- `Docs/example fix only`
- `Small implementation fix`
- `Regression suite update`
- `Blocked by showcase decision`

For accepted fixes, capture:

- what changed
- why the current release needs it
- which suite/template/public guide was checked
- whether the script contract reference changed

## Scope Guardrails

Do not expand a showcase review into:

- new runtime architecture
- broad AI provider expansion
- public debugger/inspector work
- third-party module marketplace work
- full TypeScript migration
- unrelated BetterDungeon feature rewrites

Those remain parked through era closeout.
