# 17 - Provider AI Phase Plan

Provider AI is the active Phase 9 Frontier capability after the Phase 8 Story Card / heartbeat cleanup.

The goal is to let AI Dungeon scripts ask a hosted language model for sidecar reasoning without hijacking the story model or smuggling tool requests through story text.

## V1 Scope

Start with a conservative hosted-provider bridge:

- `providerAI.chat({ provider, model, messages, temperature?, maxTokens?, responseFormat? })`
- `providerAI.models({ provider? })`
- `providerAI.testConnection({ provider })`

OpenRouter is the likely first provider because it gives access to many models through one user-supplied key. Before implementation, verify the current official provider API details and model-list behavior.

## Product Rules

- Scripts never receive API keys.
- Keys live in BetterDungeon settings / extension storage.
- If no key is configured, calls fail with a clear `not_configured` error.
- Users should be able to disable Provider AI globally.
- Start with strict request caps: max messages, max content length, max tokens, and per-origin/per-adventure rate limits.
- Responses should include provider, model, usage if available, finish reason if available, and normalized message content.
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

Active as Phase 9. Start with the smallest OpenRouter-backed vertical slice: configuration status, one chat call, normalized response, and a paste-ready live suite. Before implementation, verify the current official OpenRouter API details and model-list behavior.

## Next Step

Implement the smallest OpenRouter-backed vertical slice: configuration status, one chat call, normalized response, popup key/status plumbing, and a paste-ready live suite.
