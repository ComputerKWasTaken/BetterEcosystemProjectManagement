# Ultrascripts V2.1 Quality Plan

## Purpose

This document defines the cross-cutting quality gates for the active V2.1
Ultrascripts work. Phase sequencing lives in [Current Roadmap](./current-roadmap.md).

## Readiness Matrix

| Surface | V2.1 target | Principal risk | Status |
|---|---|---|---|
| Heartbeat | Per-write beat and PC/Mobile identity | Stale cross-device availability | Ready — verified on PC and Mobile |
| Audio | State-driven synthesized effects | Autoplay, lifecycle, noisy scripts | Complete on PC and Mobile; device-matrix smoke test at release |
| JS | Isolated quota-bound computation | Sandbox escape and resource exhaustion | Provisional pending threat model |
| WebFetch | Prompt-free safe public reads | SSRF and data leakage | Complete and accepted on PC and Mobile |
| AI | Provider-neutral Gemini/OpenRouter execution | Silent blocks, provider coupling, and unexpected data routing | Planned revision |
| Navigator | Typed, reversible adventure mutations | Stale overwrites and automation loops | Planned after Ultrascripts |

## Standard Module Gates

Every changed or new module must answer:

- Is its public contract narrow, versioned, and discoverable?
- Does it degrade clearly when disabled, unsupported, unconfigured, offline, or timed out?
- Are errors stable, branchable, and useful to scripts?
- Are input, output, rate, concurrency, and persistence bounds explicit?
- Does it clean up observers, workers, media, queues, and state on disable/navigation?
- Does PC/mobile behavior match, or is a documented capability difference exposed?
- Do regression fixtures represent hostile inputs as well as normal author use?
- Are settings, references, public guides, examples, and heartbeat advertising aligned?

## Heartbeat Gates

- A heartbeat from another device cannot remain ready after its beat stops advancing.
- Helpers compare the beat once per logical turn and reuse that result in later hooks.
- Retry and other action updates refresh heartbeat even when live count is unchanged.
- The deliberate one-turn detection window and fallback expectation are documented.
- Clean disable improves freshness but correctness survives missing cleanup.
- Multiple active clients and delayed/out-of-order writes are deterministic.
- `PC` and `Mobile` labels are tested at their actual packaging boundaries.

## Audio Gates

- First playback follows browser user-activation rules.
- Global mute/stop and per-module settings remain reachable.
- Synth duration, sequencing, rapid replacement, and concurrent effects are bounded.
- Invalid synth parameters fail without partial playback.
- Adventure exit, feature disable, tab backgrounding, and mobile suspension clean up.
- The module does not accept audio files, remote URLs, or arbitrary Web Audio graphs.

## JS Gates

- Threat model is approved before module implementation is considered committed scope.
- Code cannot reach DOM, page globals, extension APIs, network, storage, or credentials.
- Infinite loops and resource exhaustion terminate inside enforced bounds.
- JSON serialization cannot flood or corrupt the transport.
- No cross-request state or prototype pollution survives one-shot execution.
- Chromium, Firefox, and Android WebView run the same escape suite.

## WebFetch Gates

- Safe public `GET`/`HEAD` needs no per-origin interaction.
- Redirect hops receive the same target validation as the initial URL.
- Private, loopback, link-local, credentialed, extension, and sensitive schemes are blocked.
- Default requests cannot forward cookies, authorization, or arbitrary sensitive headers.
- Query-data leakage guidance is present; request bodies are rejected.
- URL query strings are not logged outside explicit Ultrascripts debug mode.
- Time, byte, response, method, and rate limits remain enforced.

## AI Gates

- Gemini adjustable-filter (`SAFETY`) and provider-policy
  (`PROHIBITED_CONTENT`) outcomes are distinguished and covered by compatibility
  tests.
- Prompt and output blocks surface stable errors with provider diagnostics.
- Interactions text, JSON schema, thinking, timeout, usage, and fallback paths pass.
- Model-specific capabilities are detected or encoded; fallback does not assume parity.
- The public Ultrascripts module contract stays provider-neutral.
- Gemini and OpenRouter both satisfy the shared text/JSON contract, with
  provider-specific capabilities represented honestly rather than assumed.
- Provider keys and settings remain separate, the active provider is visible,
  and switching applies cleanly to subsequent requests.
- Character Presets and every first-party AI consumer work through the shared
  executor and contain no Gemini-only setup or transport assumptions.
- No automatic cross-provider failover sends scenario content to a service the
  player did not select.

## Navigator Gates

- Read, suggestion, and mutation privileges are separate.
- Mutations target stable ids and enforce version/hash preconditions.
- Every applied mutation records reason, before/after values, actor/run id, and undo data.
- Delete and bulk operations receive heightened review and bounded batch size.
- Automation evaluation is idempotent across reloads and multiple clients.
- Cooldowns, budgets, pending-job suppression, failure backoff, and global pause work.

## Review Result Format

Record each review as one of:

- `Ready`
- `Ready with documented limitation`
- `Needs implementation or contract change`
- `Needs regression coverage`
- `Blocked by security/product decision`

For accepted work, capture what changed, why, compatibility impact, test surfaces,
documentation surfaces, and PC/mobile result.
