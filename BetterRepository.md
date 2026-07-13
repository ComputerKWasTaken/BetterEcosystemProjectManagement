# BetterRepository Project Management

> Project tracking for the public BetterEcosystem resource and guide site.

## Current Focus

BetterRepository already has the public Ultrascripts documentation foundation
for the shipped platform. The current release target is BetterRepository V1.7,
paired with BetterDungeon V2. The responsibility now is keeping public docs,
script entries, raw-script templates, release wording, and future showcase
scripts synchronized with BetterDungeon.

Completed Ultrascripts public docs:

- overview
- Quick Start
- Cookbook
- Architecture
- Building Modules
- Widget
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
- BetterRepository design refresh foundation

## Active Work

### Ultrascripts Sync

- Keep BetterRepository raw-script template copies aligned with BetterDungeon
  examples.
- Refresh public Ultrascripts guides before V1.7 so they fully match the live
  Widget, SDK, template, and mobile behavior contracts.
- Keep the Stateboy public script entry aligned with the raw script.
- Cross-link showcase scripts to the module guides they demonstrate.
- Add public script entries for Brainiac and Chronos V2 after the V2 release.

### V1.7 Release Wording

The V1.7 What's New story should emphasize:

- BetterRepository design refresh and smoother navigation/search polish.
- Story Card command presets and preset documentation.
- Ultrascripts guide refresh for BetterDungeon V2.
- Enhanced and Required Ultrascripts templates updated for Widget.
- Stateboy as the first Required Ultrascripts showcase script.
- Brainiac and Chronos V2 entries in a post-V2 update once those showcase scripts
  are built.

Do not present V1.7 as a full major-version relaunch. This is a substantial
public site release that supports the BetterDungeon V2 launch.

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
  weather.
- Cross-link BetterDungeon popup setup steps with relevant module guides.
- Add deeper AI recipes once Brainiac and Stateboy reveal the most useful public
  patterns after the V2 release.
- Tighten non-Ultrascripts guide wording where V1.7 changed the UI or available
  preset data.

## Later

- Add Voyage resources when Voyage leaves Early Access and the product direction
  is clear.

## Known Issues

- Non-Ultrascripts guide info dumps still contain scaffold TODOs.
- V1.7 What's New should not claim Brainiac or Chronos V2 are shipped. Post-V2
  updates will add those script entries once they are built.

## Canonical Inputs

- [BetterRepository docs index](../BetterRepository/docs/README.md)
- [Standardized Guide Format spec](../BetterRepository/docs/guides/format-spec.md)
- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Documentation sync](./ultrascripts/planning/docs-sync.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
