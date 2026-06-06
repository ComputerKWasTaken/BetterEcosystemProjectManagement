# 00 - Overview

## Purpose

Ultrascripts is BetterDungeon's Story Card based bridge between AI Dungeon
scripts and extension-side capabilities.

It gives AI Dungeon scripts a reliable way to:

- publish structured state to BetterDungeon
- render live BetterDungeon UI through Scripture widgets
- call BetterDungeon modules for browser/network/system/AI capabilities
- receive module responses back inside the AI Dungeon scripting sandbox

The important product framing is simple: Ultrascripts is the platform layer for
BetterDungeon V2 and BetterRepository V2 scripts. It is no longer a speculative
feature or a Scripture-only experiment.

## Private Versus Public Docs

These private docs are for maintainers. They should answer:

- What is the current implementation truth?
- Which files are authoritative?
- What is still unfinished before V2 release prep?
- How do we avoid drifting away from the public docs and templates?

The BetterRepository public docs are for scenario authors and developers. They
should answer:

- What can I build with Ultrascripts?
- How do I paste in the helper and make my first script work?
- Which module should I use for a specific job?
- How do I write examples that survive AI Dungeon's scripting constraints?

The two tracks must agree on facts, but they do not need to repeat each other's
tone or depth.

## Current State

Ultrascripts is about 99% done. The foundation is built:

- unified runtime
- WebSocket and GraphQL observation
- credentials-backed Story Card writeback
- write queue
- heartbeat discovery
- state-card dispatch
- two-way request/response envelopes
- module registry and lifecycle
- popup controls
- all 9 first-party modules
- per-module live regression suites
- public BetterRepository guide set
- Enhanced and Required starter templates
- PC plus mobile follow-through

The remaining work is polish and proof:

- finish the reopened module quality pass
- finish the Scripture-first UI/helper pass
- review other modules only where they improve real showcase scripts
- build Brainiac, Statboy, and Chronos V2
- move into BetterDungeon V2 and BetterRepository V2 release prep

## How Ultrascripts Works

AI Dungeon scripts communicate by reading and writing reserved Story Cards.
BetterDungeon watches AI Dungeon's live traffic, parses those cards, performs
extension-side work, and writes results back through the same card substrate.

Reserved card titles:

| Card | Written by | Purpose |
|---|---|---|
| `ultrascripts:heartbeat` | BetterDungeon | Runtime discovery, module list, protocol metadata |
| `ultrascripts:state:<name>` | Script | Module state publication, especially Scripture |
| `ultrascripts:out` | Script | Batched module requests and response acknowledgements |
| `ultrascripts:in:<module>` | BetterDungeon | Module responses and module-owned inbox data |

All production Ultrascripts-owned Story Cards should use the Story Card type
`Ultrascripts`.

## Mental Model

```text
------------------------------------------------------------+
| Modules                                                    |
| scripture webfetch clock sdk geolocation weather network   |
| system ai                                                  |
+------------------------------------------------------------+
| Core                                                       |
| state cache, live count, heartbeat, registry, dispatch,     |
| module context, request/response coordination              |
+------------------------------------------------------------+
| Transport And Write Path                                   |
| ws-interceptor, ws-stream, baseCredentials, SaveQueueStory  |
| Card mutation, write queue                                 |
+------------------------------------------------------------+
```

Transport observes AI Dungeon and captures the credentials needed for writes.
Core turns those observations into stable runtime state. Modules provide the
capabilities scripts actually use.

## Two Data Flows

Script state flow:

```text
AI Dungeon script writes ultrascripts:state:<name>
-> AI Dungeon broadcasts Story Card changes
-> BetterDungeon transport captures and normalizes the update
-> Core parses JSON and dispatches the state to matching modules
-> modules update BetterDungeon UI or internal state
```

Ops flow:

```text
AI Dungeon script writes a request into ultrascripts:out
-> ops-dispatcher validates the envelope
-> the target module handler runs
-> BetterDungeon writes ultrascripts:in:<module>
-> the script reads the response on a later turn
-> the script acknowledges consumed responses through ultrascripts:out.acks
```

Scripture widget interactions are the one important special case:
BetterDungeon writes widget events into `ultrascripts:in:scripture`, but scripts
acknowledge them by advancing `interactions.ackSeq` in
`ultrascripts:state:scripture`, not by using `ultrascripts:out.acks`.

## Live Count Is The History Key

Ultrascripts tracks both:

- `tail`: highest non-undone action id currently present
- `liveCount`: count of actions whose `undoneAt` is null

Scripture history uses live-count keys, not action ids:

```json
{
  "v": 1,
  "manifest": {
    "widgets": []
  },
  "history": {
    "12": {
      "hp": 75,
      "gold": 120
    },
    "13": {
      "hp": 70,
      "gold": 135
    }
  }
}
```

This matters because undo, restore, rewind, retry, and edit do not all affect
history the same way. Live count is the stable key for "which turn-shaped state
should the widget display right now?"

## Shipped Surface

| Area | Current state |
|---|---|
| Transport | Shipped in `../../BetterDungeon/services/ultrascripts/ws-interceptor.js` and `ws-stream.js` |
| Write path | Shipped through direct `SaveQueueStoryCard` mutations and `write-queue.js` |
| Core | Shipped in `core.js`, `module-registry.js`, `ops-dispatcher.js`, and `envelope.js` |
| BetterDungeon feature integration | Shipped in `../../BetterDungeon/features/ultrascripts_feature.js`, popup settings, and background helpers |
| Modules | 9 first-party modules shipped |
| Tests | 9 module regression suites under `../../BetterDungeon/tests/aid-scripts/` |
| Public docs | BetterRepository Ultrascripts guide set shipped |
| Templates | Enhanced and Required templates shipped |
| Platforms | Chromium, Gecko/Firefox, and Android WebView supported |

## Retired Ideas

Do not use these as active planning language:

- Lite/full runtime profiles
- mutation-template priming
- fallback guessed GraphQL mutations
- invisible-text or zero-width-character transport
- action-id-keyed Scripture history
- a separate heartbeat subsystem
- Provider AI as a separate current module name
- "Ultrascripts might become two-way" phrasing

Those were useful during design and debugging. They are not the current model.

## Current Product Direction

The path to launch is:

1. Finish the module quality pass, starting with Scripture.
2. Keep the Enhanced and Required templates synchronized with the live helper
   contract.
3. Build Brainiac as a Requires Ultrascripts AI/story-card management showcase.
4. Build Statboy as a Requires Ultrascripts stat/state/Scripture showcase.
5. Build Chronos V2 as an Enhanced with Ultrascripts time/weather/widget
   showcase.
6. Use those scripts to finish BetterDungeon V2 and BetterRepository V2 release
   prep.
