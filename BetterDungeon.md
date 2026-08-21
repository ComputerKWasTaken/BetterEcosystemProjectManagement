# BetterDungeon Project Management

> Release-candidate reference for BetterDungeon V2.1.

## Current Status

BetterDungeon V2.1 is essentially complete across the browser extension and
Android client. Only final polish and release preparation remain, and V2.1 will
release alongside Chronos V2. The release combines the Ultrascripts platform
pass with Navigator, its first-party AI chat surface, confirmed adventure
mutations, and the unified OpenAI-compatible provider backend.

Chronos V2 is the current BetterEcosystem priority and the showcase paired with
the V2.1 release. Stateboy is paused, and Brainiac remains planned for later.

## V2.1 Release Scope

- Reliable heartbeat liveness with persistent `beat` advancement and explicit
  `PC`/`Mobile` platform reporting.
- Nine first-party modules: `widget`, `webfetch`, `clock`, `sdk`, `weather`,
  `network`, `system`, `ai`, and `audio`.
- Bounded synthesized Audio effects and credential-free public HTTPS WebFetch.
- A provider-neutral AI executor backed by one OpenAI-compatible transport for
  Gemini, OpenRouter, and remote Custom HTTPS endpoints.
- The unchanged public `ai.status`/`ai.query` contract, including the 12,000
  character single-shot prompt limit and later-turn response model.
- Navigator multi-turn streaming chat, bounded adventure grounding, typed Story
  Card research tools, and per-adventure session persistence.
- Proposal-only Navigator mutations with explicit player approval, read-version
  conflict checks, server read-back, and synchronized Read-only mode.
- Desktop overlay and touch-first Android Navigator interfaces.
- Chromium, Firefox/Gecko, and Android WebView support.

## Settled Product Boundaries

- Navigator is player-initiated. Scheduled, event-triggered, and unattended
  Automations are cancelled.
- V2.1 does not provide Navigator Undo or a durable mutation audit log. Applied
  changes are verified from the server; Story Card deletion is clearly labeled
  irreversible before approval.
- Provider selection is explicit. BetterDungeon never silently fails over
  between Gemini, OpenRouter, and Custom services.
- Local HTTP model endpoints, arbitrary scenario-supplied JavaScript execution,
  a third-party module marketplace, and a broad TypeScript/bundler migration are
  outside V2.1.

## Ongoing Maintenance

- Keep browser and Mobile behavior aligned when shared runtime files change.
- Preserve the public `ai.query` and Ultrascripts Story Card contracts.
- Run the relevant durable contract and live module suites for changed areas.
- Keep BetterRepository author guides and BetterDungeon examples synchronized
  with implementation behavior.
- Treat new provider services and Navigator capabilities as additive work with
  explicit security and migration review.

## Canonical References

- [V2.1 implementation roadmap](./ultrascripts/planning/current-roadmap.md)
- [Navigator architecture and product contract](./navigator/navigator-design.md)
- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Ultrascripts verification reference](./ultrascripts/reference/verification.md)
- [Documentation sync rules](./ultrascripts/planning/docs-sync.md)
