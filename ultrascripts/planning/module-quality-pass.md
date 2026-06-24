# Module Quality Pass

## Purpose

This is the active finish-line pass before mobile parity, BetterRepository V1.7
docs polish, and the Brainiac/Statboy/Chronos V2 showcase scripts. The AI
module is complete enough for V2, and the Widget polish pass is complete.
The active work is now PC/mobile Ultrascripts parity and release prep.

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

Likely showcase needs are covered for V2:

- Brainiac status/dashboard widgets
- Statboy stat bars/counters/tags
- Chronos V2 time/weather widgets

Widget exit result:

- no obvious UI bloat or awkward defaults remain in the V2 pass
- mobile and narrow layouts feel intentional, with a local minimize control
- helper examples match current interaction behavior
- Widget regression suite remains representative
- public Widget guide still matches the live widget contract
- the mobile build can inherit the same behavior without special-case docs

### 2. Supporting Follow-Ons

After Widget, review only the areas needed for the launch path:

- PC/mobile Ultrascripts parity and mobile build release polish
- BetterRepository V1.7 Ultrascripts guide/copy refresh
- `sdk` for gating, display hints, and template alignment
- `clock`, `weather`, and `geolocation` for Chronos V2
- `ai` only for maintenance if docs/examples drift from the shipped contract
- `webfetch`, `system`, and `network` only if a showcase script truly needs them

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
| Brainiac | AI, Widget, SDK |
| Statboy | AI, Widget, SDK |
| Chronos V2 | Widget, Clock, Weather, Geolocation, SDK as needed |

## Release-Path Order

1. Resync mobile with PC Ultrascripts behavior.
2. Polish the mobile build for release.
3. Refresh BetterRepository Ultrascripts guides.
4. Update BetterRepository V1.7 What's New and release wording.
5. Build Brainiac, Statboy, and Chronos V2.
6. Upload Firefox Add-ons version.
7. Begin Reddit teasers, final bugfixes, and polish.
8. Release BetterDungeon V2 and BetterRepository V1.7.

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
- the next task can cleanly move through the showcase scripts and release prep

## Do Not Let This Pass Expand Into

- new runtime architecture
- broad AI provider expansion
- a public debugger/inspector project
- third-party module marketplace work
- full TypeScript migration
- rewrites of unrelated BetterDungeon features

Those can be future projects. The current target is a clean V2 launch path.
