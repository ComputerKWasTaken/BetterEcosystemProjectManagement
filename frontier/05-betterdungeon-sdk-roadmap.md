# 05 - BetterDungeon SDK Roadmap

> This document covers the next capability layer we want Frontier to ship: a curated BetterDungeon SDK surface for scripts. This is no longer a vague post-V2 curiosity. It is a real planned feature direction.

## Why this matters

Frontier already gives scripts a strong module model:

- publish state cards
- call module ops
- read responses back

What it does not yet give them is a clean, stable "BetterDungeon-aware" helper surface.

That is where a BetterDungeon SDK becomes valuable.

The SDK should let scripts ask questions like:

- what BetterDungeon capabilities are available here?
- what Frontier modules are mounted?
- what version of BetterDungeon am I running?
- what stable helper surfaces can I rely on without touching internals?

That is clever in exactly the right way: useful, composable, and future-friendly.

## The core rule

The BetterDungeon SDK must expose capabilities, not private classes.

Bad version:

- scripts poking `window` for internal objects
- scripts depending on raw class names
- scripts expecting unstable object layouts
- scripts coupling themselves to extension implementation details

Good version:

- a documented SDK module
- a stable set of ops or helper surfaces
- capability-oriented responses
- versioned contracts that BetterDungeon can evolve intentionally

This keeps BetterDungeon flexible while still giving script authors more power.

## What the SDK should be

The SDK should be Frontier's product-integration layer.

It should answer:

- what can BetterDungeon do for me right now?
- what modules are available?
- what optional capabilities are present?
- what safe helper calls are officially supported?

It should become the place for:

- capability introspection
- BetterDungeon version checks
- Frontier runtime metadata
- future curated helper utilities that are too BetterDungeon-specific to belong in generic modules

## What the SDK should not be

It should not be:

- a raw escape hatch into extension internals
- a dumping ground for every convenient helper we can think of
- an undocumented "just call this hidden thing" layer
- a backdoor around Frontier's normal contracts

If we make it sloppy, it will create exactly the maintenance problems we are trying to avoid.

## Suggested first version

The first SDK surface should stay small and obviously useful.

Suggested core capabilities:

- `bd.sdk.version()`
- `bd.sdk.capabilities()`
- `bd.sdk.modules()`
- `bd.sdk.frontier()`

### `bd.sdk.version()`

Purpose:

- let scripts branch safely on BetterDungeon capability era when they truly need to

Expected return shape:

- BetterDungeon version
- Frontier protocol version
- maybe a compact SDK version string

### `bd.sdk.capabilities()`

Purpose:

- provide a stable machine-readable summary of what BetterDungeon officially exposes

Expected return shape:

- available modules
- available helper groups
- optional platform flags where appropriate
- maybe a list of explicitly supported SDK methods

### `bd.sdk.modules()`

Purpose:

- give scripts a clean module inventory without requiring custom heartbeat parsing every time

Expected return shape:

- mounted module ids
- mounted module ops
- maybe state names for state-driven modules

### `bd.sdk.frontier()`

Purpose:

- expose a compact official snapshot of the Frontier runtime from the script author's point of view

Expected return shape:

- protocol version
- enabled state
- current advertised module list
- maybe heartbeat freshness information if that proves useful

## How it should ship

The most natural version is a Frontier module or closely related SDK surface built on the same design principles as the rest of Frontier:

- stable
- documented
- capability-based
- discoverable

Two reasonable implementation shapes:

### Option A - dedicated SDK module

Example:

- module id like `sdk` or `bdsdk`
- scripts call it through normal Frontier request/response patterns

Pros:

- fits the existing Frontier mental model
- easy to advertise through heartbeat
- easy to version explicitly

### Option B - base Frontier helper surface plus optional SDK ops

Example:

- thin script-side helper for common checks
- deeper information exposed through Frontier ops

Pros:

- less repetitive script boilerplate
- can make common capability checks nicer to use

The key point is not which flavor wins first. The key point is that the public surface must stay stable and curated.

## Why this is worth shipping

This is valuable for both sides:

### For script authors

- easier feature detection
- less guesswork
- less need to reverse-engineer BetterDungeon behavior
- cleaner progressive enhancement patterns

### For BetterDungeon

- one official integration layer instead of hidden assumptions
- less accidental coupling to internals
- a safer path for expanding Frontier over time
- a strong product story: BetterDungeon is not only "a set of modules," it is a scripting platform with a real SDK

## Relationship to shipped modules

The SDK does not replace the current modules.

It complements them.

Current modules answer questions like:

- fetch this URL
- tell me the time
- get the weather
- make an AI call

The SDK should answer questions like:

- what can BetterDungeon do here?
- what modules are present?
- what official helper surfaces are available?

That separation keeps the system understandable.

## Relationship to heartbeat

Heartbeat already gives scripts raw runtime discovery.

The SDK should not duplicate heartbeat blindly. It should make the most useful parts easier and more stable to consume.

Good SDK value:

- normalized capability answers
- cleaner script ergonomics
- less repeated heartbeat-parsing boilerplate

Bad SDK value:

- "here is the exact same heartbeat payload again but with another name"

## Initial risk areas

The main risks are not security disasters. They are product-shape risks:

- scope creep
- exposing too much too early
- accidentally freezing internals as public contract
- building something clever but not actually useful

That means the answer is restraint, not fear.

## Recommended rollout

1. Define the smallest official SDK contract we are willing to support.
2. Keep the first version introspection-heavy and helper-light.
3. Ship it through Frontier's existing capability model.
4. Write examples that show why it is better than ad hoc heartbeat parsing.
5. Expand only after real script-author use cases appear.

## Current recommendation

The BetterDungeon SDK should be treated as a real planned Frontier feature.

Recommended priority:

1. finish current doc cleanup, module polish, and regression coverage work
2. keep showcase-script work moving
3. define and ship the first BetterDungeon SDK surface

This is a strong next-step feature because it deepens Frontier as a platform without bloating the core runtime model.
