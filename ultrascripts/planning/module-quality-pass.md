# Ultrascripts V2.1 Quality Plan

## Purpose

This document defines the cross-cutting quality gates for the V2.1 platform and
Navigator work. Phase sequencing lives in [Current Roadmap](./current-roadmap.md).

## Readiness Matrix

| Surface | V2.1 target | Principal risk | Status |
|---|---|---|---|
| Heartbeat | Per-write beat and PC/Mobile identity | Stale cross-device availability | Ready — verified on PC and Mobile |
| Audio | State-driven synthesized effects | Autoplay, lifecycle, noisy scripts | Complete on PC and Mobile; device-matrix smoke test at release |
| WebFetch | Prompt-free safe public reads | SSRF and data leakage | Complete and accepted on PC and Mobile |
| AI | Provider-neutral executor with compatible Gemini/OpenRouter/Custom services | Silent blocks, model drift, and provider coupling | Complete on PC/Mobile; contract suites verified |
| Navigator | Typed, confirmed adventure mutations | Stale overwrites and unauthorized writes | Complete on PC/Mobile |

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
- Compatible text, JSON schema, thinking, timeout, usage, and fallback paths pass.
- Model-specific capabilities are detected or encoded; fallback does not assume parity.
- The public Ultrascripts module contract stays provider-neutral.
- Gemini, OpenRouter, and remote Custom HTTPS services satisfy the shared
  text/JSON contract through one OpenAI-compatible adapter, with service and
  model capabilities represented honestly.
- Character Presets and every first-party AI consumer work through the shared
  executor and contain no Gemini-only setup or transport assumptions.
- No automatic cross-provider failover sends scenario content to a service the
  player did not select.

## Navigator Gates

- Read, suggestion, and mutation privileges are separate.
- Mutations target stable ids and enforce version/hash preconditions.
- Every write remains inert until direct player approval.
- Apply rechecks adventure identity, Read-only state, and current server values.
- Successful writes are read back from the server before being reported applied.
- Story Card deletion is clearly labeled irreversible before approval.
- Navigator Undo, durable mutation audit logs, bulk mutation, and Automations are
  outside the V2.1 contract.

## Review Result Format

Record each review as one of:

- `Ready`
- `Ready with documented limitation`
- `Needs implementation or contract change`
- `Needs regression coverage`
- `Blocked by security/product decision`

For accepted work, capture what changed, why, compatibility impact, test surfaces,
documentation surfaces, and PC/mobile result.
