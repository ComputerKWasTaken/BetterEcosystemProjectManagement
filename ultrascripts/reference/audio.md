# Audio Module Reference

## Status

Audio is a V2.1 module under active development. The basic PC implementation is
available for live testing; it is not release-ready or ported to Mobile yet.

## Contract

Audio is a state module. Scripts publish the complete desired audio state to:

```text
ultrascripts:state:audio
```

The initial schema is:

```json
{
  "v": 1,
  "ambient": {
    "id": "mystery",
    "volume": 0.45
  },
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

`ambient` and `effect` are independent. `ambient: null` stops the loop. A new
effect id plays once over the loop. Setting both to `null`, removing the card,
disabling Audio, or leaving the adventure stops all active playback.

## Ambient Loops

| Track id | Duration | File |
|---|---:|---|
| `cavern` | 6:54 | `loops/cavern.mp3` |
| `cozy` | 2:40 | `loops/cozy.mp3` |
| `mystery` | 3:39 | `loops/mystery.mp3` |
| `nature` | 3:43 | `loops/nature.mp3` |
| `ominous` | 3:04 | `loops/ominous.mp3` |
| `peaceful` | 4:32 | `loops/peaceful.mp3` |
| `tension` | 4:39 | `loops/tension.mp3` |

Ambient volume is clamped to `0..1` and defaults to `0.45`. Changing only
volume reuses the current media element. Changing the id stops and releases the
old track before starting the replacement.

The files were reported as CC0, but their sources, creators, and license records
were not retained. That provenance is not currently verifiable and remains a
release blocker. Each MP3 wrap point also requires live listening because file
length does not guarantee a seamless transition.

## One-Shot Effects

Every effect requires a non-empty `id`. BetterDungeon remembers the last played
id for the current adventure and does not replay it during repeated state
hydration. A script must publish a new id to intentionally play the effect again.

| Field | Initial bounds/default |
|---|---|
| `waveform` | `sine`, `square`, `triangle`, `sawtooth`, or `noise`; default `sine` |
| `frequency` | `20..20000` Hz; required except for `noise` |
| `endFrequency` | optional `20..20000` Hz pitch sweep target |
| `durationMs` | `20..10000`; default `250` |
| `attackMs` | `0..durationMs`; default `5` |
| `releaseMs` | `0..durationMs`; default at most `80` |
| `volume` | clamped to `0..1`; default `0.7` |

The combined attack and release may not exceed the sound duration.

## Playback Lifecycle

Playback begins only after the browser permits media following a pointer, touch,
or keyboard gesture. Ambient tracks stream through an `HTMLAudioElement`; synth
effects use Web Audio. Desired state is retained while playback is blocked and
reconciled after a later gesture.

The Audio module toggle is the initial master stop control. Dedicated volume and
mute settings remain later V2.1 work.
