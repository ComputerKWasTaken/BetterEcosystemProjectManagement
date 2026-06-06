# 06 - Documentation Sync

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
| Public BetterRepository guides | Scenario authors and developers | `../../BetterRepository/src/components/guides/Ultrascripts*.vue` | Teach what to build and how to use it |
| BetterRepository info dump | Guide authors/RAG/source notes | `../../BetterRepository/docs/guides/info-dumps/ultrascripts.md` | Full public knowledge base backing Vue guide pages |
| BetterDungeon examples | Maintainers testing live script foundations | `../../BetterDungeon/examples/aid-scripts/` | Enhanced and Required template foundations |
| BetterRepository raw scripts | Public downloadable script entries | `../../BetterRepository/src/data/raw-scripts/` | Public copies of templates/scripts |
| Module suites | Maintainers validating behavior | `../../BetterDungeon/tests/aid-scripts/` | Live AI Dungeon regression checks |

## Private Docs Inventory

| File | Keep focused on |
|---|---|
| [README.md](./README.md) | source-of-truth map and read order |
| [00-overview.md](./00-overview.md) | product-level state and mental model |
| [01-architecture.md](./01-architecture.md) | runtime layers and data flows |
| [02-modules.md](./02-modules.md) | module inventory and contract |
| [03-implementation-status.md](./03-implementation-status.md) | active roadmap and release path |
| [04-test-suites.md](./04-test-suites.md) | verification surfaces |
| [05-betterdungeon-sdk-spec.md](./05-betterdungeon-sdk-spec.md) | SDK module contract |
| [06-documentation-plan.md](./06-documentation-plan.md) | this sync plan |
| [07-example-contract-reference.md](./07-example-contract-reference.md) | example/template/showcase rules |
| [08-module-quality-pass.md](./08-module-quality-pass.md) | active module polish checklist |

## Public Guide Inventory

Current BetterRepository Ultrascripts guide pages:

| Guide | File |
|---|---|
| Overview | `UltrascriptsGuide.vue` |
| Quick Start | `UltrascriptsQuickStartGuide.vue` |
| Cookbook | `UltrascriptsCookbookGuide.vue` |
| Architecture | `UltrascriptsArchitectureGuide.vue` |
| Building Modules | `UltrascriptsAuthoringGuide.vue` |
| Scripture | `UltrascriptsScriptureGuide.vue` |
| WebFetch | `UltrascriptsWebFetchGuide.vue` |
| AI | `UltrascriptsAiGuide.vue` |
| BetterDungeon SDK | `UltrascriptsSdkGuide.vue` |
| Clock | `UltrascriptsClockGuide.vue` |
| Geolocation | `UltrascriptsGeolocationGuide.vue` |
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

- `../../BetterDungeon/examples/aid-scripts/ultrascripts-starter-template/`
- `../../BetterDungeon/examples/aid-scripts/ultrascripts-required-template/`
- `../../BetterRepository/src/data/raw-scripts/library/ultrascripts-starter-template.js`
- `../../BetterRepository/src/data/raw-scripts/library/ultrascripts-required-template.js`
- matching `input`, `context`, and `output` files in both repos
- `../../BetterRepository/src/data/scripts.js`

Sync rules:

- BetterDungeon examples and BetterRepository raw-script copies should teach the
  same `bd.us` helper contract.
- If helper method names change, update Quick Start, module guides, and
  [07-example-contract-reference.md](./07-example-contract-reference.md).
- If Required gating changes, update the public SDK guide and script catalog
  metadata.
- If Enhanced fallback behavior changes, update Quick Start and the starter
  template description.

## Contract Change Checklist

When a module API changes:

1. Update the module implementation.
2. Update its regression suite.
3. Update [02-modules.md](./02-modules.md) if the inventory/contract changed.
4. Update [07-example-contract-reference.md](./07-example-contract-reference.md)
   if public examples need a new pattern.
5. Update the BetterRepository module guide.
6. Update the Ultrascripts info dump if it contains the changed contract.
7. Update templates/showcase scripts if they depend on the field/op.
8. Run the relevant verification from [04-test-suites.md](./04-test-suites.md).

When the helper/template contract changes:

1. Update BetterDungeon examples.
2. Update BetterRepository raw-script copies.
3. Update Quick Start.
4. Update Cookbook/module examples if they call helper methods directly.
5. Update Required/Enhanced script catalog metadata if needed.
6. Smoke-check both template flows.

When roadmap/status changes:

1. Update [03-implementation-status.md](./03-implementation-status.md).
2. Update [08-module-quality-pass.md](./08-module-quality-pass.md) if module
   polish status changed.
3. Update `../ProjectManagement.md`, `../BetterDungeon.md`, or
   `../BetterRepository.md` only if project-level focus changed.

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
- use the canonical module id `ai`, not `providerAI`, except in legacy notes
- use Story Card type `Ultrascripts` for Ultrascripts-owned cards

## Active Sync Priority

The public docs are complete for the shipped module set. The current sync
priority is keeping docs and templates stable while module polish and showcase
scripts happen.

Immediate focus:

- Scripture module pass
- helper alignment for Scripture interactions and widget state
- any AI/SDK guidance needed for Brainiac and Statboy
- any Clock/Weather/Geolocation guidance needed for Chronos V2
- keeping Enhanced and Required templates identical across BetterDungeon and
  BetterRepository after any helper changes

## Showcase Script Documentation Path

When Brainiac, Statboy, and Chronos V2 are built:

1. Add or update their BetterRepository script entries.
2. Add public guide links where the scripts demonstrate module patterns.
3. Update Cookbook recipes if they introduce a reusable pattern.
4. Update [07-example-contract-reference.md](./07-example-contract-reference.md)
   if a showcase reveals a better canonical example.
5. Update project-level docs to move from "showcase scripts next" to release
   prep.

## Verification Before Calling Docs Synced

Check:

- private docs mention all 9 shipped modules consistently
- public guide list still matches actual `Ultrascripts*.vue` files
- test suite list still matches actual `tests/aid-scripts/` directories
- template names match BetterDungeon examples and BetterRepository script data
- no active doc claims Lite/full profiles, mutation-template priming, or
  action-id-keyed Scripture history as current behavior
- no public example teaches retired widget names or stale module field names

Useful command patterns:

```powershell
rg -n "Lite|profile|mutation template|providerAI|stat-bar|badge-list|checklist|max_tokens|response_format|data.now|accuracyMeters" "Project Management\ultrascripts" BetterRepository
rg --files BetterDungeon\tests\aid-scripts
rg --files BetterRepository\src\components\guides | rg "Ultrascripts.*\.vue$"
```
