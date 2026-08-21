# Ultrascripts Internal Docs

Private reference and maintenance docs for Ultrascripts, the BetterDungeon runtime that lets AI Dungeon scripts communicate with BetterDungeon through reserved Story Cards.

## What These Docs Are For

- `reference/` contains stable runtime facts, module contracts, SDK details, script contracts, and verification guidance.
- `planning/` contains focused maintenance notes and the current release roadmap.

Ultrascripts shipped with BetterDungeon V2 and its V2.1 implementation is
essentially complete. Keep these documents aligned with the implementation and
public BetterRepository guides while final polish proceeds.

## Current Release Context

BetterDungeon V2 is released. V2.1 is functionally complete across PC and
Mobile, with final polish and release preparation remaining. Chronos V2 is the
active script priority and will release alongside V2.1. Stateboy is paused, and
Brainiac remains planned for later.

## Start Here

| Need | Open |
|---|---|
| What is true right now and what is next? | [Current roadmap](./planning/current-roadmap.md) |
| How does the runtime work? | [Runtime reference](./reference/runtime.md) |
| Which modules ship and what contracts do they implement? | [Module system reference](./reference/modules.md) |
| What should scripts and templates assume? | [Script contract reference](./reference/script-contract.md) |
| What does `sdk` expose? | [BetterDungeon SDK reference](./reference/sdk.md) |
| What does the Audio module accept? | [Audio module reference](./reference/audio.md) |
| What should be tested or live-checked? | [Verification reference](./reference/verification.md) |
| How do private docs and public docs stay aligned? | [Documentation sync plan](./planning/docs-sync.md) |
| What module polish is still worth tracking? | [Module quality pass](./planning/module-quality-pass.md) |
| Why are the V2.1 designs shaped this way? | [V2.1 design notes](./planning/v2.1-design-notes.md) |
| What is the active Chronos V2 contract? | [Chronos V2 plan](./planning/chronos-v2.md) |

## Source-of-Truth Map

Implementation:

- BetterDungeon runtime: `../../BetterDungeon/services/ultrascripts/`
- BetterDungeon modules: `../../BetterDungeon/modules/`
- BetterDungeon feature wrapper: `../../BetterDungeon/features/ultrascripts_feature.js`
- BetterDungeon settings/runtime: `../../BetterDungeon/popup.js`, `../../BetterDungeon/background.js`

Public documentation:

- BetterRepository guide components: `../../BetterRepository/src/components/guides/Ultrascripts*.vue`
- BetterRepository info dump: `../../BetterRepository/docs/guides/info-dumps/ultrascripts.md`
- BetterRepository scripts/templates: `../../BetterRepository/src/data/scripts.js` and `../../BetterRepository/src/data/raw-scripts/`

Regression and author examples:

- Module suites: `../../BetterDungeon/tests/aid-scripts/`
- Starter templates: `../../BetterDungeon/examples/aid-scripts/`

## Shipped Module Set

| Module | Type | Ops or state |
|---|---|---|
| `widget` | state | `ultrascripts:state:widget` |
| `webfetch` | ops | `fetch` |
| `clock` | ops | `now`, `tz`, `format` |
| `sdk` | ops | `version`, `config` |
| `weather` | ops | `current`, `forecast` |
| `network` | ops | `status` |
| `system` | ops | `info`, `power` |
| `ai` | ops | `status`, `query` |
| `audio` | state | `ultrascripts:state:audio` |

The V2 AI module exposes a stable asynchronous `status`/`query` contract with
text output, schema-backed JSON output, and clear `not_configured` handling.
Audio is the ninth shipped module and uses a bounded state-driven synthesizer
contract. Arbitrary JavaScript execution is deferred and is not part of the
V2.1 module set.

## Documentation Rules

- Treat the V2 and V2.1 contracts as shipped infrastructure.
- Prefer live code, public guide components, and current templates over old phase notes.
- Keep `reference/` stable unless an implementation contract changes.
- Keep `planning/` concise: completed roadmaps are implementation records, while
  new files should describe genuinely active or future work.
- Do not revive retired concepts such as Lite/full profiles, mutation-template priming, invisible-text transport, or action-id-keyed Widget history.
- If a planning document starts explaining an old debate at length, summarize the decision or move the history into a deliberately named archive later.
