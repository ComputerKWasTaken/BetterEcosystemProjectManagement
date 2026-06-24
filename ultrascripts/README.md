# Ultrascripts Internal Docs

Private planning and maintenance docs for Ultrascripts, the BetterDungeon
runtime that lets AI Dungeon scripts communicate both ways with BetterDungeon
through reserved Story Cards.

These docs are split by how maintainers actually use them:

- `reference/` contains stable facts about the runtime, modules, script
  contracts, SDK, and verification.
- `planning/` contains current work, roadmap, docs sync, and the active module
  quality pass.

## Current Truth

Ultrascripts core is effectively feature-complete. The AI module is complete:
it has its stable `status`/`query` contract, backend-agnostic executor, and
production backend path in place.

The active work is finish-line work:

- resync mobile with PC Ultrascripts behavior
- polish the mobile build for release
- refresh BetterRepository's Ultrascripts guides so public docs match the live
  Widget/SDK/template contract
- update BetterRepository V1.7 What's New and release wording
- keep the Enhanced and Required starter templates aligned with the live SDK
  helper contract
- build the three showcase scripts: Brainiac, Statboy, and Chronos V2
- upload the Firefox Add-ons version of BetterDungeon
- begin Reddit teasers, final bugfixes, and polish
- use those results to finish BetterDungeon V2 and BetterRepository V1.7 launch
  preparation

Completed finish-line work:

- Widget V2 polish pass

## Start Here

| Need | Open |
|---|---|
| What is true right now and what is next? | [Current Roadmap](./planning/current-roadmap.md) |
| How does the runtime work? | [Runtime Reference](./reference/runtime.md) |
| Which modules ship and what contract do they implement? | [Module System Reference](./reference/modules.md) |
| What should scripts/templates/examples assume? | [Script Contract Reference](./reference/script-contract.md) |
| What does the `sdk` module expose? | [BetterDungeon SDK Reference](./reference/sdk.md) |
| What should be tested or live-checked? | [Verification Reference](./reference/verification.md) |
| How do private docs, public docs, and templates stay synced? | [Documentation Sync Plan](./planning/docs-sync.md) |
| What is the active module polish checklist? | [Module Quality Pass](./planning/module-quality-pass.md) |

## Source Of Truth Map

Implementation source of truth:

- BetterDungeon runtime: `../../BetterDungeon/services/ultrascripts/`
- BetterDungeon modules: `../../BetterDungeon/modules/`
- BetterDungeon feature wrapper: `../../BetterDungeon/features/ultrascripts_feature.js`
- BetterDungeon popup/runtime settings: `../../BetterDungeon/popup.js`,
  `../../BetterDungeon/background.js`

Public docs source of truth:

- BetterRepository public guide components:
  `../../BetterRepository/src/components/guides/Ultrascripts*.vue`
- BetterRepository Ultrascripts info dump:
  `../../BetterRepository/docs/guides/info-dumps/ultrascripts.md`
- BetterRepository script catalog/templates:
  `../../BetterRepository/src/data/scripts.js`
  and `../../BetterRepository/src/data/raw-scripts/`

Live regression source of truth:

- Module suites: `../../BetterDungeon/tests/aid-scripts/`
- Author template foundations: `../../BetterDungeon/examples/aid-scripts/`

## Shipped Module Set

| Module | Type | Ops or state |
|---|---|---|
| `widget` | state | `ultrascripts:state:widget` |
| `webfetch` | ops | `fetch`, `search` |
| `clock` | ops | `now`, `tz`, `format` |
| `sdk` | ops | `version`, `config` |
| `geolocation` | ops | `permission`, `getCurrent` |
| `weather` | ops | `current`, `forecast` |
| `network` | ops | `status` |
| `system` | ops | `info`, `power` |
| `ai` | ops | `status`, `query` |

The `ai` module is complete and ships a stable asynchronous query contract.
Public docs should teach `ai.status`, `ai.query`, text output, schema-backed
JSON output, and the `not_configured` error shown when the player has not saved
an API key for the current backend setup.

## Doc Rules

- Treat Ultrascripts as shipped infrastructure, not a prototype.
- Prefer live code, public guide components, and current templates over old
  phase notes.
- Keep `reference/` stable unless an implementation contract changes.
- Keep `planning/` pointed at the current workstream.
- Treat BetterDungeon V2 and BetterRepository V1.7 as the paired release train.
- Do not revive retired concepts such as Lite/full profiles, mutation-template
  priming, invisible-text transport, or action-id-keyed Widget history.
- If an active doc starts explaining old planning debates at length, summarize
  the decision or move the material into a deliberately named historical file.
