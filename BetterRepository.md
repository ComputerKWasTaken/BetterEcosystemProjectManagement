# BetterRepository Project Management

> Project tracking for the public BetterEcosystem resource and guide site.

## Current Focus

With Ultrascripts now multiplatform and the Phase 13 public guide rewrite
completed, BetterRepository has the public documentation foundation for the
current Ultrascripts platform.

Completed Ultrascripts documentation deliverables:

- **Standardized Guide Format** — authoring contract for every guide in
  `src/components/guides/`. Lives at `BetterRepository/docs/guides/format-spec.md`.
- **Ultrascripts Info Dump** — fully populated reference at
  `BetterRepository/docs/guides/info-dumps/ultrascripts.md`, aligned to the
  live BetterDungeon runtime.
- **Public Ultrascripts Guide Set** — overview, Quick Start, Cookbook,
  Architecture, Building Modules, and module pages for Scripture, WebFetch, AI,
  SDK, Clock, Geolocation, Weather, Network, and System.
- **Story Card Command Presets** — new repository data type
  `STORY_CARD_COMMAND_PRESETS` in `src/data/storyCards.js`, parallel to
  `STORY_CARDS` and `STORY_CARD_TEMPLATES`. Seeded with the default
  *Basic List Prompt* preset. Story Cards guide expanded with a new
  *Command Presets* section explaining the `{{title}}` token, entry
  formatting modes, additional generation context, and the
  log-in-notes / speed-create toggles.

## Completed Ultrascripts Guide Work

The public docs now cover:

- Ultrascripts overview and availability detection.
- Ultrascripts state publishing and live-count history.
- Ultrascripts ops calls, polling, acknowledgements, errors, and reload behavior.
- Scripture widgets.
- WebFetch consent, safe fetch, search, rate limits, and blocked targets.
- Clock, Geolocation, Weather, Network, and System modules.
- BetterDungeon SDK version and config ops.
- AI setup, OpenRouter key configuration, safe usage, request caps, and examples.

## To Do

### High Priority

- Review each shipped Ultrascripts module one at a time for conceptual
  improvements before producing complete scripts.
- Finish populating the six scaffolded info dumps (AI Instructions, Plot
  Components, Scripts, Symbols & Commands, Advanced
  Settings). Pull verified facts from existing guide content, Discord,
  and contributor notes.
- Refactor existing guides (`AIInstructionsGuide.vue`, `PlotComponentsGuide.vue`,
  `ScriptsGuide.vue`, `SymbolsCommandsGuide.vue`,
  `AdvancedSettingsGuide.vue`) to fully conform to `docs/guides/format-spec.md`.
- Replace legacy BetterScripts guide material with Ultrascripts.
- Remove Zero-width / TagCipher / Context Modifier guidance where it only existed for old BetterScripts.

### Medium Priority

- Keep the Enhanced and Required Ultrascripts templates aligned between
  BetterRepository and BetterDungeon as the scripting contract evolves.
- Add scenario-author examples that combine modules, such as weather grounded by geolocation or NPC reasoning through the AI module.
- Cross-link BetterDungeon popup setup steps with each module guide.

### Later

- Add deeper AI recipes once additional providers, presets, or recommended models are available.
- Add Voyage resources when Voyage leaves Early Access and the product direction is clear.

## Known Issues

- Non-Ultrascripts guide info dumps still contain scaffold TODOs.

## Canonical Inputs

- [BetterRepository docs index](../BetterRepository/docs/README.md)
- [Standardized Guide Format spec](../BetterRepository/docs/guides/format-spec.md)
- [Story Cards info dump](../BetterRepository/docs/guides/info-dumps/story-cards.md)
- [Ultrascripts planning index](./ultrascripts/README.md)
- [Implementation status](./ultrascripts/03-implementation-status.md)
- [Test suites](./ultrascripts/04-test-suites.md)
- [Example contract reference](./ultrascripts/07-example-contract-reference.md)
