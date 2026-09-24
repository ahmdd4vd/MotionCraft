# Music

motioncraft writes its own instrumental music, so there is nothing to license. It's pure Node: no samples, no internet.

## Presets

| Preset | BPM | Key | Feel |
|---|---|---|---|
| `calm-punch` | 102 | F | warm, light groove, marimba |
| `dreamy` | 93 | D | soft, airy, marimba and bells (pi-v2 default) |
| `warm-major` | 98 | G | friendly pop, glockenspiel |
| `lofi-desk` | 84 | Eb | relaxed, dusty drums, pluck |
| `tech-bright` | 112 | A | clean and quick, tight drums, pluck |
| `dark-minimal` | 90 | C | serious, sparse, glock |
| `cinematic-soft` | 88 | Bb | hopeful, very sparse drums |

`music presets` prints the full values and the list of chord progressions.

## Picking a vibe

1. Match the topic. Product launch -> `tech-bright` or `calm-punch`. Story or personal -> `dreamy` or `cinematic-soft`. Tutorial -> `lofi-desk` or `warm-major`. Serious or security topics -> `dark-minimal`.
2. When unsure, run `music audition --duration 52` and let the user pick from 3 short options.
3. Set `--drop` to the second where the video's big reveal happens. The engine builds intro -> groove -> main (-> breakdown -> main) -> outro around it.

## Variety guard

Every track is logged in `~/.motioncraft/music-history.json`. A new track must differ from the last one on at least 2 of: key, BPM (by 6 or more), progression, lead instrument. Otherwise `music make` stops and says why. Change the values; only use `--force` when the user asks for the same sound again.

## Custom spec

For full control pass `--spec music.json`:

```json
{ "preset": "dreamy", "duration": 52, "drop": 12.9, "key": "E", "bpm": 96, "lead": "glock", "levels": { "pad": -8 } }
```

Guardrails: BPM 70-128, swing 0.50-0.68, lead `marimba|glock|pluck|none`. `--stems` also writes each instrument as its own WAV.

## Rules

- Instrumental only. No vocals, chants, or DJ-style drops.
- Music is a bed under the voice. `mix` sets it at -6 dB and ducks it a further 7 dB (plus a small 2.5 kHz dip) while someone is talking.
- Want real recorded music instead? Only CC0 / public-domain tracks, and note the source in the project's credits.
