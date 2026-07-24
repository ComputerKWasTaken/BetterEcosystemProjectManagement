# Documentation Sync Plan

## Purpose

This document keeps the private Ultrascripts docs, public BetterRepository
guides, starter templates, and showcase scripts aligned.

The rule is:

```text
Implementation truth -> private maintenance docs -> public author docs -> templates/examples
```

When the implementation changes, all downstream surfaces that teach or depend on
that contract must be checked.

## Documentation Tracks

| Track | Audience | Location | Job |
|---|---|---|---|
| Private Ultrascripts docs | BetterEcosystem maintainers | `./` | Current architecture, status, module contracts, roadmap, verification |
| Public BetterRepository guides | Scenario authors and developers | `../../../BetterRepository/src/components/guides/Ultrascripts*.vue` | Teach what to build and how to use it |
| BetterRepository info dump | Guide authors/RAG/source notes | `../../../BetterRepository/docs/guides/info-dumps/ultrascripts.md` | Full public knowledge base backing Vue guide pages |
| BetterDungeon examples | Maintainers testing live script foundations | `../../../BetterDungeon/examples/aid-scripts/` | Enhanced and Required template foundations |
| BetterRepository raw scripts | Public downloadable script entries | `../../../BetterRepository/src/data/raw-scripts/` | Public copies of templates/scripts |
| Module suites | Maintainers validating behavior | `../../../BetterDungeon/tests/aid-scripts/` | Live AI Dungeon regression checks |

## Private Docs Inventory

| File | Keep focused on |
|---|---|
| [README.md](../README.md) | entry point, source-of-truth map, and doc rules |
| [reference/runtime.md](../reference/runtime.md) | runtime layers and data flows |
| [reference/modules.md](../reference/modules.md) | module inventory and contract |
| [reference/script-contract.md](../reference/script-contract.md) | script, helper, example, and showcase contracts |
| [reference/sdk.md](../reference/sdk.md) | SDK module contract |
| [reference/verification.md](../reference/verification.md) | verification surfaces |
| [planning/current-roadmap.md](./current-roadmap.md) | active roadmap and release path |
| [planning/docs-sync.md](./docs-sync.md) | this sync plan |
| [planning/module-quality-pass.md](./module-quality-pass.md) | active module polish checklist |

## Public Guide Inventory

Current BetterRepository Ultrascripts guide pages:

| Guide | File |
|---|---|
| Overview | `UltrascriptsGuide.vue` |
| Quick Start | `UltrascriptsQuickStartGuide.vue` |
| Cookbook | `UltrascriptsCookbookGuide.vue` |
| Architecture | `UltrascriptsArchitectureGuide.vue` |
| Building Modules | `UltrascriptsAuthoringGuide.vue` |
| Widget | `UltrascriptsWidgetGuide.vue` |
| WebFetch | `UltrascriptsWebFetchGuide.vue` |
| AI | `UltrascriptsAiGuide.vue` |
| BetterDungeon SDK | `UltrascriptsSdkGuide.vue` |
| Clock | `UltrascriptsClockGuide.vue` |
| Weather | `UltrascriptsWeatherGuide.vue` |
| Network | `UltrascriptsNetworkGuide.vue` |
| System | `UltrascriptsSystemGuide.vue` |

The public guide set exists and covers the shipped first-party surface. Future
work should keep it current, not restart it.

## Current Public/Private Split

Private docs should include:

- implementation file maps
- settled decisions
- internal release sequencing
- module quality-pass notes
- exact regression surfaces
- risks and maintenance rules

Public docs should include:

- what Ultrascripts lets authors build
- how to install/use the helper
- Enhanced versus Required script framing
- module-specific recipes
- permission/config/fallback guidance
- safe copyable examples

Public docs should not include private release anxiety, internal phase history,
or long explanations of retired approaches unless authors need the warning.

## Template Sync

Canonical helper/template surfaces:

- `../../../BetterDungeon/examples/aid-scripts/ultrascripts-starter-template/`
- `../../../BetterDungeon/examples/aid-scripts/ultrascripts-required-template/`
- `../../../BetterRepository/src/data/raw-scripts/library/ultrascripts-starter-template.js`
- `../../../BetterRepository/src/data/raw-scripts/library/ultrascripts-required-template.js`
- matching `input`, `context`, and `output` files in both repos
- `../../../BetterRepository/src/data/scripts.js`

Sync rules:

- BetterDungeon examples and BetterRepository raw-script copies should teach the
  same `bd.us` helper contract.
- If helper method names change, update Quick Start, module guides, and
  [Script Contract Reference](../reference/script-contract.md).
- If Required gating changes, update the public SDK guide and script catalog
  metadata.
- If Enhanced fallback behavior changes, update Quick Start and the starter
  template description.

## Contract Change Checklist

When a module API changes:

1. Update the module implementation.
2. Update its regression suite.
3. Update [Module System Reference](../reference/modules.md) if the inventory/contract changed.
4. Update [Script Contract Reference](../reference/script-contract.md)
   if public examples need a new pattern.
5. Update the BetterRepository module guide.
6. Update the Ultrascripts info dump if it contains the changed contract.
7. Update templates/showcase scripts if they depend on the field/op.
8. Run the relevant verification from [Verification Reference](../reference/verification.md).

When the helper/template contract changes:

1. Update BetterDungeon examples.
2. Update BetterRepository raw-script copies.
3. Update Quick Start.
4. Update Cookbook/module examples if they call helper methods directly.
5. Update Required/Enhanced script catalog metadata if needed.
6. Smoke-check both template flows.

When roadmap/status changes:

1. Update [Current Roadmap](./current-roadmap.md).
2. Update [Module Quality Pass](./module-quality-pass.md) if module
   polish status changed.
3. Update `../../ProjectManagement.md`, `../../BetterDungeon.md`, or
   `../../BetterRepository.md` only if project-level focus changed.
4. If the change affects public release messaging, update BetterRepository's
   V1.7 What's New copy and release wording.

## Example Quality Rules

All public AI Dungeon snippets should:

- work inside AI Dungeon's script tabs
- avoid top-level early returns in modifier-body snippets
- return `{ text }` from modifiers
- use `storyCards` with `keys`/`entry` compatibility
- use `addStoryCard(keys, entry, type)` and
  `updateStoryCard(index, keys, entry, type)` for writes
- expect module responses on later turns
- avoid `async`, `await`, timers, promises, and same-turn assumptions
- use the canonical module id `ai`; do not teach provider aliases
- use Story Card type `Ultrascripts` for Ultrascripts-owned cards

## Active Sync Priority

BetterDungeon V2 is released, and the public docs cover its shipped module set.
The active sync priority is preparing BetterRepository V1.7 as an accurate,
polished standalone release.

Immediate focus:

- public guide and info-dump accuracy against the released eight-module surface
- Enhanced and Required template parity across BetterDungeon and BetterRepository
- BetterRepository V1.7 What's New and release wording
- navigation, route, search, and script-download smoke checks
- keeping Stateboy accurate but clearly unpublished

Later-stage sync focus:

- Stateboy source, entry, guide, and publication status
- any AI/SDK guidance needed for Brainiac
- any Clock/Weather guidance needed for Chronos V2

## Showcase Script Documentation Path

When each showcase reaches its roadmap stage:

1. Align its canonical source, BetterRepository raw script, and catalog entry.
2. Add public guide links where the scripts demonstrate module patterns.
3. Update Cookbook recipes if they introduce a reusable pattern.
4. Update [Script Contract Reference](../reference/script-contract.md)
   if a showcase reveals a better canonical example.
5. Publish and verify the script and its public download.
6. Mark it as published only after publication succeeds, then activate the next
   stage: Stateboy, Brainiac, and Chronos V2 in that order.

## BetterRepository V1.7 Messaging Checklist

Before calling V1.7 copy final:

- Home page What's New uses the current V1.7 release label.
- Copy mentions the design refresh and navigation/search polish.
- Copy mentions Story Card command presets.
- Copy mentions refreshed Ultrascripts guides/templates for BetterDungeon V2.
- Copy keeps Stateboy labeled unpublished and does not claim Brainiac or Chronos
  V2 are shipped.
- Public guides avoid pre-rename module names and retired Widget display knobs.

## Verification Before Calling Docs Synced

Check:

- private docs mention all eight shipped modules consistently
- public guide list still matches actual `Ultrascripts*.vue` files
- test suite list still matches actual `tests/aid-scripts/` directories
- template names match BetterDungeon examples and BetterRepository script data
- no active doc claims Lite/full profiles, mutation-template priming, or
  action-id-keyed Widget history as current behavior
- no public example teaches retired widget names or stale module field names

Useful command patterns:

```powershell
rg -n "Lite|profile|mutation template|providerAI|ai\.query|ai\.chat|stat-bar|badge-list|checklist|max_tokens|response_format|data.now|accuracyMeters" "Project Management\ultrascripts" BetterRepository
rg --files BetterDungeon\tests\aid-scripts
rg --files BetterRepository\src\components\guides | rg "Ultrascripts.*\.vue$"
```
