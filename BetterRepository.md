# BetterRepository Project Management

> Project tracking for the public BetterEcosystem resource and guide site.

## Current Focus

With Ultrascripts now multiplatform (Phase 12 complete on Chromium, Gecko,
and Android WebView), focus shifts to the BetterRepository **Guides
Foundation** — the docs-system work that must land before the Phase 13
public developer-guide rewrite for Ultrascripts.

Guides Foundation deliverables (in progress):

- **Standardized Guide Format** — authoring contract for every guide in
  `src/components/guides/`. Lives at `BetterRepository/docs/guides/format-spec.md`.
- **Per-topic Info Dumps** — one kitchen-sink reference per guide tab in
  `BetterRepository/docs/guides/info-dumps/`. Source of truth so guide
  rewrites never lose information. Story Cards dump is fully populated;
  the other six are scaffolded and will fill in as work proceeds.
- **Story Card Command Presets** — new repository data type
  `STORY_CARD_COMMAND_PRESETS` in `src/data/storyCards.js`, parallel to
  `STORY_CARDS` and `STORY_CARD_TEMPLATES`. Seeded with the default
  *Basic List Prompt* preset. Story Cards guide expanded with a new
  *Command Presets* section explaining the `{{title}}` token, entry
  formatting modes, additional generation context, and the
  log-in-notes / speed-create toggles.

## Planned Guide Work

Create or update public-facing guides for:

- Ultrascripts overview and availability detection.
- Ultrascripts state publishing and live-count history.
- Ultrascripts ops calls, polling, acknowledgements, errors, and reload behavior.
- Scripture widgets.
- WebFetch consent, safe fetch, search, rate limits, and blocked targets.
- Clock, Geolocation, Weather, Network, and System modules.
- BetterDungeon SDK version and config ops.
- Provider AI setup, OpenRouter key configuration, safe usage, request caps, and examples.

## To Do

### High Priority

- Finish populating the six scaffolded info dumps (AI Instructions, Plot
  Components, Scripts, Ultrascripts, Symbols & Commands, Advanced
  Settings). Pull verified facts from existing guide content, Discord,
  and contributor notes.
- Refactor existing guides (`AIInstructionsGuide.vue`, `PlotComponentsGuide.vue`,
  `ScriptsGuide.vue`, `UltrascriptsGuide.vue`, `SymbolsCommandsGuide.vue`,
  `AdvancedSettingsGuide.vue`) to fully conform to `docs/guides/format-spec.md`.
- Replace legacy BetterScripts guide material with Ultrascripts.
- Remove Zero-width / TagCipher / Context Modifier guidance where it only existed for old BetterScripts.
- Add module reference pages with copyable AI Dungeon Library snippets.
- Fix known navigation issues where buttons link to wrong pages.

### Medium Priority

- Add scenario-author examples that combine modules, such as weather grounded by geolocation or NPC reasoning through Provider AI.
- Cross-link BetterDungeon popup setup steps with each module guide.

### Later

- Add deeper Provider AI recipes once additional providers, presets, or recommended models are available.
- Add Voyage resources when Voyage leaves Early Access and the product direction is clear.

## Known Issues

- Some existing site buttons incorrectly link to the wrong pages.

## Canonical Inputs

- [BetterRepository docs index](../BetterRepository/docs/README.md)
- [Standardized Guide Format spec](../BetterRepository/docs/guides/format-spec.md)
- [Story Cards info dump](../BetterRepository/docs/guides/info-dumps/story-cards.md)
- [Ultrascripts planning index](./ultrascripts/README.md)
- [Implementation status](./ultrascripts/03-implementation-status.md)
- [Test suites](./ultrascripts/04-test-suites.md)
- [Provider AI phase plan](./ultrascripts/archive/17-provider-ai-phase-plan.md)
