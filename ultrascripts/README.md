# Ultrascripts Docs

> Internal reference set for Ultrascripts as it exists today in BetterDungeon.

## Read order

| # | File | What it covers |
|---|------|----------------|
| 00 | [Overview](./00-overview.md) | Big-picture Ultrascripts summary and the current system shape |
| 01 | [Architecture](./01-architecture.md) | Runtime layers, transport, Core, modules, and data flow |
| 02 | [Modules](./02-modules.md) | Live module contract, shipped modules, and how to build new ones |
| 03 | [Implementation Status](./03-implementation-status.md) | What is shipped, what remains, and current roadmap direction |
| 04 | [Ultrascripts Test Suites](./04-test-suites.md) | Active regression surfaces and per-module coverage |
| 05 | [BetterDungeon SDK Spec](./05-betterdungeon-sdk-spec.md) | Complete SDK specification, ops schemas, and scripting patterns |
| 06 | [Documentation Plan](./06-documentation-plan.md) | Internal/public documentation alignment plan |
| 07 | [Example Contract Reference](./07-example-contract-reference.md) | Public example guardrails and live module contract quick checks |
| 08 | [Module Quality Pass](./08-module-quality-pass.md) | Final module-by-module polish checklist before Brainiac, Statboy, and Chronos V2 |

### Archived

Completed phase plans and older sign-off artifacts live in [`archive/`](./archive/).

## One-paragraph summary

Ultrascripts is BetterDungeon's cards-based runtime for AI Dungeon scripting. Scripts publish state through reserved story cards, BetterDungeon observes and reacts to that state, and ops-capable modules can answer requests back through the same card-driven request/response path. The current shipped module set is `scripture`, `webfetch`, `clock`, `sdk`, `geolocation`, `weather`, `network`, `system`, and `ai`. The runtime is unified, live-count-aware, and already implemented, with heartbeat as the one discovery surface for Ultrascripts availability and `sdk` reserved for BetterDungeon-facing metadata like version and safe configuration context.

## Current status

The core Ultrascripts runtime is shipped. All 9 first-party modules are implemented, live-tested, documented publicly in BetterRepository, and covered by dedicated regression test suites in `tests/aid-scripts/`.

What remains is:

- keep the standard SDK-based Enhanced and Required template foundation aligned with implementation changes
- complete the module quality pass, starting with Scripture and WebFetch
- build the three showcase scripts after module polish: Brainiac, Statboy, and Chronos V2
- sync BetterDungeon mobile with the PC codebase before launch prep

## Doc rules

The active Ultrascripts docs should:

- match the real codebase
- prefer current implementation truth over old planning residue
- treat Ultrascripts as shipped infrastructure, not as a prototype
- avoid reviving deprecated ideas like Lite/profile splits

If a concept is only historical, archive it or remove it from the active set.
