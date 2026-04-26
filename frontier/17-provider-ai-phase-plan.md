# 17 - Provider AI Phase Plan

Provider AI is the completed Phase 9 Frontier capability after the Phase 8 Story Card / heartbeat cleanup.

The goal is to let AI Dungeon scripts ask a hosted language model for sidecar reasoning without hijacking the story model or smuggling tool requests through story text.

## V1 Scope

Start with a conservative hosted-provider bridge:

- `providerAI.chat({ provider, model, messages, temperature?, maxTokens?, responseFormat?, stop?, timeoutMs? })`
- `providerAI.models({ provider?, query?, limit?, timeoutMs? })`
- `providerAI.testConnection({ provider?, timeoutMs? })`

OpenRouter is the first provider because it gives access to many models through one user-supplied key. The background bridge uses OpenRouter's OpenAI-compatible `/chat/completions` endpoint for chat calls, `/models` for model discovery, and `/key` for validating the stored key during `testConnection`.

## Product Rules

- Scripts never receive API keys.
- Keys live in BetterDungeon settings / extension storage.
- If no key is configured, calls fail with a clear `not_configured` error.
- Users should be able to disable Provider AI globally.
- Start with strict request caps: max messages, max content length, max tokens, and per-origin/per-adventure rate limits.
- Responses should include provider, model, usage if available, finish reason if available, and normalized message content.
- `testConnection` should prove the saved key is valid before reporting success; model discovery alone is not enough because provider catalogs can be public.
- `chat` is marked unsafe so a BetterDungeon reload cannot duplicate a paid model call.
- No automatic story insertion. Scripts decide how to use the result.

## Architecture Sketch

1. `modules/provider-ai/module.js` validates args and dispatches safe, bounded provider requests.
2. A background worker performs the network call so credentials stay out of page-world script code.
3. Provider configuration lives in extension storage.
4. The module returns normalized terminal responses through the existing Full Frontier dispatcher.
5. Provider-specific adapters stay small so OpenRouter does not become the shape of the whole module forever.

## Test Plan

Static and VM tests:

- Missing key returns `not_configured`.
- Invalid messages return `invalid_args`.
- Oversized request returns `invalid_args`.
- Connection test validates the configured key through the provider metadata endpoint.
- Mocked provider success returns normalized assistant content.
- Mocked provider error returns structured provider error.
- Rate limit trips on repeated requests.
- Dispatcher path writes `frontier:in:providerAI`.

Live AI Dungeon tests:

- Heartbeat advertises `providerAI.chat`, `providerAI.models`, and `providerAI.testConnection`.
- `testConnection` succeeds with a configured key.
- `chat` returns a short sidecar answer.
- Missing-key or disabled-provider run fails fast and cleanly.

## Not In V1

- LocalAI. Keep this for the Robyn design pass.
- Letting scripts choose arbitrary HTTP providers.
- Fine-grained prompt templates or scenario-wide AI routing.
- Replacing the AI Dungeon story model automatically.

## Current Status

Completed on 2026-04-26. The OpenRouter-backed vertical slice is implemented and live-validated:

- `providerAI.chat`
- `providerAI.models`
- `providerAI.testConnection` with `/key` validation plus model count
- background-worker OpenRouter bridge with BetterDungeon-held keys
- popup OpenRouter key, default model, status, and connection test controls
- live AI Dungeon suite in [21 - Provider AI AI Dungeon Test Suite](./21-provider-ai-ai-dungeon-test-suite.md), passed with run `provider-ai-mof04zzu`

## Next Step

Move into Phase 10 guide and docs rewrite. Provider AI should be documented as the hosted-model bridge for script-side sidecar reasoning; LocalAI remains deferred for the later Robyn design pass.
