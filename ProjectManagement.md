# BetterEcosystem Project Management Hub

> The short, current view of what is happening across the BetterEcosystem.

## Current Status

BetterDungeon V2 is released. Its runtime, eight first-party Ultrascripts
modules, templates, regression coverage, and cross-platform support are now a
production baseline rather than an active release project.

The remaining BetterEcosystem work for this era is intentionally finite and
sequential:

1. Polish and release BetterRepository V1.7.
2. Polish, verify, and publish Stateboy.
3. Build, verify, and publish Brainiac.
4. Build, verify, and publish Chronos V2.
5. Close the era with final documentation alignment and planning cleanup.

Only the first incomplete stage is active. Later stages may keep brief design
notes, but they must not expand the scope of the current release.

## Active Projects

- **[BetterDungeon](./BetterDungeon.md)** — V2 released; maintenance-only unless
  a defect blocks a remaining release.
- **[BetterRepository](./BetterRepository.md)** — Active project; preparing
  V1.7 for release.
- **Stateboy** — Existing showcase implementation; next publication target
  after V1.7.
- **Brainiac** — Planned after Stateboy.
- **Chronos V2** — Planned after Brainiac.
- **[BetterVoyage](./BetterVoyage.md)** — Future Voyage extension idea; parked.

## Planning Areas

- **[Ultrascripts internal docs](./ultrascripts/README.md)** — Runtime reference,
  module contracts, verification, templates, and focused maintenance notes.
- **[AI Dungeon reference docs](./docs/index.md)** — Private platform, scripting,
  DOM, and GraphQL reference material.
- **[Design notes](./design/README.md)** — Shared product and visual design
  references.

## Final-Era Release Stages

### 1. BetterRepository V1.7 — Active

Prioritize public accuracy, presentation, and a clean standalone release:

- Verify the Ultrascripts guides against the released V2 contracts.
- Keep templates and script entries aligned with their canonical sources.
- Polish the V1.7 What's New section and release wording.
- Validate navigation, search, responsive presentation, downloads, and builds.
- Do not make V1.7 depend on showcase-script publication.

### 2. Stateboy

Use the existing implementation as the starting point, then complete its
player-facing polish, live verification, documentation, and publication.

### 3. Brainiac

Build and publish the AI-powered story-card and brain-card management showcase
after Stateboy is public.

### 4. Chronos V2

Build and publish the vanilla-safe timekeeper with optional Clock, Weather, and
Widget enhancements after Brainiac is public.

### 5. Era Closeout

- Align BetterRepository entries, private references, and release status.
- Move completed planning out of active checklists.
- Record maintenance risks without opening new feature tracks.
- Leave BetterVoyage and speculative infrastructure work parked.

## Scope Rules

- Prefer live implementation and current contracts over old planning notes.
- Keep only one release stage active at a time.
- Do not let a later showcase expand the scope of the current release.
- Treat BetterDungeon V2 as maintenance-only unless a confirmed defect affects
  security, compatibility, or a remaining release.
- Keep completed work out of active checklists.
- Archive useful history deliberately; remove stale status claims from current
  planning documents.
