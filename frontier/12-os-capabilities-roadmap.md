# 12 - OS Capabilities Roadmap

This note records the post-Clock module discussion after pruning ideas that were interesting in the abstract but weak for AI Dungeon's actual turn-based scripting model.

The bar is simple:

- does this unlock something script creators genuinely cannot do well today?
- does it fit a turn-based game and tool environment?
- can we explain the permission / privacy story without hand-waving?

If a module is flashy but does not clear those bars, it should wait or die.

## Current read

The strongest next capability areas are:

1. `geolocation`
2. `weather`
3. `network`
4. `system`
5. `providerAI`
6. `localAI`
7. `bd.sdk`

The weak or rejected ideas for now are:

- `notify`
- `localStorage`
- `clipboard`
- `downloads`
- `filesystem`
- `share`
- `presence`
- `speech`

Some of those are not bad forever. They are just not earning their place in the near-term Frontier plan.

## Why some ideas got cut

### Notify

This is easy to build, but the turn-based model makes it hard to justify. AI Dungeon scripts are not long-running background agents in the ordinary case, so a script pinging the user outside the page does not solve a real problem often enough to deserve the surface area.

**Decision:** not a priority.

### LocalStorage

Frontier scripts already have state-card storage patterns. A dedicated storage module would mostly duplicate existing capability while adding another abstraction to explain and maintain.

**Decision:** redundant for now.

### Clipboard

Too little value, too much opportunity for weird or invasive behavior.

**Decision:** not worth it.

### Downloads / Filesystem / Share

These sound neat, but they drag Frontier into much more serious trust and safety territory without a strong script-side use case. For now, they are more "browser extension tricks" than "important scripting unlocks."

**Decision:** defer indefinitely unless a real use case appears.

### Presence / Idle

This fits ambient assistants better than a turn-based story/game tool. It is not clear what a script should do with user idleness that feels natural inside AI Dungeon.

**Decision:** not a fit right now.

### Speech / Media

Interesting, but better as a BetterDungeon-native UX feature than a generic script-callable module.

**Decision:** maybe product feature later, not Frontier module priority.

## Approved module directions

These are the module ideas that currently earn their keep.

### Geolocation

**Why it is useful**

- Lets a script ground the world in the player's real location.
- Opens the door to local flavor without forcing the script author to manually ask the user where they live.
- Pairs naturally with Clock and future weather tooling.

**What it unlocks**

- location-aware scenarios
- local sunrise / sunset logic
- region-aware holidays, seasons, prayer times, or travel framing
- "the world reacts to where you actually are" moments

**Privacy posture**

- Explicit permission only
- Clear one-shot or remembered consent
- Strong failure mode when denied

**Suggested ops**

- `geolocation.getCurrent({ highAccuracy?, timeoutMs?, maximumAgeMs? })`

**Risk**

- Medium, mostly privacy-sensitive rather than technically dangerous

### Weather

Weather is worth splitting from geolocation for clarity and ease of use.

**Why it is useful**

- Weather is a common request from script creators.
- A focused module is easier to explain and easier to consume than "first get location, then call WebFetch, then normalize the result."
- Gives a cleaner user-facing capability than raw web lookups for a common case.

**What it unlocks**

- local weather narration
- forecast-aware encounters
- time-of-day plus weather combinations with Clock
- streamlined real-world grounding without raw search logic

**Design note**

Weather may use geolocation and/or configured place input under the hood, but script authors should not need to care.

**Suggested ops**

- `weather.current({ latitude?, longitude?, place? })`
- `weather.forecast({ latitude?, longitude?, place?, days? })`

**Risk**

- Medium

### Network

**Why it is useful**

- Helps scripts and modules decide when live web or provider-backed features are reasonable to attempt.
- Makes degraded-mode behavior much saner.

**What it unlocks**

- "offline mode" behavior
- choosing cached vs live data
- adapting requests on mobile or weak connections

**Suggested ops**

- `network.status()`

**Expected shape**

- online / offline
- maybe effective connection type when available
- maybe save-data hints where supported

**Risk**

- Low

### System

This combines the most useful parts of device / power / environment awareness into one support module instead of scattering tiny modules everywhere.

**Why it is useful**

- Lets scripts and future modules adapt to desktop vs mobile vs tablet.
- Useful for local-AI gating later.
- Gives better defaults and cleaner fallbacks.

**What it unlocks**

- platform-sensitive UI decisions
- deciding whether a local model flow is realistic
- tuning request size / behavior to the device class

**Suggested ops**

- `system.info()`
- `system.power()` if battery / charging data is worth exposing separately

**Expected shape**

- platform family
- mobile-ish vs desktop-ish classification
- locale / language
- timezone shortcut if helpful
- maybe battery / charging info if available and useful

**Risk**

- Low to medium

### BetterDungeon SDK

This should not be "scripts can touch arbitrary BetterDungeon classes." That would couple scripts to internals and make refactors miserable. The useful version is a stable, versioned, documented SDK surface exposed through Frontier.

**Why it is useful**

- Gives script authors access to curated BetterDungeon knowledge and helpers.
- Lets scripts feature-detect what BetterDungeon can do without poking at internals.
- Creates a safe bridge for "what capabilities exist?" and "what version am I running?"

**What it unlocks**

- capability introspection
- BetterDungeon version checks
- reusable helper surfaces that do not require each script author to rediscover internals
- a future path for exposing carefully chosen BD utilities without leaking raw classes

**Suggested shape**

- `sdk.version()`
- `sdk.capabilities()`
- `sdk.modules()`
- later, small curated helper ops if they prove broadly useful

**Design note**

Expose capabilities, not classes. The moment a script depends on internal class names or object shapes, BetterDungeon loses the freedom to evolve cleanly.

**Risk**

- Medium, mostly around scope creep and accidental internal coupling

## AI bridges

This is the most strategically exciting area because it solves a real limitation in AI Dungeon scripting: scripts cannot naturally query an LLM for side tasks without awkwardly hijacking the story model or stuffing requests into story text.

If Frontier provides model-query ops, scripts gain access to real LLM reasoning as a proper tool instead of a hack.

### Why AI bridges matter

They unlock tasks like:

- classification
- summarization
- extraction
- translation
- consistency checks
- world-state reasoning
- structured tool routing
- sidecar "assistant brain" behavior that does not consume the story turn in a messy way

That is a huge selling point because it lets script authors use language models intentionally instead of parasitically.

### Provider AI

This is the hosted-model path, with OpenRouter as the most obvious first candidate.

**Why it is useful**

- Easier to implement than local inference
- Gives access to much stronger models than most local devices can run
- Lets script authors build genuinely smart helpers quickly

**Tradeoffs**

- Requires user-provided API keys
- Costs money
- Less seamless than local capability

**What it unlocks**

- best-in-class reasoning and language quality
- fast path to a flagship Frontier feature
- multi-model scripts where AI Dungeon handles story and provider AI handles side tasks

**Suggested ops**

- `providerAI.chat({ provider, model, messages, temperature?, maxTokens?, responseFormat? })`
- `providerAI.models({ provider? })`
- `providerAI.testConnection({ provider })`

**Configuration**

- keys stored in BetterDungeon, never in scripts
- rate limits and per-provider controls live in BetterDungeon settings

**Risk**

- High, but in a manageable "credentials and billing" way rather than a machine-safety way

### LocalAI

This is the local-endpoint path: Ollama, LM Studio, local OpenAI-compatible servers, llama.cpp server, and similar tools.

**Why it is useful**

- Solves the "query a model from a script" problem without forcing cloud dependence
- Strong privacy story
- Very compelling power-user differentiator

**Tradeoffs**

- Harder product problem
- More setup burden
- Device capability matters a lot

**What it unlocks**

- offline or mostly-local model workflows
- private sidecar assistants
- personal memory / scripture / journal helpers
- user-owned model experimentation inside Frontier

**Suggested ops**

- `localAI.chat({ provider, model, messages, temperature?, maxTokens? })`
- `localAI.models()`
- `localAI.status()`

**Risk**

- High, but strategically important

**Planning note**

Robyn is especially interested in this area, so it makes sense to hold deeper LocalAI design work until she is in the room.

## Practical direction after the simple modules

Clock, Weather, Network, and System are done. Geolocation has landed locally. The simple, generally useful OS-adjacent modules have earned their place and are no longer the active planning focus.

The best immediate sequence is:

1. Update public-facing guides and release docs with the completed Provider AI module.
2. Revisit LocalAI after the Robyn design pass.

## Recommendation

My current recommendation is:

1. Treat `providerAI` as the completed hosted-model bridge and document it clearly in Phase 10.
2. Keep `localAI` documented but deferred for Robyn's design pass.
3. Use hosted Provider AI as the proven model-query shape before tackling local inference setup complexity.
4. Treat `bd.sdk` as a future cross-cutting helper surface, not a raw internal-class escape hatch.

That keeps the roadmap grounded in real script-author value:

- first, real-world context
- then, polished common-use helpers
- then, environment awareness
- then, product integration
- then, the huge selling-point AI bridge work
