# Frontier — Planning Docs

> Internal design + implementation plan for **Frontier**, the bidirectional message-channel platform replacing BetterScripts. Ships as part of **BetterDungeon V2**.

## Read order

| # | File | What it covers |
|---|------|----------------|
| 00 | [Overview](./00-overview.md) | Vision, scope, relationship to BD V2, locked-in design decisions |
| 01 | [Architecture](./01-architecture.md) | Three-layer model, file layout, component responsibilities |
| 02 | [Protocol](./02-protocol.md) | Card families, envelope shape, availability detection, multi-turn async, versioning |
| 03 | [Modules](./03-modules.md) | Module API, Scripture reference, extensibility roadmap |
| 04 | [Implementation Plan](./04-implementation-plan.md) | Commit order, file-by-file breakdown, V2 release coordination |
| 05 | [Risks & Open Questions](./05-risks-and-open-questions.md) | Tracked risks, unresolved decisions, follow-up work |

## One-paragraph summary

Frontier is a standardized, bidirectional communication channel between AI Dungeon scripts (sandboxed) and BetterDungeon (browser-privileged) over **two complementary transports**: a **story-card channel** (persistent state, async request/response, survives session refresh) and an **invisible-text channel** (ephemeral per-turn data, naturally reverts with undo/retry). Capability is delivered via **modules** that plug into Frontier Core; the widget system (rebranded **Scripture**) becomes the first such module, shipped by default. The long-term vision is to unshackle the scripting sandbox — letting authors build scripts that reach the network, the filesystem, local AI, or anything BetterDungeon can mediate.

## Status

- [x] Architectural direction locked (five rounds of decisions — see [Overview § Locked-in decisions](./00-overview.md#locked-in-decisions))
- [x] Protocol v1 drafted (dual transport)
- [x] MVP scope defined (Transport + Core + Scripture, both channels, no schema compression)
- [ ] Text codec: manual port of Robyn's `invisible-unicode-decoder` → `services/frontier/text-codec.js`
- [ ] Implementation — not started; blocked on this plan being approved
- [ ] BD V2 release coordination
