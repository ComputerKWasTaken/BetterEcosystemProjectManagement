# BetterRepository Project Management

> Project tracking for the public BetterEcosystem resource and guide site.

## Current Focus

BetterRepository already has the public Ultrascripts documentation foundation
for the shipped platform. The current responsibility is keeping public docs,
script entries, raw-script templates, and future showcase scripts synchronized
with BetterDungeon.

Completed Ultrascripts public docs:

- overview
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

Other completed public documentation pieces:

- standardized guide format at `../BetterRepository/docs/guides/format-spec.md`
- Ultrascripts info dump at
  `../BetterRepository/docs/guides/info-dumps/ultrascripts.md`
- Enhanced and Required Ultrascripts template entries
- Story Card command preset documentation and seed data

## Active Work

### Ultrascripts Sync

- Keep BetterRepository raw-script template copies aligned with BetterDungeon
  examples.
- Update public guides only when module contracts, helper behavior, or showcase
  examples change.
- Add or update public script entries for Brainiac, Statboy, and Chronos V2
  once they are built.

### Non-Ultrascripts Guide Cleanup

High priority:

- Finish populating scaffolded info dumps for AI Instructions, Plot Components,
  Scripts, Symbols & Commands, and Advanced Settings.
- Refactor existing non-Ultrascripts guides to fully match
  `docs/guides/format-spec.md`.
- Replace legacy BetterScripts guide material with current Ultrascripts framing
  where relevant.
- Remove Zero-width, TagCipher, and Context Modifier guidance where it only
  existed for old BetterScripts workflows.

## Medium Priority

- Add scenario-author examples that combine modules, such as geolocation-backed
  weather or AI-assisted state management.
- Cross-link BetterDungeon popup setup steps with relevant module guides.
- Add deeper AI recipes once additional providers, presets, or recommended
  models are available.

## Later

- Add Voyage resources when Voyage leaves Early Access and the product direction
  is clear.

## Known Issues

- Non-Ultrascripts guide info dumps still contain scaffold TODOs.

## Canonical Inputs

- [BetterRepository docs index](../BetterRepository/docs/README.md)
- [Standardized Guide Format spec](../BetterRepository/docs/guides/format-spec.md)
- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Documentation sync](./ultrascripts/planning/docs-sync.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
