# BetterRepository Project Management

> Release tracking for the public BetterEcosystem resource and guide site.

## Current Status

BetterRepository V1.7 is the only active release. BetterDungeon V2 is already
public, so V1.7 should ship as a polished standalone documentation and resource
release supporting that stable baseline.

## V1.7 Release Checklist

- [ ] Refresh Ultrascripts guides against the released V2 contracts.
- [ ] Keep the public info dump aligned with the guide components.
- [ ] Keep Enhanced and Required raw-script templates aligned with BetterDungeon.
- [ ] Keep any Stateboy entry aligned with its current source and clearly mark it
      unpublished until the Stateboy release stage.
- [ ] Polish the design refresh, navigation, search, and responsive experience.
- [ ] Document Story Card command presets and their seed data clearly.
- [ ] Update the V1.7 What's New section, metadata, and release wording.
- [ ] Check internal links, script downloads, and primary guide routes.
- [ ] Run a clean production build and smoke-test the release candidate.
- [ ] Publish V1.7 and verify the live deployment.

## Release Gate

V1.7 is ready when:

- public claims match released BetterDungeon V2 behavior
- the eight-module Ultrascripts surface is consistent across guides and templates
- navigation, search, downloads, and primary routes work in production
- What's New and release metadata describe V1.7 accurately
- no unfinished showcase script is presented as published

## Public Documentation Already in Place

- Ultrascripts overview, Quick Start, Cookbook, Architecture, and module guides.
- Widget, WebFetch, AI, SDK, Clock, Weather, Network, and System guides.
- Enhanced and Required Ultrascripts template entries.
- Story Card command preset documentation and seed data.
- BetterRepository design-refresh foundation.

## Non-Blocking Cleanup

These are useful tasks, but they do not block V1.7 unless they create incorrect
public information or a visibly incomplete primary route:

- Finish scaffolded info dumps for AI Instructions, Plot Components, Scripts,
  Symbols & Commands, and Advanced Settings.
- Bring older non-Ultrascripts guides into the standard guide format.
- Replace legacy BetterScripts framing where Ultrascripts superseded it.
- Remove retired Zero-width, TagCipher, and Context Modifier guidance.

## After V1.7

1. Polish and publish Stateboy, then mark its entry as published.
2. Add and publish Brainiac after Stateboy.
3. Add and publish Chronos V2 after Brainiac.
4. Perform final status alignment during era closeout.

Voyage resources remain parked until BetterVoyage has a clear, stable direction.

## Canonical Inputs

- [BetterRepository docs index](../BetterRepository/docs/README.md)
- [Guide format specification](../BetterRepository/docs/guides/format-spec.md)
- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Documentation sync plan](./ultrascripts/planning/docs-sync.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
