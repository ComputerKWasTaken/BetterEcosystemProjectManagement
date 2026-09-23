# BetterDungeon v2.1 Release Record

## Status

BetterDungeon v2.1 is complete and published on the browser extension and
Android app. All release work is closed. Chronos V2 shipped independently.

## Delivered

- Nine Ultrascripts modules: `widget`, `webfetch`, `clock`, `sdk`, `weather`,
  `network`, `system`, `ai`, and `audio`.
- Persistent heartbeat liveness with explicit `PC` and `Mobile` reporting.
- A provider-neutral AI executor with explicit Gemini, OpenRouter, and remote
  Custom HTTPS selection.
- Navigator streaming chat, bounded adventure grounding and retrieval, three
  change modes, approval-gated permanent deletions, verified writes, and
  per-adventure conversation persistence.
- Gameplay-settings integration on PC and Mobile, with platform-specific
  navigation and input behavior.
- Browser and Android sources consolidated in one BetterDungeon monorepo.
- Protected `preview` promotion, a `dev` contributor workflow, a `release`
  branch for published source, and a GitHub Actions quality gate that validates
  the Node smoke suite, browser package, and Android debug build.
- Final release documentation, public author guidance, store copy, screenshots,
  promotional material, compatibility checks, and release packages.

## Ongoing Reference

This record is historical. Use the [BetterDungeon maintenance reference](../../BetterDungeon.md)
for current project boundaries and the [Ultrascripts references](../README.md)
for implementation contracts and verification guidance. The current follow-on
project is [Stateboy](../planning/stateboy.md).
