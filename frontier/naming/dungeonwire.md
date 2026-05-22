# Dungeonwire

> Design doc and marketing concept for the **Dungeonwire** name as a replacement for Frontier.

## Name Analysis

**Dungeon** (AI Dungeon — the game, the world, the creative space) + **Wire** (a direct line, a live connection, a channel that carries signal).

The name is rooted in the product it serves. It does not abstract away from AI Dungeon — it _claims_ the connection. Dungeonwire is the wire running between your story and the outside world.

## Marketing Focus: The Live Connection to AI Dungeon

Dungeonwire positions the system as **the official communication backbone for AI Dungeon scripting.** The core message is about reliability, presence, and always-on connectivity between the game and BetterDungeon's capabilities.

### Positioning Statement

> Dungeonwire is the live wire between AI Dungeon and BetterDungeon. It carries script state, module requests, widget layouts, and AI calls through a persistent two-way channel built on story cards. If BetterDungeon is installed and a scenario uses Dungeonwire, the connection is live.

### Core Narrative

Think of AI Dungeon as a world. Your scripts live inside that world — they run, they shape the story, they react to player input. But they have always been isolated. They cannot see outside the dungeon walls.

Dungeonwire is the line out.

It is a persistent, always-on communication channel that connects what happens inside AI Dungeon to the capabilities that live outside it. When a script needs the current time, the weather, a web API response, or a hosted AI call, it sends a request down the wire. BetterDungeon picks it up, processes it, and sends the answer back — all through the same story-card substrate that AI Dungeon already understands.

The metaphor is physical and intuitive: there is a wire, it connects two endpoints, and data flows through it in both directions.

- **Script-side endpoint:** The scenario script writes to reserved Dungeonwire story cards.
- **Extension-side endpoint:** BetterDungeon's runtime watches those cards, routes requests to modules, and writes responses back.
- **The wire itself:** The transport layer — WebSocket interception, mutation replay, write queue — that makes the connection reliable and invisible.

### Tagline Candidates

| Tagline | Angle |
|---------|-------|
| **"The line between your story and the world."** | Poetic, emphasizes the bridge metaphor. |
| **"Wired in."** | Short, punchy. Implies active connection and presence. |
| **"Your dungeon, connected."** | Direct, product-aware. Ties back to AI Dungeon. |
| **"Two-way. Always on."** | Technical confidence. Emphasizes the live bidirectional nature. |
| **"The signal your scripts have been waiting for."** | Playful double meaning — both the heartbeat signal and the "finally, this exists" moment. |

### Target Audience

**Primary:** AI Dungeon community members who identify with the game's brand and want tools that feel native to the ecosystem.

**Secondary:** Scenario creators evaluating BetterDungeon who want to understand what makes it different. "Dungeonwire" is a conversation starter — _what's Dungeonwire?_ naturally leads to explaining BetterDungeon's capabilities.

**Tertiary:** Players experiencing Dungeonwire-powered scenarios. The name is evocative enough to spark curiosity.

## How the Name Maps to the Technical System

| Dungeonwire Concept | Technical Reality |
|---|---|
| "The wire" | The full transport + core + module runtime currently called Frontier |
| "Wired scenario" | Any scenario whose scripts use Dungeonwire reserved story cards |
| "Signal" / "Heartbeat" | The `dungeonwire:heartbeat` card that advertises availability and mounted modules |
| "Modules" | The 9 first-party modules: Scripture, WebFetch, Clock, SDK, Geolocation, Weather, Network, System, AI |
| "Sending a request down the wire" | Writing a request envelope to `dungeonwire:out` |
| "Getting a response back" | Reading the response from `dungeonwire:in:<module>` |
| "State on the wire" | Published state cards like `dungeonwire:state:scripture` |

### Card Title Migration

Under this name, reserved story card titles would become:

- `dungeonwire:heartbeat`
- `dungeonwire:state:<name>`
- `dungeonwire:out`
- `dungeonwire:in:<module>`

Story card type would become `Dungeonwire`.

## Visual and Branding Direction

- **Tone:** Industrial-meets-fantasy. A telegraph wire strung through a dungeon corridor. Grounded but atmospheric.
- **Iconography:** A stylized wire or cable connecting two nodes — one representing the dungeon (torch, stone arch, scroll) and one representing the extension (gear, circuit, browser). Alternatively: a pulsing signal line, like an EKG or oscilloscope trace, but with a dungeon aesthetic.
- **Color association:** Copper or amber (wire color) on BetterDungeon's dark background. Warm metallic tones convey reliability and permanence.
- **Typography:** Slightly condensed, industrial sans-serif. "DUNGEONWIRE" reads well as a single compound word. Could also stylize as "Dungeon**wire**" with the second half in a contrasting weight or color.

## Strengths

- **Product affinity.** The name is immediately recognizable as belonging to the AI Dungeon ecosystem. It does not sound generic or borrowed from another domain.
- **Memorable compound.** "Dungeonwire" is a single word that tells a story. It is the kind of name people remember and can spell.
- **Metaphor is intuitive.** Everyone understands what a wire does — it connects things and carries signal. The mental model maps cleanly to the real system.
- **Community identity.** AI Dungeon players already call their games "dungeons." A wire _into_ the dungeon resonates with the culture.
- **Searchable.** "Dungeonwire" returns zero results today. It would be entirely owned by BetterDungeon.

## Risks

- **Name is AI-Dungeon-specific.** If BetterDungeon ever expands beyond AI Dungeon (e.g., to Voyage or other platforms), "Dungeonwire" becomes an awkward fit. This is manageable with sub-branding ("Dungeonwire for Voyage") but worth noting.
- **Longer compound word.** At 11 characters, it is longer than "Frontier" (8) or "Conduit" (7). In card titles (`dungeonwire:heartbeat`), the prefix is notably longer. Not a functional problem — card titles are machine-read — but worth considering for developer ergonomics.
- **"Wire" could imply low-level networking.** Developers outside the community might expect Dungeonwire to be a WebSocket library or protocol spec rather than a module runtime. Messaging should lead with capabilities, not transport.

## Summary

Dungeonwire is a world-building name. It says: _there is now a direct line between your story and everything BetterDungeon can do._ The marketing focus is on connection, presence, and the tangible link between the AI Dungeon game world and the extension's capabilities. It works best if BetterDungeon's messaging leans into the immersive, fantasy-adjacent identity of the AI Dungeon community — the wire is not just infrastructure, it is part of the dungeon.
