# Module Quality Pass

## Purpose

This is the active finish-line pass before Brainiac, Statboy, and Chronos V2.
The AI module is complete enough for V2. The active work is Scripture.

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

### 1. Scripture

Goal: make Scripture lighter, clearer, and stronger on mobile.

Current review targets:

- renderer/helper bloat
- desktop widget layout
- mobile and narrow widget layout
- compact/normal/comfortable/large display sizes
- short/medium/tall max-height behavior
- balanced/stacked layout behavior
- long labels and long values
- scrolling behavior
- interactive widget affordances
- widget-event queue and pruning
- `interactions.ackSeq` helper alignment
- public widget examples
- starter template dashboard publishing

Likely showcase needs:

- Brainiac status/dashboard widgets
- Statboy stat bars/counters/tags
- Chronos V2 time/weather widgets

Scripture exit:

- no obvious UI bloat or awkward defaults
- mobile and narrow layouts feel intentional
- helper examples match current interaction behavior
- Scripture regression suite remains representative
- public Scripture guide still matches the live widget contract

### 2. Supporting Follow-Ons

After Scripture, review only the modules needed by the showcase scripts:

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
| Brainiac | AI, Scripture, SDK |
| Statboy | AI, Scripture, SDK |
| Chronos V2 | Scripture, Clock, Weather, Geolocation, SDK as needed |

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

- Scripture is polished enough for public showcase widgets
- Scripture mobile and narrow-layout behavior feels solid
- any touched module suite still reflects real author usage
- Enhanced and Required templates remain aligned
- public BetterRepository guides still match changed contracts
- the next task can cleanly move to Brainiac, Statboy, and Chronos V2

## Do Not Let This Pass Expand Into

- new runtime architecture
- broad AI provider expansion
- a public debugger/inspector project
- third-party module marketplace work
- full TypeScript migration
- rewrites of unrelated BetterDungeon features

Those can be future projects. The current target is a clean V2 launch path.
