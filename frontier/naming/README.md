# Frontier Naming Proposals

> AI Dungeon's most recent update is also called "Frontier," so BetterDungeon's two-way communication system needs a new name. These design docs explore three candidates, each with a distinct marketing focus.

## Candidates

| Name | Marketing Focus | Doc |
|------|----------------|-----|
| **Ultrascripts** | Scriptwriter empowerment — "your scripts can do more" | [ultrascripts.md](./ultrascripts.md) |
| **Dungeonwire** | The live connection — "a direct line between your story and the world" | [dungeonwire.md](./dungeonwire.md) |
| **Conduit** | Seamless infrastructure — "the channel is open" | [conduit.md](./conduit.md) |

## Quick Comparison

| Dimension | Ultrascripts | Dungeonwire | Conduit |
|-----------|-------------|-------------|---------|
| **Tone** | Bold, energetic | Immersive, community-rooted | Clean, professional |
| **Audience lean** | Scenario creators | AI Dungeon community | Developers / platform thinkers |
| **Card prefix length** | 11 chars | 11 chars | 7 chars |
| **Platform-agnostic?** | Mostly (scripts are AID-specific) | No (Dungeon is in the name) | Yes |
| **Searchability** | High (unique compound) | High (unique compound) | Medium (common English word) |
| **Personality** | High | High | Moderate |
| **Extensibility** | Good within scripting | Good within AI Dungeon | Good across any platform |

## Context

The system being renamed is the cards-based two-way runtime described in the [Frontier planning docs](../README.md). It includes:

- Transport layer (WebSocket interception, mutation replay, write queue)
- Core runtime (adventure tracking, state dispatch, heartbeat, module lifecycle)
- 9 first-party modules (Scripture, WebFetch, Clock, SDK, Geolocation, Weather, Network, System, AI)

Each design doc explains how the candidate name maps to these technical components and what card title migration would look like.
