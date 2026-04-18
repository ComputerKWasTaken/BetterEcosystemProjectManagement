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

## One-paragraph summary

**Frontier** is a standardized, cards-only communication channel between AI Dungeon scripts (sandboxed) and BetterDungeon (browser-privileged). Scripts publish module-specific state to reserved `frontier:state:*` story cards; BD reads them via a WebSocket interceptor and renders or acts on them. For MVP — called **Frontier Lite** — the channel is strictly one-way (script → BD). Widget state uses an **action-ID history** pattern: scripts store `{ actionId: values }` pairs inside their state card, and BD looks up the current action's entry. This makes undo, retry, continue, and edit "just work" because AI Dungeon's action list changes → BD reads a different entry → widgets update. The long-term vision remains to unshackle the scripting sandbox with two-way modules (WebFetch, LocalAI, etc.), but the MVP ships just the one-way Lite platform plus its first module, **Scripture** (widgets).

## Status

- [x] Architectural direction locked — cards-only, one-way, action-ID-keyed (see [Overview § Locked-in decisions](./00-overview.md#locked-in-decisions))
- [x] Protocol v1 drafted (cards only; Lite scope)
- [x] MVP scope defined: Transport (card stream) + thin Core + Scripture
- [ ] **Investigation:** confirm AI Dungeon action-ID stability across retry / continue / edit (Phase 0)
- [ ] Implementation — not started; blocked on this plan being approved
- [ ] BD V2 release coordination

## Design principles

- **Keep it simple, stupid.** MVP is the smallest shippable thing that improves on BetterScripts. Two-way comms, modules as third-party plugins, registries, and sandboxing are all explicit non-goals for now.
- **One step at a time.** File restructure → transport → Scripture-on-action-ID → polish. Each phase has a standalone acceptance criterion.
- **Multiplatform by default.** Every design choice must work on Chromium (Chrome/Edge), Gecko (Firefox), AND Android WebView. No platform-specific shortcuts without a documented fallback.
- **No extra boilerplate for authors.** The Frontier Library snippet is tiny. No Context Modifier, no invisible characters, no hand-rolled framing.
