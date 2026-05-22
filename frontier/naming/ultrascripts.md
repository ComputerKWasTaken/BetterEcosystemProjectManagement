# Ultrascripts

> Design doc and marketing concept for the **Ultrascripts** name as a replacement for Frontier.

## Name Analysis

**Ultra** (beyond, supreme, the highest tier) + **Scripts** (the scripting layer that powers AI Dungeon scenarios).

The name owns the scripting identity. It tells scenario creators: _this is what your scripts become when BetterDungeon is installed._ Every script you write is already an AI Dungeon script — Ultrascripts is what happens when that script can talk back.

## Marketing Focus: Scriptwriter Empowerment

Ultrascripts positions the system as a **power upgrade for scenario creators**. The core message is not about infrastructure or middleware — it is about what creators can now _do_ that they could not do before.

### Positioning Statement

> Ultrascripts turns AI Dungeon scripts into two-way programs. Your script can check the weather, fetch live data, render interactive UI, call hosted AI models, and read real device state — all without leaving the scenario scripting environment you already know.

### Core Narrative

AI Dungeon scripts are powerful, but they have always been one-directional: the script runs, it modifies the story, and then it waits for the next turn. Ultrascripts breaks that boundary. With BetterDungeon installed, a script becomes something more — it becomes an Ultrascript.

An Ultrascript can:

- **Ask and receive.** Request data from 9 built-in capability modules and get structured responses back on the same turn cycle.
- **Render UI.** Push interactive widget layouts through Scripture that BetterDungeon renders natively alongside the story.
- **Sense the world.** Read the player's time zone, weather, network state, locale, and device capabilities to adapt the narrative in real time.
- **Think with AI.** Call hosted language models through Provider AI to power in-story NPCs, summarizers, translators, or creative assistants.
- **Reach the web.** Fetch live data from approved external APIs, with user consent, through the WebFetch module.

The promise is concrete: _write a script, get superpowers._

### Tagline Candidates

| Tagline | Angle |
|---------|-------|
| **"Scripts, upgraded."** | Clean, direct. Positions Ultrascripts as the natural next step. |
| **"Your scripts can talk back now."** | Emphasizes two-way communication — the key technical leap. |
| **"Write a script. Get superpowers."** | Playful, creator-focused. Good for community-facing material. |
| **"Beyond scripting."** | Mirrors the "ultra" prefix. Aspirational. |
| **"The scripting layer that listens."** | Highlights the response/ops side that makes this different. |

### Target Audience

**Primary:** AI Dungeon scenario creators who already write scripts and want more capability.

**Secondary:** Creators who do not script yet but would start if scripting could do dramatically more. Ultrascripts is the reason to learn.

**Tertiary:** Players who encounter Ultrascripts-powered scenarios and want to understand why they feel more alive.

## How the Name Maps to the Technical System

| Ultrascripts Concept | Technical Reality |
|---|---|
| "An Ultrascript" | Any AI Dungeon scenario script that uses `frontier:*` reserved story cards to communicate with BetterDungeon |
| "Ultrascripts runtime" | The transport + core + module stack currently called Frontier |
| "Ultrascripts modules" | The 9 first-party modules: Scripture, WebFetch, Clock, SDK, Geolocation, Weather, Network, System, AI |
| "Heartbeat" | Still heartbeat — the discovery signal that tells a script Ultrascripts is available |
| "Scripture" | Unchanged — the widget/UI rendering module |
| "Ops" | The request/response path through `frontier:out` / `frontier:in:<module>` (card titles would update) |

### Card Title Migration

Under this name, reserved story card titles would likely become:

- `ultrascripts:heartbeat`
- `ultrascripts:state:<name>`
- `ultrascripts:out`
- `ultrascripts:in:<module>`

Story card type would become `Ultrascripts` (capitalized, consistent with the current `Frontier` normalization).

## Visual and Branding Direction

- **Tone:** Bold, electric, high-energy. Think neon accent on dark background.
- **Iconography:** Lightning bolt through a script bracket `⚡{}`; or a glowing pen/quill transforming into a circuit.
- **Color association:** Electric blue or violet — something that says "enhanced" without clashing with BetterDungeon's existing palette.
- **Typography:** Confident sans-serif. "ULTRASCRIPTS" in all-caps works as a wordmark because the word has natural rhythm: _Ultra · scripts_.

## Strengths

- **Self-explanatory.** A new user can guess what Ultrascripts is about: scripts, but better.
- **Creator-facing.** The name speaks directly to the people who will build with it.
- **Scalable.** "Ultrascripts module," "Ultrascripts-powered scenario," "Ultrascripts SDK" — all read naturally.
- **Distinctiveness.** No collision with AI Dungeon's own naming. "Ultra" is not in their vocabulary.
- **Action-oriented.** The name implies doing, building, creating — not passive infrastructure.

## Risks

- **Could sound like a product tier** rather than a platform name. "Ultra" sometimes implies a paid/premium level ("Ultra plan," "Ultra edition"). Messaging needs to clarify this is a capability, not a paywall.
- **The "scripts" suffix is literal.** If Ultrascripts ever extends to non-script-based integrations (e.g., a future API or webhook system), the name becomes slightly narrow. Manageable with sub-branding.
- **Trademark overlap.** "Ultra" is a common prefix. A quick search would be prudent, though the full compound "Ultrascripts" is distinctive.

## Summary

Ultrascripts is a power fantasy name for creators. It says: _the scripts you write are about to become something extraordinary._ The marketing focus is on capability, empowerment, and the tangible leap from one-way scripts to two-way programs. It works best if BetterDungeon's community messaging leans into the "look what I built" culture of scenario creators.
