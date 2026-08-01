# Audio Module Concept

Status: **Concept draft — not scheduled**

This is one of two module concepts (with the
[JavaScript module](./javascript-module.md)) intended to take the first-party
module set from eight to ten. Per the [current roadmap](./current-roadmap.md)
sequencing rules, implementation waits until a stage explicitly opens for it;
this document only fixes the concept so the eventual build starts from a
settled contract.

## Purpose

Let scripts play music and sound effects. AI Dungeon has no audio at all, so
even simple background loops and event stingers are a large atmosphere upgrade
for scenario authors.

This is deliberately a small module. It is a **state module**, exactly like
Widget's non-interactive side: the script publishes a declarative audio state
card, BetterDungeon renders it — with a speaker instead of a DOM panel.

## What It Is Not

- No interaction events back to the script. Playback state is
  BetterDungeon-side presentation; scripts declare intent and move on.
- No arbitrary remote audio URLs in v1. Sources are the built-in loop library
  and the synthesizer. (Remote sources could later reuse WebFetch's
  blocked-target rules, but that is out of scope.)
- No audio recording, microphone access, or speech.

## Module Shape

State module, id `audio`.

- `stateNames: ['audio']` — reads `ultrascripts:state:audio`.
- `tracksLiveCount: true` — like Widget, playback follows the live turn, so
  scrolling history or retrying a turn resolves to the right entry.

### State card shape

```js
state.ultrascripts.publish('audio', {
  music: {                      // background layer: one looping track
    source: 'loop:tavern',      // built-in loop id
    volume: 0.5,                // 0..1, clamped
    fadeMs: 1500,               // crossfade when the track changes
  },
  effects: [                    // one-shot layer: played once per turn entry
    { source: 'synth', volume: 0.8, synth: { /* patch, see below */ } },
    { source: 'sfx:door_creak' },
  ],
});
```

Rules mirror Widget's validation posture: treat parsed state as untrusted,
validate every field, clamp volumes, cap effect count per turn, and no-op on
malformed state instead of crashing Core.

- Same `music` value across turns → the loop keeps playing untouched.
- Changed `music` → crossfade to the new track.
- `music: null` → fade out.
- `effects` belong to the turn entry they were published with and are played
  once when that entry becomes live; revisiting an old turn does not replay
  its one-shots.

## Sound Sources

### Built-in loop and effect library

A curated set shipped with BetterDungeon (Web Audio–generated or
freely-licensed assets bundled with the extension — no runtime network
fetches):

- Music loops: e.g. `loop:tavern`, `loop:forest`, `loop:dungeon`,
  `loop:battle`, `loop:calm`, `loop:tension`, `loop:mystery`, `loop:rain`.
- Effects: e.g. `sfx:sword`, `sfx:door_creak`, `sfx:coins`, `sfx:thunder`,
  `sfx:heartbeat`, `sfx:chime`, `sfx:footsteps`.

The heartbeat (or an SDK surface) should let scripts discover the available
ids so templates can degrade gracefully when a loop is missing.

### Synthesizer

A small declarative patch format over Web Audio, so authors can craft any
sound they need without shipped assets:

```js
{
  source: 'synth',
  synth: {
    wave: 'square',            // sine | square | sawtooth | triangle | noise
    notes: [                   // simple sequence
      { freq: 440, ms: 120 },
      { freq: 660, ms: 240 },
    ],
    envelope: { attackMs: 5, releaseMs: 80 },
    // optional: filter, detune, repeat
  },
}
```

Declarative-only: no author-supplied audio-callback code. Total patch duration
is capped (e.g. a few seconds for effects, longer for `music` synth loops).

## Player Control

Audio is intrusive in a way widgets are not, so the player stays in charge:

- Per-module enable toggle in the popup like every module, plus a master
  volume slider and a quick mute.
- Browsers block autoplay until a user gesture; the module starts silent and
  begins playback on the first interaction with the page, without erroring.
- Disable/unmount stops all audio immediately; `onAdventureChange` resets
  playback state.

## Why This Is Worth A Module Slot

- Zero-to-one capability: nothing in AI Dungeon or the existing module set can
  make sound.
- Cheap for authors: publish one small state object per turn, same mental
  model as Widget.
- A natural showcase enhancer — Chronos V2 weather could hum `loop:rain`,
  Stateboy could chime on state changes — all optional layers.

## Open Questions

1. Loop library contents and licensing: generate everything with Web Audio
   (no assets, smaller extension) vs. bundling recorded loops (better quality).
2. Exact synth patch surface for v1 — the sketch above, or an even smaller
   `notes`-only format first?
3. Should `effects` support a per-effect `id` for dedupe across re-publishes
   of the same turn, or is entry-scoped playback enough?
4. Android WebView autoplay and background-tab behavior.
5. Whether Widget and Audio should share the history-resolution helper rather
   than duplicating the fallback logic.

## Checklist Alignment

When implementation opens, follow the standard flow in
[modules.md](../reference/modules.md#adding-or-revising-a-module): module under
`BetterDungeon/modules/audio/`, registry registration, load path,
`audio-module` regression suite, BetterRepository guide
(`UltrascriptsAudioGuide.vue`), and heartbeat verification.
