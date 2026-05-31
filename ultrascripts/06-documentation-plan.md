# 06 - Documentation Plan

> This is the active plan for Ultrascripts-facing documentation work across the internal docs and BetterRepository public guides.

## Purpose

This plan exists to keep two documentation tracks aligned:

- private/internal Ultrascripts documentation for maintenance and implementation work
- public BetterRepository documentation for scenario authors and developers

The important rule is simple: both tracks must describe the Ultrascripts that actually ships, not an earlier planning snapshot.

## Current documentation shape

The active internal Ultrascripts doc set is now:

- [00-overview.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/00-overview.md)
- [01-architecture.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/01-architecture.md)
- [02-modules.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/02-modules.md)
- [03-implementation-status.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/03-implementation-status.md)
- [04-test-suites.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/04-test-suites.md)
- [05-betterdungeon-sdk-spec.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/05-betterdungeon-sdk-spec.md)
- [06-documentation-plan.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/06-documentation-plan.md)
- [07-example-contract-reference.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/07-example-contract-reference.md)

## Internal documentation goals

The internal docs should do four jobs well:

1. explain how Ultrascripts works now
2. point clearly to the real source-of-truth files
3. document the parts most likely to confuse future maintainers
4. avoid keeping dead planning baggage alive

That means:

- no Lite/full profile framing
- no future-tense descriptions of already shipped runtime pieces
- no references to files that no longer exist
- no pretending planned tests or guides already exist when they do not

## Public documentation goals

The BetterRepository side should do different work:

- explain why Ultrascripts matters
- show how to use it without overwhelming people
- give each major module a clear home
- keep the technical depth in the right places

The public guide split is now:

- `UltrascriptsGuide.vue` as the "why/use it" overview
- `UltrascriptsQuickStartGuide.vue` as the standard SDK-helper onboarding path
- `UltrascriptsCookbookGuide.vue` as the recipe collection
- `UltrascriptsArchitectureGuide.vue` for runtime architecture
- `UltrascriptsAuthoringGuide.vue` for BetterDungeon-side module authors
- module-specific guides where deeper usage belongs
- migration/help pages separated from the main pitch

## Completed BetterRepository guide inventory

Core public guide areas now include:

- Ultrascripts overview
- Quick Start
- Cookbook
- Architecture
- Building Modules
- Scripture
- WebFetch
- AI
- BetterDungeon SDK
- Clock
- Geolocation
- Weather
- Network
- System
- migration/help material as needed later

## Recommended execution order

1. keep the internal Ultrascripts docs accurate first (completed in Phase 11)
2. complete the high-level public guide, quick start, cookbook, architecture, and authoring docs (completed in Phase 13)
3. complete per-module guides for all shipped first-party modules (completed in Phase 13)
4. keep the example contract reference current as the starter templates and complete scripts evolve

## Verification

When documentation is updated, verify:

- file names and numbers are correct
- internal links still resolve
- guide claims match the actual codebase
- public-facing language matches what users should care about
- technical detail lives in the right guide, not everywhere at once
- public examples stay aligned with the live AI Dungeon scripting sandbox and module contracts

## Current priority

Phase 13 (BetterRepository Public Docs) is now completed for the shipped Ultrascripts surface. BetterRepository has a coherent public guide set, dedicated module pages, a Quick Start, a Cookbook, and a public SDK guide that matches the live runtime contract.

The example/template foundation is now in place: the current active priority is to review each shipped module for conceptual improvements before producing complete scripts from the standard SDK-based Enhanced and Required templates.
