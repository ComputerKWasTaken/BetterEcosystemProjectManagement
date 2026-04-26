# 20 - Phase 9 Provider AI Kickoff

Phase 9 brings hosted model calls into Frontier.

The goal is to let AI Dungeon scripts ask a sidecar language model for bounded reasoning tasks without hijacking the story model or smuggling requests through visible story text.

## Scope

V1 is intentionally conservative and OpenRouter-backed:

- `providerAI.chat({ provider, model, messages, temperature?, maxTokens?, responseFormat?, stop?, timeoutMs? })`
- `providerAI.models({ provider?, query?, limit?, timeoutMs? })`
- `providerAI.testConnection({ provider?, timeoutMs? })`

OpenRouter is the first provider because it exposes many hosted models behind one user-supplied key. Provider-specific code should stay adapter-shaped so the module can grow beyond OpenRouter later.

## Product Rules

- Scripts never receive API keys.
- Keys live in BetterDungeon storage.
- If no key is configured, calls return `not_configured`.
- `testConnection` validates the stored key through OpenRouter's key metadata endpoint before reporting success.
- Users can disable Provider AI globally and per module through Frontier settings.
- Requests are capped by message count, content length, max tokens, timeout, and per-adventure rate limits.
- Responses are normalized before returning to scripts.
- Scripts decide what to do with model output; Provider AI never inserts story text automatically.

## Implementation Shape

1. Verify current official OpenRouter API details before coding. Done.
2. Add `modules/provider-ai/module.js` for args validation, rate limits, and Frontier op handlers. Done.
3. Add a background-worker provider bridge so API keys never enter page-world script code. Done.
4. Add settings / storage for API key and defaults. Done.
5. Register Provider AI in `manifest.json` and the Frontier popup. Done.
6. Add VM tests and a live AI Dungeon suite. Done; live suite passed in [21 - Provider AI AI Dungeon Test Suite](./21-provider-ai-ai-dungeon-test-suite.md).

## Acceptance

- Heartbeat advertises `providerAI.chat`, `providerAI.models`, and `providerAI.testConnection`.
- Missing key returns `not_configured`.
- Invalid messages return `invalid_args`.
- Oversized requests return `invalid_args`.
- Mocked provider success returns normalized assistant text, provider, model, usage if available, and finish reason if available.
- Mocked provider errors return structured errors.
- Live `testConnection` succeeds with a configured OpenRouter key.
- Live `chat` returns a short sidecar answer through `frontier:in:providerAI`.

## Live Sign-off - 2026-04-26

Run `provider-ai-mof04zzu` passed with `checksPass: true` using `inclusionai/ling-2.6-1t:free`.

Validated:

- Heartbeat advertised `providerAI.chat`, `providerAI.models`, and `providerAI.testConnection`.
- `testConnection` returned safe key metadata, model count, and default model.
- `models` returned normalized model metadata.
- Invalid and oversized chat calls returned `invalid_args`.
- A real chat call returned `"Frontier Provider AI is online."` through `frontier:in:providerAI`.

## Out Of Scope

- LocalAI. Keep it for the Robyn design pass.
- Arbitrary provider URLs supplied by scripts.
- Automatic replacement of AI Dungeon's story model.
- Scenario-wide routing or prompt-template systems.
