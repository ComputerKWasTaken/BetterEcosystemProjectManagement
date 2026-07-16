# Module Quality Pass

## Purpose

This document records the completed Ultrascripts usefulness pass and the small
maintenance checks that remain relevant to the BetterDungeon V2 launch. The AI
module and Widget polish pass are complete, Stateboy is built, and Brainiac and
Chronos V2 are deferred until after release.

The active release work is tracked in [Current Roadmap](./current-roadmap.md).

Ultrascripts already works. This pass is not a redesign. It is a usefulness
review: make sure the shipped modules, examples, and docs feel good enough for
real public scripts.

## Current Strategy

Work from the script and player experience backward.

Ask:

- What would a scenario author actually build?
- Which fields and helpers would they really use?
- Which UI states would players see first?
- What would feel clumsy on mobile?
- What can be trimmed without weakening the contract?

Fix only the issues that materially improve real script quality.

## Active Priority

### 1. Widget - Complete

Goal: make Widget lighter, clearer, and stronger on mobile.

Completed review targets:

- renderer/helper bloat
- desktop widget layout
- mobile and narrow widget layout
- automatic density behavior
- automatic max-height and scrolling behavior
- long labels and long values
- scrolling behavior
- interactive widget affordances
- widget-event queue and pruning
- `interactions.ackSeq` helper alignment
- public widget examples
- starter template dashboard publishing

Likely showcase needs are covered for V2 and future post-V2 scripts:

- Stateboy state bars/counters/tags
- Brainiac status/dashboard widgets (post-V2)
- Chronos V2 time/weather widgets (post-V2)

Widget exit result:

- no obvious UI bloat or awkward defaults remain in the V2 pass
- mobile and narrow layouts feel intentional, with a local minimize control
- helper examples match current interaction behavior
- Widget regression suite remains representative
- public Widget guide still matches the live widget contract
- the mobile build can inherit the same behavior without special-case docs

### 2. Supporting Follow-Ons

The Widget pass is complete. Keep only these maintenance checks visible:

- BetterRepository V1.7 Ultrascripts guide and copy accuracy
- `sdk` gating, display hints, and template alignment
- `clock`, `weather`, and `geolocation` readiness for future Chronos V2
- `ai` maintenance if docs or examples drift from the shipped contract
- `webfetch`, `system`, and `network` maintenance if a post-V2 script needs them

## Standard Review Questions

For any touched module:

- Does the live API match the public guide?
- Does the live API match [Script Contract Reference](../reference/script-contract.md)?
- Does it degrade cleanly when disabled, unsupported, denied, unconfigured, or offline?
- Are errors stable and branchable?
- Are response fields named the way authors naturally expect?
- Does mobile/narrow behavior hold where relevant?
- Does the regression suite still represent real author usage?
- Does the result feel good in a real script, not just in a test harness?

## Showcase Readiness Matrix

| Script | Required module polish before build |
|---|---|
| Stateboy | Done: AI, Widget, SDK |
| Brainiac | AI, Widget, SDK (post-V2) |
| Chronos V2 | Widget, Clock, Weather, Geolocation, SDK as needed (post-V2) |

## Release-Path Order

The paired launch follows the [Current Roadmap](./current-roadmap.md):

1. Polish and verify BetterRepository V1.7.
2. Upload BetterDungeon to Firefox Add-ons.
3. Continue Reddit teasers, final bugfixes, and launch polish.
4. Release BetterDungeon V2 and BetterRepository V1.7.
5. Build Brainiac and Chronos V2 after the release.

## Output Format For Each Review

Record the result as one of:

- `No change needed`
- `Docs/example fix only`
- `Small implementation fix`
- `Regression suite update`
- `Blocked by showcase decision`

For accepted fixes, capture:

- what changed
- why it matters for real scripts
- which suite/template/public guide was checked
- whether [Script Contract Reference](../reference/script-contract.md)
  needs an update

## Exit Criteria

This pass is done when:

- Widget is polished enough for public showcase widgets
- Widget mobile and narrow-layout behavior feels solid
- PC/mobile Ultrascripts behavior is resynced
- the mobile build has had a release-readiness polish pass
- any touched module suite still reflects real author usage
- Enhanced and Required templates remain aligned
- public BetterRepository guides still match changed contracts
- BetterRepository V1.7 release wording reflects the current public feature set
- the next task can cleanly move into V2 release prep, with Brainiac and Chronos
  V2 as post-V2 work

## Do Not Let This Pass Expand Into

- new runtime architecture
- broad AI provider expansion
- a public debugger/inspector project
- third-party module marketplace work
- full TypeScript migration
- rewrites of unrelated BetterDungeon features

Those can be future projects. The current target is a clean V2 launch path.
