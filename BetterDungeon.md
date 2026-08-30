# BetterDungeon Project Management

> Active development and release reference for BetterDungeon V3.0.

## Current Status

The in-progress release formerly planned as V2.1 has been promoted to **V3.0**
and is **not yet released**. V3.0 is the active BetterEcosystem priority.
The former V2.1 scope is functionally complete across the browser extension
and Android client, but the release is reopened for additional Navigator work
that justifies the major-version bump: Navigator **Auto mode** (automatic,
player-visible change application as the default) and a concise redesigned
change-card UI aligned with the tool usage indicators. The Artisan teaser is
hidden until a decision is made on whether Artisan ships at all. The release
combines the Ultrascripts platform pass with Navigator, its first-party AI
chat surface, verified adventure mutations, and the unified OpenAI-compatible
provider backend.

Chronos, the lightweight time/date tracking script, has already been released
independently. Stateboy is paused, and Brainiac remains planned for later.

## V3.0 Release Scope

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
- Navigator **Auto mode (default)**: Navigator applies its proposed changes
  automatically while keeping the player informed through concise change cards,
  preserving read-version conflict checks, serialized writes, and server
  read-back. A Review mode retains explicit per-change approval, and Read-only
  mode still removes mutations entirely.
- A revised, concise change-card UI that matches the tool usage indicators.
- Desktop overlay and touch-first Android Navigator interfaces.
- Chromium, Firefox/Gecko, and Android WebView support.
- The Artisan teaser is hidden from the PC and Mobile popups pending a
  decision on Artisan itself.

## Settled Product Boundaries

- Navigator is player-initiated. Scheduled, event-triggered, and unattended
  Automations are cancelled. Auto mode only applies changes produced by a
  player-initiated turn; it never runs on its own.
- The player course-corrects when necessary, not presumptively: changes apply
  automatically by default, and every applied change stays visible in the
  transcript so the player can react. Story Card deletion remains clearly
  labeled irreversible.
- V3.0 does not provide a durable mutation audit log. Applied changes are
  verified from the server.
- Provider selection is explicit. BetterDungeon never silently fails over
  between Gemini, OpenRouter, and Custom services.
- Local HTTP model endpoints, arbitrary scenario-supplied JavaScript execution,
  a third-party module marketplace, and a broad TypeScript/bundler migration are
  outside V3.0.

## Ongoing Maintenance

- Keep browser and Mobile behavior aligned when shared runtime files change.
- Preserve the public `ai.query` and Ultrascripts Story Card contracts.
- Run the relevant durable contract and live module suites for changed areas.
- Keep BetterRepository author guides and BetterDungeon examples synchronized
  with implementation behavior.
- Treat new provider services and Navigator capabilities as additive work with
  explicit security and migration review.

## Canonical References

- [V3.0 implementation roadmap](./ultrascripts/planning/current-roadmap.md)
- [Navigator Auto mode implementation plan](./navigator/navigator-auto-mode-plan.md)
- [Navigator architecture and product contract](./navigator/navigator-design.md)
- [Navigator verified mutation reference](./navigator/navigator-mutation-contract.md)
- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Ultrascripts verification reference](./ultrascripts/reference/verification.md)
