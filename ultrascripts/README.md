# Ultrascripts Internal Docs

Private reference and maintenance docs for Ultrascripts, the BetterDungeon runtime that lets AI Dungeon scripts communicate with BetterDungeon through reserved Story Cards.

## What These Docs Are For

- `reference/` contains stable runtime facts, module contracts, SDK details, script contracts, and verification guidance.
- `planning/` contains focused maintenance notes and the current release roadmap.

Ultrascripts is shipped infrastructure for BetterDungeon V2, not an active construction project. Keep these documents aligned with the implementation and public BetterRepository guides.

## Current Release Context

BetterDungeon V2 and its eight first-party modules are released. Ultrascripts
is now a stable dependency for the remaining BetterEcosystem release sequence:

1. Polish and release BetterRepository V1.7.
2. Polish, verify, and publish Stateboy.
3. Build, verify, and publish Brainiac.
4. Build, verify, and publish Chronos V2.
5. Complete final documentation alignment and close this project era.

The current stage is BetterRepository V1.7. Stateboy has an existing
implementation but is not public yet. Brainiac and Chronos V2 remain sequential
future stages, not parallel work.

## Start Here

| Need | Open |
|---|---|
| What is true right now and what is next? | [Current roadmap](./planning/current-roadmap.md) |
| How does the runtime work? | [Runtime reference](./reference/runtime.md) |
| Which modules ship and what contracts do they implement? | [Module system reference](./reference/modules.md) |
| What should scripts and templates assume? | [Script contract reference](./reference/script-contract.md) |
| What does `sdk` expose? | [BetterDungeon SDK reference](./reference/sdk.md) |
| What should be tested or live-checked? | [Verification reference](./reference/verification.md) |
| How do private docs and public docs stay aligned? | [Documentation sync plan](./planning/docs-sync.md) |
| What module polish is still worth tracking? | [Module quality pass](./planning/module-quality-pass.md) |

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

Regression and author examples:

- Module suites: `../../BetterDungeon/tests/aid-scripts/`
- Starter templates: `../../BetterDungeon/examples/aid-scripts/`

## Shipped Module Set

| Module | Type | Ops or state |
|---|---|---|
| `widget` | state | `ultrascripts:state:widget` |
| `webfetch` | ops | `fetch`, `search` |
| `clock` | ops | `now`, `tz`, `format` |
| `sdk` | ops | `version`, `config` |
| `weather` | ops | `current`, `forecast` |
| `network` | ops | `status` |
| `system` | ops | `info`, `power` |
| `ai` | ops | `status`, `query` |

The AI module exposes a stable asynchronous `status`/`query` contract with text output, schema-backed JSON output, and clear `not_configured` handling.

## Documentation Rules

- Treat Ultrascripts as shipped infrastructure.
- Prefer live code, public guide components, and current templates over old phase notes.
- Keep `reference/` stable unless an implementation contract changes.
- Keep `planning/` focused on active work rather than completed milestones.
- Do not revive retired concepts such as Lite/full profiles, mutation-template priming, invisible-text transport, or action-id-keyed Widget history.
- If a planning document starts explaining an old debate at length, summarize the decision or move the history into a deliberately named archive later.
