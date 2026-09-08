# BetterEcosystem Project Management Hub

> The short, current view of what is happening across the BetterEcosystem.

## Current Status

BetterDungeon V2.1 is now the active BetterEcosystem priority. Its runtime, nine
first-party Ultrascripts modules, templates, regression coverage, and
cross-platform support are functionally complete; the remaining work is final
polish, cleanup, and release preparation. Chronos V2 has already shipped
independently and no longer gates BetterDungeon.

BetterDungeon's browser extension and Android app now live in one repository.
Daily work happens on `dev`; tested release candidates move to protected
`stable` through the manual promotion workflow. Every push validates the Node
contracts, extension package, and Android debug build and retains both build
artifacts for review.

The remaining BetterEcosystem work for this era is intentionally focused:

1. Finish BetterDungeon V2.1 polish, cleanup, and release preparation.
2. Publish BetterDungeon V2.1.
3. Return to Stateboy and Brainiac after the release.
4. Close the era with final documentation alignment and planning cleanup.

Chronos V2 is released. Stateboy remains deliberately on the backburner, and
Brainiac remains planned for later.

## Active Projects

- **[BetterDungeon](./BetterDungeon.md)** — Active priority; V2.1 final polish,
  cleanup, release checks, and publication remain. The monorepo and CI/CD
  migration are complete.
- **Chronos V2** — Released independently.
- **Stateboy** — Paused until after BetterDungeon V2.1 ships.
- **Brainiac** — Planned for later.
- **[BetterVoyage](./BetterVoyage.md)** — Future Voyage extension idea; parked.

## Planning Areas

- **[Ultrascripts internal docs](./ultrascripts/README.md)** — Runtime reference,
  module contracts, verification, templates, and focused maintenance notes.
- **[AI Dungeon reference docs](./docs/index.md)** — Private platform, scripting,
  DOM, and GraphQL reference material.
- **[Design notes](./design/README.md)** — Shared product and visual design
  references.

## Final-Era Release Stages

### 1. BetterDungeon V2.1 — Active

Complete final polish, cleanup, regression checks, documentation alignment, and
release preparation.

### 2. Chronos V2 — Released

Chronos V2's implementation, Ultrascripts integration, polish, verification,
and independent publication are complete.

### 3. Stateboy and Brainiac

Resume Stateboy after the BetterDungeon v2.1 release. Brainiac remains a later showcase
project.

### 4. Era Closeout

- Align BetterRepository entries, private references, and release status.
- Move completed planning out of active checklists.
- Record maintenance risks without opening new feature tracks.
- Leave BetterVoyage and speculative infrastructure work parked.

## Scope Rules

- Prefer live implementation and current contracts over old planning notes.
- Keep only one release stage active at a time.
- Do not let a later showcase expand the scope of the current release.
- Keep BetterDungeon v2.1 feature scope closed; accept only release polish and
  confirmed bug fixes until publication.
- Keep completed work out of active checklists.
- Archive useful history deliberately; remove stale status claims from current
  planning documents.
