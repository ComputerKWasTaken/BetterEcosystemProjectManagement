# Conduit

> Design doc and marketing concept for the **Conduit** name as a replacement for Frontier.

## Name Analysis

**Conduit** — a channel through which something is conveyed. Water through a pipe. Electricity through a cable. Data through a bridge. The word is clean, singular, and carries an inherent sense of _flow_.

Unlike the other candidates, Conduit is abstract. It does not reference AI Dungeon directly, and it does not reference scripting. It describes what the system _is_ at its most essential: a passage between two sides.

## Marketing Focus: Seamless, Invisible Infrastructure

Conduit positions the system as **elegant plumbing that disappears when it works.** The core message is about seamlessness — data flows between scripts and the extension as naturally as if the boundary did not exist.

### Positioning Statement

> Conduit is BetterDungeon's two-way bridge between AI Dungeon scripts and extension-side capabilities. Scripts publish state, request data, and render UI through Conduit — and BetterDungeon answers. The channel is always open. The protocol is invisible. The result is a script that can do anything the browser can.

### Core Narrative

The best infrastructure is the kind you forget is there.

Conduit is not a product you interact with — it is the reason your script can ask for the weather and get an answer. It is the reason your story can render a health bar that updates every turn. It is the reason an NPC can think with a hosted AI model and respond in character.

You do not "use" Conduit the way you use a tool. You write a script, and Conduit is why that script can reach beyond the dungeon walls. It is the channel. The passage. The bridge that is always open.

For scenario creators, the experience is:

1. Write a script that references Conduit modules.
2. BetterDungeon is installed. Conduit is there.
3. The script works. Data flows. UI renders. Responses arrive.

There is no setup ceremony, no connection handshake the creator needs to manage, no mode to activate. The heartbeat signal confirms Conduit is present, and from that point forward, the channel is open.

### Tagline Candidates

| Tagline | Angle |
|---------|-------|
| **"The channel is open."** | Confident, simple. Implies readiness and reliability. |
| **"Flow, not friction."** | Emphasizes the seamless developer experience. |
| **"Between your script and everything else."** | Descriptive, positions Conduit as the bridge. |
| **"Invisible when it works. Indispensable when you need it."** | Dual promise of reliability and power. |
| **"Where scripts meet the world."** | Poetic, positions Conduit as the meeting point. |

### Target Audience

**Primary:** Developers and technically-minded creators who appreciate clean abstractions. Conduit appeals to people who value elegance and simplicity in tooling.

**Secondary:** The broader AI Dungeon community through the scenarios Conduit powers. The name does not need to be understood by players — it is infrastructure branding, like "WebKit" or "Electron." Creators know the name; players experience the result.

**Tertiary:** Potential ecosystem partners or third-party module developers. Conduit sounds professional and platform-grade, which matters if BetterDungeon ever opens the module system to external contributors.

## How the Name Maps to the Technical System

| Conduit Concept | Technical Reality |
|---|---|
| "The conduit" | The full transport + core + module runtime currently called Frontier |
| "Opening the conduit" | BetterDungeon detecting an adventure and writing `conduit:heartbeat` |
| "Conduit modules" | The 9 first-party modules: Scripture, WebFetch, Clock, SDK, Geolocation, Weather, Network, System, AI |
| "Sending through the conduit" | Writing request envelopes to `conduit:out` |
| "Receiving through the conduit" | Reading responses from `conduit:in:<module>` |
| "State flow" | Published state cards like `conduit:state:scripture` |
| "Heartbeat" | `conduit:heartbeat` — the pulse that confirms the conduit is open |

### Card Title Migration

Under this name, reserved story card titles would become:

- `conduit:heartbeat`
- `conduit:state:<name>`
- `conduit:out`
- `conduit:in:<module>`

Story card type would become `Conduit`.

Note: "Conduit" produces the shortest card prefixes of the three candidates (7 characters vs. 11 for Ultrascripts and Dungeonwire). This is a small but real ergonomic advantage for script authors who type these titles.

## Visual and Branding Direction

- **Tone:** Clean, minimal, confident. Think architectural diagrams, not fantasy art. Conduit is the name that says "we built something real and it works."
- **Iconography:** Two parallel lines with a flowing connection between them — like a bridge cross-section or a pipe diagram. Alternatively: a simple glyph of two endpoints with a smooth arc connecting them. Avoid busy imagery; the brand is about simplicity.
- **Color association:** Cool steel blue or silver on dark. Metallic but not cold. The visual language says "precision engineering" while staying compatible with BetterDungeon's existing dark theme.
- **Typography:** Geometric sans-serif with generous letter-spacing. "CONDUIT" in all-caps is clean and balanced. The word has two syllables with equal visual weight, which makes it naturally pleasant as a wordmark.

## Strengths

- **Universal.** The name is not tied to AI Dungeon specifically, which gives it room to grow. If BetterDungeon ever supports another platform, Conduit works just as well there.
- **Short and clean.** 7 characters. Easy to type, easy to say, easy to remember. Produces the shortest card title prefixes.
- **Professional tone.** Conduit sounds like a real platform name. It carries weight in technical contexts without sounding overwrought.
- **Metaphor is perfect.** A conduit is literally a channel through which something flows. That is exactly what the system does — it channels data between scripts and the extension.
- **No collision risk.** While "conduit" is a real English word, the specific use as a product name in the AI Dungeon extension space is uncontested.
- **Extensible vocabulary.** "Conduit module," "Conduit-powered," "open the conduit," "conduit channel" — the derived terms all sound natural.

## Risks

- **Generic.** "Conduit" is a common English word. It does not immediately signal AI Dungeon, scripting, or even gaming. First-time users may need context to understand what Conduit is. This is a branding challenge, not a fatal flaw — many successful platforms have generic names (Chrome, Electron, Spark, Flux).
- **Discoverability.** Searching "Conduit" alone returns results for electrical conduit, plumbing, and several other software projects. SEO and community messaging would need to pair it with "BetterDungeon" consistently: "BetterDungeon Conduit."
- **Less personality.** Compared to Ultrascripts (energetic) or Dungeonwire (evocative), Conduit is more reserved. It prioritizes professionalism over excitement. This is a strength for some audiences and a weakness for others.
- **Existing software uses.** There are other projects named "Conduit" in different domains (a Matrix homeserver, a Kafka connector). No direct conflict in the AI Dungeon space, but worth noting for broader visibility.

## Summary

Conduit is the architect's name. It says: _there is a clean, reliable channel between your script and the capabilities it needs, and you do not have to think about how it works._ The marketing focus is on seamlessness, elegance, and the invisible quality of good infrastructure. It works best if BetterDungeon's messaging positions the system as a professional-grade platform that creators can trust — the kind of foundation you build on without worrying whether it will hold.
