# Ultrascripts Internal Docs

Private planning and maintenance docs for Ultrascripts, the BetterDungeon
runtime that lets AI Dungeon scripts communicate both ways with BetterDungeon
through reserved Story Cards.

These docs are for BetterEcosystem maintainers. Public author-facing docs live
in BetterRepository.

## Current Truth

Ultrascripts is effectively feature-complete. The core runtime, two-way
request/response protocol, write path, module registry, popup integration,
mobile follow-through, public BetterRepository docs, and all 9 first-party
modules are shipped.

The active work is now finish-line work:

- improve the shipped modules where that makes real scripts better
- keep the Enhanced and Required starter templates aligned with the live SDK
  helper contract
- build the three showcase scripts: Brainiac, Statboy, and Chronos V2
- use those results to finish BetterDungeon V2 and BetterRepository V2 launch
  preparation

## Read Order

| # | File | Job |
|---|---|---|
| 00 | [Overview](./00-overview.md) | Product-level explanation, boundaries, shipped surface, and mental model |
| 01 | [Architecture](./01-architecture.md) | Runtime layers, transport, write path, heartbeat, ops, and BetterDungeon integration |
| 02 | [Modules](./02-modules.md) | Module inventory, module contract, context API, lifecycle, and extension rules |
| 03 | [Implementation Status](./03-implementation-status.md) | What is done, what remains, release path, and out-of-scope work |
| 04 | [Verification And Test Suites](./04-test-suites.md) | Regression surfaces, live suite inventory, and when to run what |
| 05 | [BetterDungeon SDK Spec](./05-betterdungeon-sdk-spec.md) | Production contract for the `sdk` module and its `version`/`config` ops |
| 06 | [Documentation Sync](./06-documentation-plan.md) | How private docs, public BetterRepository guides, templates, and examples stay aligned |
| 07 | [Example Contract Reference](./07-example-contract-reference.md) | Script-side protocol rules, helper expectations, module call shapes, and showcase guardrails |
| 08 | [Module Quality Pass](./08-module-quality-pass.md) | Active module polish checklist before Brainiac, Statboy, and Chronos V2 |

Archived phase plans and old sign-off artifacts live in [archive/](./archive/).
They are historical evidence, not current direction.

## Source Of Truth Map

Implementation source of truth:

- BetterDungeon runtime: `../../BetterDungeon/services/ultrascripts/`
- BetterDungeon modules: `../../BetterDungeon/modules/`
- BetterDungeon feature wrapper: `../../BetterDungeon/features/ultrascripts_feature.js`
- BetterDungeon popup/runtime settings: `../../BetterDungeon/popup.js`, `../../BetterDungeon/background.js`

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
| `scripture` | state | `ultrascripts:state:scripture` |
| `webfetch` | ops | `fetch`, `search` |
| `clock` | ops | `now`, `tz`, `format` |
| `sdk` | ops | `version`, `config` |
| `geolocation` | ops | `permission`, `getCurrent` |
| `weather` | ops | `current`, `forecast` |
| `network` | ops | `status` |
| `system` | ops | `info`, `power` |
| `ai` | ops | `chat`, `models`, `testConnection` |

The `ai` module also accepts the legacy alias `providerAI`. Public docs should
teach `ai`.

## Doc Rules

- Treat Ultrascripts as shipped infrastructure, not a prototype.
- Prefer live code, public guide components, and current templates over old
  phase notes.
- Keep private docs focused on maintenance direction and decisions.
- Keep public docs focused on scenario authors and developers learning the
  system.
- Do not revive retired concepts such as Lite/full profiles, mutation-template
  priming, invisible-text transport, or action-id-keyed Scripture history.
- If an active doc starts explaining old planning debates at length, either
  move that material to `archive/` or summarize it as a settled decision.
