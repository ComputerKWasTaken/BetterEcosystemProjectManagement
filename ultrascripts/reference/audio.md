# Audio Module Reference

## Status

Audio is a V2.1 module under active development. The synthesizer-only PC
implementation is available for live testing; it is not release-ready or
ported to Mobile yet.

## Scope

Audio generates short sound effects locally with Web Audio. It supports bounded
oscillator tones, pitch sweeps, and generated-noise bursts.

It does not play background music, ambient loops, bundled recordings, remote
files, or arbitrary audio URLs. The earlier bundled-loop experiment was removed
because its size, limited catalog, copyright/provenance burden, and redundancy
with dedicated music services did not justify its value.

## Contract

Scripts publish the complete desired Audio state to:

```text
ultrascripts:state:audio
```

Schema version 1 contains one optional one-shot effect:

```json
{
  "v": 1,
  "effect": {
    "id": "spell-18",
    "waveform": "sine",
    "frequency": 220,
    "endFrequency": 660,
    "durationMs": 500,
    "attackMs": 10,
    "releaseMs": 140,
    "volume": 0.7
  }
}
```

Every effect requires a non-empty `id`. BetterDungeon remembers the last played
id for the current adventure and does not replay it during repeated state
hydration. A script must publish a new id to intentionally play the effect again.

Setting `effect` to `null` stops active effects. Removing the card, disabling
Audio, or leaving the adventure also stops and releases all active sources.

## Synthesizer Fields

| Field | Bounds/default |
|---|---|
| `id` | required unique string; maximum 160 characters |
| `waveform` | `sine`, `square`, `triangle`, `sawtooth`, or `noise`; default `sine` |
| `frequency` | `20..20000` Hz; required except for `noise` |
| `endFrequency` | optional `20..20000` Hz pitch-sweep target |
| `durationMs` | `20..10000`; default `250` |
| `attackMs` | `0..durationMs`; default `5` |
| `releaseMs` | `0..durationMs`; default at most `80` |
| `volume` | clamped to `0..1`; default `0.7` |

The combined attack and release may not exceed the sound duration. Frequency
fields are ignored for generated noise.

## Playback Lifecycle

Browsers may suspend Web Audio until a pointer, touch, or keyboard gesture.
BetterDungeon retains a pending effect while suspended, resumes the context
after a user gesture, and then plays it once.

The Audio module toggle is the initial master stop control. Dedicated volume and
mute settings remain optional later V2.1 work.
