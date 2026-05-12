# Frontier Docs

> Internal reference set for Frontier as it exists today in BetterDungeon.

## Read order

| # | File | What it covers |
|---|------|----------------|
| 00 | [Overview](./00-overview.md) | Big-picture Frontier summary and the current system shape |
| 01 | [Architecture](./01-architecture.md) | Runtime layers, transport, Core, modules, and data flow |
| 02 | [Modules](./02-modules.md) | Live module contract, shipped modules, and how to build new ones |
| 03 | [Implementation Status](./03-implementation-status.md) | What is shipped, what remains, and current roadmap direction |
| 04 | [Frontier Test Suites](./04-test-suites.md) | Active regression surfaces and current coverage gaps |
| 05 | [BetterDungeon SDK Roadmap](./05-betterdungeon-sdk-roadmap.md) | SDK direction, separation rules, and follow-through work |
| 06 | [Documentation Plan](./06-documentation-plan.md) | Internal/public documentation alignment plan |

### Archived

Completed phase plans and older sign-off artifacts live in [`archive/`](./archive/).

## One-paragraph summary

Frontier is BetterDungeon's cards-based runtime for AI Dungeon scripting. Scripts publish state through reserved story cards, BetterDungeon observes and reacts to that state, and ops-capable modules can answer requests back through the same card-driven request/response path. The current shipped module set is `scripture`, `webfetch`, `clock`, `sdk`, `geolocation`, `weather`, `network`, `system`, and `ai`. The runtime is unified, live-count-aware, and already implemented, with heartbeat as the one discovery surface for Frontier availability and `sdk` reserved for BetterDungeon-facing metadata like version and safe configuration context.

## Current status

The core Frontier runtime is shipped.

What remains is mostly:

- module polish and broader regression coverage
- documentation cleanup and public guide work
- showcase scripts
- multiplatform/mobile follow-through

The BetterDungeon SDK itself is now shipped and validated. The next Frontier target is broader module polish and test coverage.

## Doc rules

The active Frontier docs should:

- match the real codebase
- prefer current implementation truth over old planning residue
- treat Frontier as shipped infrastructure, not as a prototype
- avoid reviving deprecated ideas like Lite/profile splits

If a concept is only historical, archive it or remove it from the active set.
