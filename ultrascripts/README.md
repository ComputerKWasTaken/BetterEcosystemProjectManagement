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
| 08 | [Snippet Review Checklist](./08-snippet-review-checklist.md) | Review walkthrough for copy-paste snippets, starter examples, and code blocks |
| 09 | [Snippet Verification Checklist](./09-snippet-verification-checklist.md) | Priority-sorted manual checklist of public Ultrascripts snippets to verify |

### Archived

Completed phase plans and older sign-off artifacts live in [`archive/`](./archive/).

## One-paragraph summary

Ultrascripts is BetterDungeon's cards-based runtime for AI Dungeon scripting. Scripts publish state through reserved story cards, BetterDungeon observes and reacts to that state, and ops-capable modules can answer requests back through the same card-driven request/response path. The current shipped module set is `scripture`, `webfetch`, `clock`, `sdk`, `geolocation`, `weather`, `network`, `system`, and `ai`. The runtime is unified, live-count-aware, and already implemented, with heartbeat as the one discovery surface for Ultrascripts availability and `sdk` reserved for BetterDungeon-facing metadata like version and safe configuration context.

## Current status

The core Ultrascripts runtime is shipped. All 9 first-party modules are implemented, live-tested, documented publicly in BetterRepository, and covered by dedicated regression test suites in `tests/aid-scripts/`.

What remains is:

- keep the standard SDK-based Enhanced and Required template foundation aligned with implementation changes
- review the current modules one at a time for conceptual polish
- produce proper complete scripts after the template and module reviews land

## Doc rules

The active Ultrascripts docs should:

- match the real codebase
- prefer current implementation truth over old planning residue
- treat Ultrascripts as shipped infrastructure, not as a prototype
- avoid reviving deprecated ideas like Lite/profile splits

If a concept is only historical, archive it or remove it from the active set.
