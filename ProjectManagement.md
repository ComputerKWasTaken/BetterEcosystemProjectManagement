# BetterEcosystem Project Hub

> Current portfolio status, priorities, and the canonical roadmap.

## Portfolio

| Project | Status | Direction |
|---|---|---|
| **BetterDungeon** | Maintenance; v2.1 shipped on browser and Android | Fix confirmed defects and maintain current contracts. See [project reference](./BetterDungeon.md). |
| **Stateboy** | Active release project; unpublished | Finish the bounded core release and publish it through BetterRepository. See the [release plan](./ultrascripts/planning/stateboy.md). |
| **Brainiac** | Next to reassess; private prototype exists | Decide its audience, product scope, and release case after Stateboy. |
| **Chronos V2** | Shipped independently; [seasonal weather update](./ultrascripts/releases/chronos-weather.md) published | Maintain the released script and its contract. |

The [project roadmap](./ultrascripts/planning/README.md) is the source of truth
for work sequence and current priorities. The Stateboy [product and technical
design](./ultrascripts/design/stateboy-design.md) keeps detailed behavior
decisions separate from the release checklist.

## Delivery Model

BetterDungeon's browser extension and Android app share one monorepo. `dev` is
the contributor workspace; tested builds move to protected `preview` through
manual promotion, and `release` records published source. Every push validates
the Node smoke checks, browser package, and Android debug build, and retains
both build artifacts for review.

## Reference Areas

- [BetterDungeon](./BetterDungeon.md) — shipped v2.1 scope and maintenance
  boundaries.
- [Ultrascripts](./ultrascripts/README.md) — runtime contracts, module
  references, release history, and the Stateboy project docs.
- [AI Dungeon references](./docs/index.md) — platform, scripting, DOM, and
  GraphQL reference material.
- [Design notes](./design/README.md) — shared product and visual references.

## Planning Rules

- Keep one feature release active at a time.
- Keep release status and detailed behavior in their canonical project docs;
  avoid duplicate checklists in the hub.
- Keep shipped-release history separate from active project plans.
- Add a new project only with a clear user problem, scope, and release gate.
- Track BetterDungeon maintenance through its normal quality gate; scope new
  features separately.
