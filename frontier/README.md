# Frontier — Planning Docs

> Internal design + implementation plan for **Frontier**, the bidirectional message-channel platform replacing BetterScripts. Ships as part of **BetterDungeon V2**.

## Read order

| # | File | What it covers |
|---|------|----------------|
| 00 | [Overview](./00-overview.md) | Vision, scope, relationship to BD V2, locked-in design decisions |
| 01 | [Architecture](./01-architecture.md) | Three-layer model, file layout, component responsibilities |
| 02 | [Protocol](./02-protocol.md) | Reserved card namespaces, state-card schema, action-ID history convention, heartbeat, availability detection |
| 03 | [Modules](./03-modules.md) | Module API (Lite), Scripture reference, extensibility roadmap |
| 04 | [Implementation Plan](./04-implementation-plan.md) | Phase order, file-by-file breakdown, V2 release coordination |
| 05 | [Risks & Open Questions](./05-risks-and-open-questions.md) | Tracked risks, unresolved decisions, follow-up work |
| 06 | [Full Frontier Protocol](./06-full-frontier-protocol.md) | Two-way envelope protocol, request/response schemas, GC, idempotency (Phase 4) |
| 07 | [Scripture Test Suite Archive](./07-scripture-ai-dungeon-test-suite.md) | Completed Phase 3 validation summary + archived paste-ready suite |
| 08 | [Full Frontier Test Suite Archive](./08-full-frontier-ai-dungeon-test-suite.md) | Completed Phase 4 validation summary + archived paste-ready suite |
| 09 | [WebFetch Test Suite Archive](./09-webfetch-ai-dungeon-test-suite.md) | Completed Phase 5 validation summary + archived paste-ready suite |
| 10 | [WebFetch Phase 5 Validation](./10-webfetch-phase-5-validation.md) | Final sign-off record for hardened WebFetch |
| 11 | [Frontier Test Suites](./11-test-suites.md) | Active-vs-archived test-suite index and rerun policy |

## One-paragraph summary

**Frontier** is a standardized, cards-only communication channel between AI Dungeon scripts (sandboxed) and BetterDungeon (browser-privileged). Scripts publish module-specific state to reserved `frontier:state:*` story cards; BD reads them via a WebSocket interceptor and renders or acts on them. Modules may ALSO declare ops — scripts enqueue requests on a `frontier:out` card and BD writes responses to per-module `frontier:in:<module>` cards. V2 ships the full two-way platform along with three first-party modules: **Scripture** (widgets, state-only), **WebFetch** (HTTP requests from the sandbox), and **Clock** (real-world time). Widget state uses a **live-count history** pattern so undo / retry / continue / edit all "just work" without the script doing anything special. The whole system rides on AI Dungeon's native story-card + subscription wire, including the write path — Core reuses captured GraphQL mutation templates via deep-override replay, sidestepping auth / endpoint / CSRF concerns entirely.

## Status

- [x] Architectural direction locked — cards-only, live-count history (see [Overview § Locked-in decisions](./00-overview.md#locked-in-decisions))
- [x] Protocol v1 drafted — Lite (02) and Full (06)
- [x] Action-ID behavior verified across retry / continue / edit (Phase 0 closed)
- [x] Transport foundation landed — WS + fetch/XHR capture, card + action stream, mutation-template replay. Writes and creates verified in a live adventure with persistence across reload.
- [x] V2 rescoped to include Full Frontier + WebFetch + Clock alongside Scripture
- [x] Phase 1 — transport hardening (write queue, adventure-boundary reset, shortId resolver). Action hydration retained as safety net; AID loads actions exclusively via WS.
- [x] Phase 2 — Core dispatcher + Module Registry hardening (state-card dispatch, enable/disable persistence, ctx API, debug mode)
- [x] Phase 3 — Scripture module (state-only reference). Live AI Dungeon Scripture suite passed 10/10 on 2026-04-22.
- [x] Phase 4 — Full Frontier envelope protocol. Live AI Dungeon Full Frontier suite passed, including reload-mid-pending, on 2026-04-22.
- [x] Phase 5 — WebFetch module. Live AI Dungeon suite passed, including denied-origin consent, on 2026-04-23.
- [ ] Phase 6 — Clock module
- [ ] Phases 7–10 — feature manager, UI filtering, guide rewrites, release

## Current focus

Phase 5 is closed. Current work is **Phase 6 - Clock module**, the small deterministic ops reference that follows WebFetch.

## Test suites

- Latest completed sign-off: [Phase 5 WebFetch](./09-webfetch-ai-dungeon-test-suite.md) and [its final validation record](./10-webfetch-phase-5-validation.md).
- Archived regression suites: [Phase 3 Scripture](./07-scripture-ai-dungeon-test-suite.md), [Phase 4 Full Frontier](./08-full-frontier-ai-dungeon-test-suite.md), and [Phase 5 WebFetch](./09-webfetch-ai-dungeon-test-suite.md).

## Design principles

- **Cards-only transport.** Everything round-trips through AI Dungeon's own story-card + subscription system. No side channels. Crash recovery, cross-tab continuity, and multi-device handoff are free.
- **One step at a time.** Transport hardening → Core + modules → Full envelope → ops modules → polish. Each phase has a standalone acceptance criterion.
- **Multiplatform by default.** Every design choice must work on Chromium (Chrome/Edge), Gecko (Firefox), AND Android WebView. No platform-specific shortcuts without a documented fallback.
- **No extra boilerplate for authors.** The Frontier Library snippet is tiny. No Context Modifier, no invisible characters, no hand-rolled framing.
- **Registry / sandboxing / third-party modules are explicit non-goals for V2.** V2 ships the platform and three first-party modules. Trust boundaries for third-party code are a post-V2 epic.
