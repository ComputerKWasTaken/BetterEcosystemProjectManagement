# Ultrascripts Internal Docs

Private reference and maintenance docs for Ultrascripts, the BetterDungeon runtime that lets AI Dungeon scripts communicate with BetterDungeon through reserved Story Cards.

## What These Docs Are For

- `reference/` contains stable runtime facts, module contracts, SDK details,
  script contracts, and verification guidance.
- `design/` contains detailed product and technical designs, including
  approved behavior and clearly marked future candidates.
- `planning/` contains the current roadmap and active release plan.
- `releases/` contains concise records of shipped releases.

Ultrascripts shipped with BetterDungeon V2 and was expanded in v2.1. BetterDungeon
v2.1 and its release work are complete and published. Keep these references
aligned with the live implementation and public BetterRepository guides during
maintenance and future scoped work.

## Current Project Status

BetterDungeon V2 and v2.1 are released. The v2.1 expansion shipped on browser
and Android, which now share one monorepo and automated quality gate. Chronos
V2 also shipped independently. Stateboy is the active unpublished release
project; the Brainiac prototype is next to reassess after Stateboy.

## Start Here

| Need | Open |
|---|---|
| What is the current project sequence? | [Project roadmap](./planning/README.md) |
| What shipped in BetterDungeon v2.1? | [Release record](./releases/betterdungeon-v2.1.md) |
| What shipped in the Chronos weather update? | [Release record](./releases/chronos-weather.md) |
| How does the runtime work? | [Runtime reference](./reference/runtime.md) |
| Which modules ship and what contracts do they implement? | [Module system reference](./reference/modules.md) |
| What should scripts and templates assume? | [Script contract reference](./reference/script-contract.md) |
| What does `sdk` expose? | [BetterDungeon SDK reference](./reference/sdk.md) |
| What does the Audio module accept? | [Audio module reference](./reference/audio.md) |
| What should be tested or live-checked? | [Verification reference](./reference/verification.md) |
| What is Stateboy's release plan? | [Stateboy release plan](./planning/stateboy.md) |
| What does Stateboy do and how is it designed? | [Stateboy design](./design/stateboy-design.md) |

## Source-of-Truth Map

Implementation:

- BetterDungeon runtime: `../../BetterDungeon/services/ultrascripts/`
- BetterDungeon modules: `../../BetterDungeon/modules/`
- BetterDungeon feature wrapper: `../../BetterDungeon/features/ultrascripts_feature.js`
- BetterDungeon settings/runtime: `../../BetterDungeon/popup.js`, `../../BetterDungeon/background.js`

Public documentation:

- BetterRepository guide components: `../../BetterRepository/src/components/guides/Ultrascripts*.vue`
- BetterRepository info dump: `../../BetterRepository/docs/guides/info-dumps/ultrascripts.md`
- BetterRepository scripts/templates: `../../BetterRepository/src/data/scripts.js` and `../../BetterRepository/src/data/raw-scripts/`

Verification and author examples:

- The deliberately small automated baseline: `../../BetterDungeon/tests/smoke/`
- Starter templates: `../../BetterDungeon/examples/aid-scripts/`
- Browser and AI Dungeon behavior is checked manually. A comprehensive live
  automation framework is deliberately outside the current project plan.

## Shipped Module Set

| Module | Type | Ops or state |
|---|---|---|
| `widget` | state | `ultrascripts:state:widget` |
| `webfetch` | ops | `fetch` |
| `clock` | ops | `now`, `tz`, `format` |
| `sdk` | ops | `version`, `config` |
| `weather` | ops | `current`, `forecast` |
| `network` | ops | `status` |
| `system` | ops | `info`, `power` |
| `ai` | ops | `status`, `query` |
| `audio` | state | `ultrascripts:state:audio` |

The V2 AI module exposes a stable asynchronous `status`/`query` contract with
text output, schema-backed JSON output, and clear `not_configured` handling.
Audio is the ninth shipped module and uses a bounded state-driven synthesizer
contract. Arbitrary JavaScript execution is deferred and is not part of the
V2.1 module set.

## Documentation Rules

- Treat the V2 and V2.1 contracts as shipped infrastructure.
- Keep current priority in the [management hub](../ProjectManagement.md) and
  active sequence in `planning/README.md`.
- Keep release records in `releases/`, not in active planning.
- Keep completed implementation history out of `planning/`. Stable shipped
  behavior belongs in `reference/`; product designs may record current
  contracts and separately mark future candidates.
- Prefer live code, public guide components, and current templates over old phase notes.
- Keep `reference/` stable unless an implementation contract changes.
- Keep `planning/` concise and limited to current priorities and active release
  work.
- Do not revive retired concepts such as Lite/full profiles, mutation-template priming, invisible-text transport, or action-id-keyed Widget history.
- If a planning document starts explaining an old debate at length, keep the
  settled decision and remove the superseded discussion.
