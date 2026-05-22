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
- [05-betterdungeon-sdk-roadmap.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/05-betterdungeon-sdk-roadmap.md)
- [06-documentation-plan.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/06-documentation-plan.md)

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

The public guide split should remain:

- `UltrascriptsGuide.vue` as the "why/use it" overview
- module-specific guides where deeper usage belongs
- migration/help pages separated from the main pitch

## Planned BetterRepository guide inventory

Core public guide areas should include:

- Ultrascripts overview
- Scripture
- WebFetch
- Clock
- Geolocation
- Weather
- Network
- System
- AI
- migration/help material as needed

Now that the BetterDungeon SDK module ships, it should get its own guide or a clearly defined section rather than being buried as a footnote.

## Recommended execution order

1. keep the internal Ultrascripts docs accurate first
2. keep the high-level Ultrascripts public guide clear and compelling
3. expand or polish per-module guides as the shipped module surfaces stabilize
4. add dedicated BetterDungeon SDK documentation now that the first public contract exists

## Verification

When documentation is updated, verify:

- file names and numbers are correct
- internal links still resolve
- guide claims match the actual codebase
- public-facing language matches what users should care about
- technical detail lives in the right guide, not everywhere at once

## Current priority

Phase 11 (Documentation Cleanup) is now active. The immediate work is refreshing every internal Ultrascripts doc to match production reality, removing stale planning language, and aligning phase references across all files.

The next priority after that is making sure the public BetterRepository guide set tells a coherent story about Ultrascripts as a real platform, with a clean place for the shipped BetterDungeon SDK surface to fit naturally. That work is Phase 14 in the current roadmap.
