# Module Quality Pass

## Purpose

This is the active finish-line pass before Brainiac, Statboy, and Chronos V2.
The AI module is currently reopened as a rebuild, so it leads the pass.

Ultrascripts already works. This pass is not a redesign and not another proof
that the runtime exists. It is a usefulness review: make sure each shipped
module is polished enough to carry real public showcase scripts.

## Current Strategy

Work from the script experience backward.

Ask:

- What would a scenario author try to build?
- Which module result fields would they actually read?
- Which errors would they need to branch on?
- Which UI states would players see?
- Which setup/fallback paths would be embarrassing in a public showcase?

Fix only the issues that materially improve real script quality.

## Active Priority

Finish the AI module rebuild first, then Scripture.

Reason:

- Brainiac and Statboy both depend on a real AI contract.
- Scripture is the most player-visible Ultrascripts module.
- Chronos V2 benefits from widgets but must remain Enhanced, not Required.
- If Scripture feels rough, Ultrascripts feels rough even when the protocol is
  technically correct.

## Working Order

| Order | Module | Why |
|---:|---|---|
| 1 | `ai` | Brainiac/Statboy core capability; Phase 1 status/query contract is in place |
| 2 | `scripture` | Player-visible widgets and interactions |
| 3 | `sdk` | Required/Enhanced gating and AI setup checks |
| 4 | `clock` | Chronos V2 time base |
| 5 | `weather` | Chronos V2 real-world sync |
| 6 | `geolocation` | Optional Chronos V2 location path |
| 7 | `webfetch` | Consent/error-heavy examples if needed |
| 8 | `system` | Layout/device hints |
| 9 | `network` | Fallback hints |

This order can shift if a showcase script exposes a concrete need.

## Standard Review Questions

For each module:

- Does the live API match the public guide?
- Does the live API match [Script Contract Reference](../reference/script-contract.md)?
- Does the module degrade cleanly when disabled?
- Does it degrade cleanly when unsupported, denied, unconfigured, offline, or
  rate-limited?
- Are errors stable and branchable?
- Are response fields named the way authors naturally expect?
- Does the module avoid leaking credentials or private browser state?
- Does the regression suite still represent real author usage?
- Does the result feel good in a real script, not just in a test harness?

## Per-Module Targets

### Scripture

Current focus: active.

Review:

- desktop widget layout
- mobile/narrow widget layout
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

Exit:

- no obvious awkward default styling
- helper examples match current interaction behavior
- Scripture regression suite remains representative
- public Scripture guide still matches the widget contract

### AI

Review:

- status/query contract shape
- text and JSON output-mode behavior
- backend-pending `not_configured` messaging
- heartbeat exposes `status` and `query`
- SDK/public docs do not imply a configured backend
- no previous-provider, banned native-generation, or alias traces in active docs
- clear setup messaging for Required scripts after rebuild

Likely showcase needs:

- Brainiac card planning/updating
- Statboy structured stat-update proposals

Exit:

- a policy-safe generation backend exists
- public examples never assume paid models
- public examples never assume same-turn responses
- Brainiac/Statboy can validate and branch on AI outcomes cleanly

### SDK

Review:

- `sdk.config` shape against public guide examples
- heartbeat versus SDK responsibility separation
- AI config fields used by Brainiac/Statboy
- Scripture display fields used by widget examples
- Required script gating patterns

Exit:

- Enhanced/Required templates still use the helper contract correctly
- no example uses SDK config as live module discovery

### Clock

Review:

- `now`, `tz`, and `format` for Chronos V2 needs
- local/ISO/date/time field clarity
- timezone aliases (`timeZone`/`tz`)
- `format` return shape as a plain string

Exit:

- Chronos V2 can use Clock without custom date parsing noise
- public examples do not read stale fields like `data.now`

### Weather

Review:

- fixed-place flow
- coordinate flow
- metric/imperial units
- current-condition fields
- forecast day fields
- geocoding failure and timeout behavior

Exit:

- Chronos V2 can support both fixed place and optional location sync
- errors are clear enough to fall back to vanilla timekeeping/weather text

### Geolocation

Review:

- `permission` first
- denied/prompt/unavailable handling
- `getCurrent` timeout and accuracy args
- field names: `latitude`, `longitude`, `accuracy`, `permissionState`

Exit:

- Chronos V2 can make location optional and respectful
- public examples do not make geolocation feel mandatory

### WebFetch

Review:

- consent prompts
- denied-origin behavior
- rate-limit errors
- timeout errors
- blocked private/local target errors
- body truncation and header reporting
- `search` result usefulness

Exit:

- examples branch cleanly on consent/error outcomes
- no public example teaches unsafe methods or request bodies

### System

Review:

- `deviceClass`
- platform/browser fields
- screen fields for layout decisions
- power support/unsupported behavior
- mobile versus desktop hints

Exit:

- examples use System for adaptation, not brittle gating

### Network

Review:

- online/offline branch
- quality field
- browsers without Network Information API
- connection hint naming

Exit:

- examples treat Network as best-effort fallback information

## Showcase Readiness Matrix

| Script | Required module polish before build |
|---|---|
| Brainiac | AI, Scripture, SDK |
| Statboy | AI, Scripture, SDK |
| Chronos V2 | Scripture, Clock, Weather, Geolocation, SDK as needed |

WebFetch, Network, and System should be reviewed if a showcase script uses them
directly or if their public docs/examples are touched during the work.

## Output Format For Each Module Review

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

- AI is rebuilt enough for Brainiac and Statboy
- Scripture is polished enough for public showcase widgets
- SDK is ready for Brainiac and Statboy
- Clock/Weather/Geolocation are ready for Chronos V2
- any touched module suite still reflects real author usage
- Enhanced and Required templates remain aligned
- public BetterRepository guides still match changed contracts
- the next task can cleanly move to Brainiac, Statboy, and Chronos V2

## Do Not Let This Pass Expand Into

- new runtime architecture
- a third-party module marketplace
- full TypeScript migration
- a public debugger/inspector project
- broad AI provider expansion
- rewrites of unrelated BetterDungeon features

Those can be future projects. The current target is a clean V2 launch path.
