# 20 - Phase 9 Provider AI Kickoff

Phase 9 brings hosted model calls into Frontier.

The goal is to let AI Dungeon scripts ask a sidecar language model for bounded reasoning tasks without hijacking the story model or smuggling requests through visible story text.

## Scope

V1 is intentionally conservative and OpenRouter-backed:

- `providerAI.chat({ provider, model, messages, temperature?, maxTokens?, responseFormat? })`
- `providerAI.models({ provider? })`
- `providerAI.testConnection({ provider })`

OpenRouter is the first provider because it exposes many hosted models behind one user-supplied key. Provider-specific code should stay adapter-shaped so the module can grow beyond OpenRouter later.

## Product Rules

- Scripts never receive API keys.
- Keys live in BetterDungeon storage.
- If no key is configured, calls return `not_configured`.
- Users can disable Provider AI globally and per module through Frontier settings.
- Requests are capped by message count, content length, max tokens, timeout, and per-adventure rate limits.
- Responses are normalized before returning to scripts.
- Scripts decide what to do with model output; Provider AI never inserts story text automatically.

## Implementation Shape

1. Verify current official OpenRouter API details before coding.
2. Add `modules/provider-ai/module.js` for args validation, rate limits, and Frontier op handlers.
3. Add a background-worker provider bridge so API keys never enter page-world script code.
4. Add settings / storage for API key and defaults.
5. Register Provider AI in `main.js`, `manifest.json`, and the Frontier popup.
6. Add VM tests and a live AI Dungeon suite.

## Acceptance

- Heartbeat advertises `providerAI.chat`, `providerAI.models`, and `providerAI.testConnection`.
- Missing key returns `not_configured`.
- Invalid messages return `invalid_args`.
- Oversized requests return `invalid_args`.
- Mocked provider success returns normalized assistant text, provider, model, usage if available, and finish reason if available.
- Mocked provider errors return structured errors.
- Live `testConnection` succeeds with a configured OpenRouter key.
- Live `chat` returns a short sidecar answer through `frontier:in:providerAI`.

## Out Of Scope

- LocalAI. Keep it for the Robyn design pass.
- Arbitrary provider URLs supplied by scripts.
- Automatic replacement of AI Dungeon's story model.
- Scenario-wide routing or prompt-template systems.
