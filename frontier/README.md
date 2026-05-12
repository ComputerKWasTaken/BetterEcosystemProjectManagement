# Frontier — Planning Docs

> Internal design + implementation reference for **Frontier**, the bidirectional message-channel platform that replaced BetterScripts. Ships as part of **BetterDungeon V2**.

## Read order

| # | File | What it covers |
|---|------|----------------|
| 00 | [Overview](./00-overview.md) | Vision, scope, relationship to BD V2, locked-in design decisions |
| 01 | [Architecture](./01-architecture.md) | Three-layer model, file layout, component responsibilities |
| 02 | [Protocol](./02-protocol.md) | Reserved card namespaces, state-card schema, live-count history convention, heartbeat, availability detection |
| 03 | [Modules](./03-modules.md) | Module API (Full profile), Scripture reference, Library adapters for all 8 modules, extensibility roadmap |
| 04 | [Implementation Plan](./04-implementation-plan.md) | Phase history, file-by-file breakdown, remaining roadmap |
| 05 | [Risks & Open Questions](./05-risks-and-open-questions.md) | Tracked risks (mostly resolved), design decisions, follow-up work |
| 06 | [Full Frontier Protocol](./06-full-frontier-protocol.md) | Two-way envelope protocol, request/response schemas, GC, idempotency |
| 11 | [Frontier Test Suites](./11-test-suites.md) | Current regression suite, sign-off history, and cleanup policy |
| 12 | [OS Capabilities Roadmap](./12-os-capabilities-roadmap.md) | Capability map for OS-adjacent modules, AI bridges, and the future BD SDK surface |
| 22 | [Scripture Interactive Widgets Test Suite](./22-scripture-interactive-widgets-test-suite.md) | Active regression suite for Scripture interactive widgets |
| 23 | [Phase 10 Documentation Plan](./23-phase-10-documentation-plan.md) | BetterRepository public guide plan (sequenced after polish and showcase work) |

### Archived

Completed phase plans and test suites that are no longer actively referenced live in [`archive/`](./archive/):

| File | What it was |
|------|-------------|
| [17 — Provider AI Phase Plan](./archive/17-provider-ai-phase-plan.md) | Completed Phase 9 design and scope |
| [21 — Provider AI Test Suite](./archive/21-provider-ai-ai-dungeon-test-suite.md) | Completed Phase 9 live validation suite |

## One-paragraph summary

**Frontier** is a standardized, cards-only communication channel between AI Dungeon scripts (sandboxed) and BetterDungeon (browser-privileged). Scripts publish module-specific state to reserved `frontier:state:*` story cards; BD reads them via a WebSocket interceptor and renders or acts on them. Modules may also declare ops — scripts enqueue requests on a `frontier:out` card and BD writes responses to per-module `frontier:in:<module>` cards. V2 ships the full two-way platform and 8 first-party modules: **Scripture** (widgets), **WebFetch** (safe web access), **Clock** (real-world time), **Geolocation**, **Weather**, **Network**, **System**, and **Provider AI**. Widget state uses a **live-count history** pattern so undo / retry / continue / edit all "just work" without the script doing anything special. The whole system rides on AI Dungeon's native story-card + subscription wire, including the write path — Core reuses captured GraphQL mutation templates via deep-override replay, sidestepping auth / endpoint / CSRF concerns entirely.

## Status — Core complete

All foundational Frontier work (Phases 0–9) is done and live-tested:

- [x] Architectural direction locked — cards-only, live-count history
- [x] Protocol v1 shipped — Full profile with two-way ops channel
- [x] Action-ID behavior verified across retry / continue / edit (Phase 0 closed)
- [x] Transport foundation landed — WS + fetch/XHR capture, card + action stream, mutation-template replay. Writes and creates verified in a live adventure with persistence across reload.
- [x] Transport hardening (Phase 1) — write queue, adventure-boundary reset, shortId resolver
- [x] Core dispatcher + Module Registry (Phase 2) — state-card dispatch, enable/disable persistence, ctx API, debug mode
- [x] Scripture module (Phase 3) — live AI Dungeon suite passed 10/10 on 2026-04-22
- [x] Full Frontier envelope protocol (Phase 4) — live suite passed, including reload-mid-pending, on 2026-04-22
- [x] WebFetch module (Phase 5) — live suite passed, including denied-origin consent, on 2026-04-23
- [x] Clock module (Phase 6) — live suite passed on 2026-04-23
- [x] Geolocation module — permission and current-location ops validated on 2026-04-23
- [x] Weather module — live suite passed on 2026-04-23
- [x] Network module — live suite passed on 2026-04-24
- [x] System module — live suite passed on 2026-04-24
- [x] Feature manager + popup integration (Phase 7)
- [x] Story Card DOM + GraphQL drift investigation + heartbeat dedupe fix (Phase 8)
- [x] Provider AI module (Phase 9) — live suite passed on 2026-04-26 with run `provider-ai-mof04zzu`

## Remaining roadmap

Five phases remain before BetterDungeon V2 ships:

| Phase | Name | Scope |
|:-----:|------|-------|
| **10** | **Module Polish & Test Scripts** | Polish every module, create a per-module regression test script in `tests/aid-scripts/`, validate new behavior and catch regressions |
| **11** | **Documentation Cleanup** | This refresh pass — clean up planning docs, remove stale planning language, align with production reality ← **current** |
| **12** | **Showcase Scripts** | One useful script per module demonstrating Frontier's power. Aura Cards (AI module), Chronos V2 (Clock + Weather + Scripture), plus new demos for remaining modules. Some are tech demos, some are production-ready tools. |
| **13** | **Mobile Port** | Port Frontier to the Android WebView build. Multiplatform smoke testing across Chromium, Gecko, and Android WebView. |
| **14** | **BetterRepository Documentation** | Write proper developer documentation — core Frontier guide, per-module sub-guides, helper function reference, migration guide. Plan details in [23 — Phase 10 Documentation Plan](./23-phase-10-documentation-plan.md). |

## Test suites

- Current regression suites: [22 — Scripture Interactive Widgets](./22-scripture-interactive-widgets-test-suite.md) and [21 — Provider AI](./archive/21-provider-ai-ai-dungeon-test-suite.md) (archived, still valid for regression checks).
- Per-module test scripts are the next testing milestone (Phase 10).
- Older live-suite scripts and phase kickoff notes were removed after sign-off. Canonical phase outcomes live in this README and [Implementation Plan](./04-implementation-plan.md).

## Design principles

- **Cards-only transport.** Everything round-trips through AI Dungeon's own story-card + subscription system. No side channels. Crash recovery, cross-tab continuity, and multi-device handoff are free.
- **One step at a time.** Transport hardening -> Core + modules -> Full envelope -> ops modules -> polish. Each phase has a standalone acceptance criterion.
- **Multiplatform by default.** Every design choice must work on Chromium (Chrome/Edge), Gecko (Firefox), and Android WebView. No platform-specific shortcuts without a documented fallback.
- **No extra boilerplate for authors.** The Frontier Library snippet is tiny. No Context Modifier, no invisible characters, no hand-rolled framing.
- **Registry / sandboxing / third-party modules are explicit non-goals for V2.** V2 ships the platform and first-party modules. Trust boundaries for third-party code are a post-V2 epic.
