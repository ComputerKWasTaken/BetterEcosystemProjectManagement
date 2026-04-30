# 23 — Phase 10: Documentation Plan

> Plan for the V2 documentation rewrite. Two deliverables: private internal docs for maintenance/debugging, and public guides on BetterRepository for scenario authors and developers. Locked decisions from planning review included inline.

## Decisions (locked)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Scripture gets its own guide tab.** Not folded into the Frontier guide. | Scripture is the killer feature alongside WebFetch and Provider AI. Its widget reference (9 types, manifest schema, `scriptureSet` API, migration mapping) is too dense to bury inside an overview page. |
| 2 | **Every module gets its own sub-guide.** No collapsing into "one card per module" inside FrontierGuide. Each of the 8 first-party modules (Scripture, WebFetch, Clock, Geolocation, Weather, Network, System, Provider AI) gets a dedicated guide component. | The per-module surface may be small, but distinct setup/usage patterns and code examples deserve their own space. Keeps each guide focused and scannable. |
| 3 | **BetterScripts migration is a standalone guide.** Not a section inside FrontierGuide, not changelog material. | Clean separation: Frontier is the new thing, migration is the bridge from the old thing. Authors who never used BetterScripts don't need to wade through it. |
| 4 | **Existing `docs/00-foundation` through `docs/13-DOM` preserved as-is.** New Frontier and BetterDungeon internal docs go in `14-frontier/` and `15-betterdungeon/`. | The existing docs cover AI Dungeon's platform, not Frontier. They remain useful reference material; no reason to touch them. |
| 5 | **FrontierGuide updated to reflect production status.** "Coming in V2" and "(Preview)" labels removed. Tab promoted to primary. | Docs are written assuming Frontier is live — they ship on a branch and go public with the release. |

---

## Part 1 — Private Documentation (`Project Management/docs/`)

Internal-facing, technically exhaustive. Written for future-us, late-night debuggers, and onboarding contributors. Every file follows a standardized format: **purpose → architecture → API surface → data flow → failure modes → debugging tips.**

### `docs/14-frontier/` — Frontier Internal Reference

| File | Contents |
|------|----------|
| `index.md` | Frontier internal docs hub: read order, file map, quick links. Relationship to the planning docs in `frontier/`. |
| `transport.md` | `ws-interceptor.js`, `ws-stream.js`, `write-queue.js` internals. Shim mechanics (`class extends NativeWebSocket`), postMessage protocol (`BD_FRONTIER_WS`), card diff algorithm, write serialization, retry backoff, optimistic echo, mutation-template capture and replay, enrichment index. |
| `core.md` | `core.js`, `ops-dispatcher.js`, `heartbeat.js`, `module-registry.js`. State-channel dispatch (card-family routing by `frontier:state:*` prefix), ops dispatch (`frontier:out` consumption, dedup, idempotency, GC), adventure scoping, heartbeat coalescing and echo suppression, protocol-version negotiation, debug mode. |
| `modules.md` | Module interface contract (`FrontierModule` shape), handler rules (state vs ops), lifecycle hooks (`onEnable`/`onDisable`/`onStateChange`/`onAdventureChange`), registration flow, enable/disable wiring via `chrome.storage.sync`, `ctx` API reference (`writeCard`, `respond`, `respondError`, `storage`, `log`), idempotency model (`safe` vs `unsafe`). |
| `scripture-internals.md` | `scripture/module.js`, `renderer.js`, `validators.js`. Widget DOM creation pipeline, 9 widget types, alignment zones (left/center/right), density recalculation, layout monitoring, live-count history lookup and fallback chain, manifest reconciliation, HTML/CSS sanitization for `custom` type. |
| `ops-modules.md` | Per-module internals: WebFetch (consent model via `consent.js`, per-origin rate limits, scheme blocklist, header stripping), Clock (format engine, timezone handling), Geolocation (permission flow, `getCurrent` args), Weather (geocoding → Open-Meteo pipeline, forecast assembly), Network (`navigator.connection` surface), System (UA parsing, Battery API, device classification), Provider AI (OpenRouter routing, background worker relay, key storage in `chrome.storage.local`, bounded request shapes, model discovery). |
| `troubleshooting.md` | Known gotchas, debug-mode usage (`Frontier.debug = true`), common failure patterns (heartbeat not writing, card echo loops, stale mutation templates), sessionStorage inspection (`frontier:ops:inflight`), card-state debugging (reading `frontier:out` / `frontier:in:*` in AID's story card UI), mutation replay edge cases, platform-specific quirks (Gecko `fetch` shim, Android WebView MAIN world fallback). |

### `docs/15-betterdungeon/` — Extension Internal Reference

| File | Contents |
|------|----------|
| `index.md` | BetterDungeon internal docs hub: extension architecture overview, file map. |
| `architecture.md` | Extension architecture: `manifest.json` (MV3), content scripts, background worker (`background.js`), popup (`popup.html/js/css`), page-world scripts. Load order and injection timing. Message passing patterns (`chrome.runtime`, `window.postMessage`). |
| `feature-manager.md` | `core/feature-manager.js` design: feature registration, dependency graph (Frontier → modules), toggle persistence via `chrome.storage.sync`, feature initialization lifecycle, relationship to Frontier's module registry. |
| `services.md` | `ai-dungeon-service.js` (GraphQL client surface, mutation-template replay integration, `upsertStoryCard`), `story-card-scanner.js` (DOM-based scanner, known fragility, future deprecation path), `story-card-cache.js` (cache hydration from ws-stream), `loading-screen.js`, `tutorial-service.js`. |
| `popup.md` | `popup.html/js/css` architecture: tab system, feature toggles, Frontier section (master toggle, per-module toggles, WebFetch allowlist panel, Provider AI credentials panel), debug toggle, theme integration. |
| `build-and-deploy.md` | Build pipeline (pure JS, no bundler — per locked decision #10), versioning (`manifest.json` version field), Chrome Web Store submission, Firefox AMO signing and submission, Android APK generation, pre-release checklist (Chromium / Gecko / Android WebView smoke test per Phase 11). |

### `docs/index.md` update

- Add `14-frontier/` and `15-betterdungeon/` to the table of contents.
- Add a "Frontier & BetterDungeon Internals" quick-access block.
- Update document statistics.
- Minor formatting standardization pass.

---

## Part 2 — Public Documentation (`BetterRepository/`)

User-facing, witty, developer-friendly. Follows existing guide formatting: collapsible sections with TOC sidebar, syntax-highlighted code blocks, color-coded module cards, Lucide icon-prefixed headers. Written assuming Frontier is live.

### Guide component inventory

| Component | Tab label | Tab tier | Dot color | Status |
|-----------|-----------|----------|-----------|--------|
| `FrontierGuide.vue` | Frontier | Primary | Teal | Rewrite (teaser → production reference) |
| `ScriptureGuide.vue` | Scripture | Primary | Green | New |
| `WebFetchGuide.vue` | WebFetch | Secondary | — | New |
| `ClockGuide.vue` | Clock | Secondary | — | New |
| `GeolocationGuide.vue` | Geolocation | Secondary | — | New |
| `WeatherGuide.vue` | Weather | Secondary | — | New |
| `NetworkGuide.vue` | Network | Secondary | — | New |
| `SystemGuide.vue` | System | Secondary | — | New |
| `ProviderAIGuide.vue` | Provider AI | Secondary | — | New |
| `MigrationGuide.vue` | Migration | Secondary | — | New (BetterScripts → Frontier) |

### `FrontierGuide.vue` — rewrite

Updated hero (no "Coming in V2"), production language. Collapsible sections with TOC sidebar matching `ScriptsGuide.vue` pattern.

| Section | Icon | Contents |
|---------|------|----------|
| What Is Frontier? | Compass | Platform pitch: bidirectional channel, unshackle the sandbox. What it replaces. |
| Getting Started | Rocket | Step-by-step: install BD V2, paste the base Library, paste a module adapter, run a scenario. Complete runnable example. |
| The Base Library | FileCode | Full base Library code block (syntax highlighted, annotated). Copy-paste ready. |
| How It Works | Layers | Architecture for non-engineers: cards-only transport, live-count history, heartbeat. Simplified. |
| Availability & Graceful Degradation | ShieldCheck | `frontierIsAvailable()` patterns, fallback branching, behavior without BD. |
| Undo / Retry / Edit | History | How live-count history keeps state in sync. Why authors don't need to think about it. |
| Module Overview | Puzzle | Quick-reference grid linking to each module's dedicated guide. |
| FAQ | HelpCircle | Updated quick answers (refreshed from current teaser). |

### `ScriptureGuide.vue` — new

Deep-dive into the widget system. Collapsible sections + TOC sidebar.

| Section | Icon | Contents |
|---------|------|----------|
| What Is Scripture? | LayoutDashboard | Pitch: widgets done right. Replaces BetterScripts' widget layer. |
| Quick Start | Rocket | Minimal example: paste base Library + Scripture adapter → `scriptureSet()` → see widgets. |
| Widget Types | Palette | Reference card per type (all 9): `bar`, `stat`, `badge`, `panel`, `list`, `progress`, `text`, `divider`, `custom`. Schema, example, visual. |
| `scriptureSet()` Reference | Code2 | Full parameter reference. Manifest fields, value fields, alignment, colors, density. |
| `scriptureConfigure()` Reference | Settings | History limit, configuration options. |
| Layout & Alignment | AlignCenter | Left / center / right zones. Density. Responsive behavior. |
| Recipes | Lightbulb | Complete scenario examples: RPG stats bar, inventory system, status dashboard, custom HTML widget. |

### Per-module guides — new (×7)

Each follows a compact template:

```
| Section         | Contents |
|-----------------|----------|
| What Is [X]?    | One-paragraph pitch. |
| Setup           | Any module-specific setup (e.g., Provider AI needs an OpenRouter key). |
| Ops Reference   | Table of ops: name, args, return shape, example. |
| Example         | Complete scenario snippet using the module. |
| Notes & Caveats | Consent model, rate limits, platform quirks, etc. |
```

### `MigrationGuide.vue` — new

Standalone BetterScripts → Frontier migration walkthrough.

| Section | Contents |
|---------|----------|
| What's Changing | High-level: ZW encoding gone, Context Modifier gone, invisible characters gone. |
| Side-by-Side | Old BetterScripts code → new Frontier + Scripture code. Line-by-line mapping. |
| What to Remove | Context Modifier boilerplate, TagCipher/ZW helpers, BetterScripts Library snippet. |
| What to Add | Frontier base Library, Scripture adapter. |
| Field Mapping | Table: old widget field names → new manifest/value field names. |
| Testing | How to verify the migration worked: enable Frontier in popup, check widgets render, verify undo/retry. |

### `GuidesPage.vue` — update

- Import all new guide components.
- Primary tabs: AI Instructions, Plot Components, Story Cards, Scripts, **Frontier** (teal dot), **Scripture** (green dot).
- Secondary tabs: Symbols & Commands, Advanced Settings, **WebFetch**, **Clock**, **Geolocation**, **Weather**, **Network**, **System**, **Provider AI**, **Migration**.
- Wire tab switching and URL query params for all new tabs.

### `ScriptsGuide.vue` — minor update

- Add a callout/banner at the bottom of the intro or Common Patterns section linking to the Frontier guide: *"Looking for widgets, web access, or real-time data? Check out the **Frontier Guide**."*

---

## Execution order

1. **Private docs first.** Write `14-frontier/` and `15-betterdungeon/`, update `index.md`. These are markdown-only and can be reviewed before touching Vue components.
2. **Public FrontierGuide.vue rewrite.** The anchor guide — everything else references it.
3. **ScriptureGuide.vue.** The killer feature guide.
4. **Per-module guides** (WebFetch → Clock → Geolocation → Weather → Network → System → Provider AI). Follows the Frontier planning's phase order.
5. **MigrationGuide.vue.** Bridge doc.
6. **GuidesPage.vue + ScriptsGuide.vue updates.** Wiring and cross-links.
7. **Verification pass.** `npm run dev`, visual check, `npm run build`.

## Verification plan

### Manual verification

1. **Private docs:** Read through each markdown file for accuracy against source code. Cross-reference API surfaces against `core.js`, `module-registry.js`, `ops-dispatcher.js`, and each module's `module.js`.
2. **Public docs:** Run `npm run dev` in BetterRepository and verify:
   - All new guide components render with collapsible sections
   - GuidesPage tab navigation works for all new/updated tabs
   - Code blocks are syntax-highlighted and copy-pasteable
   - All Lucide icons render
   - Responsive layout works at mobile and desktop
   - Code examples match actual Library source
3. **Build check:** `npm run build` succeeds with no errors or warnings.
