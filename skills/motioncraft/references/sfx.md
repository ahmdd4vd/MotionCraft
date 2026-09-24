# Sound effects

All sounds are synthesized by `sfx make` - no sample packs, nothing to license.

## Types

`word_pop`, `icon_pop`, `letter_tick`, `check`, `success`, `slot_tick`, `bubble`, `type`, `button`, `whoosh_in`, `whoosh_out`, `swoosh`, `riser`, `impact`, `confetti`, `logo_sting`

## Packs

`soft-pop` (pi-v2 default), `glass`, `paper`, `digital-soft`, `organic-wood`. Same cues, different material.

## Cue file

```json
[
  { "type": "whoosh_in", "t": 3.35 },
  { "type": "word_pop",  "t": 4.8, "gain": -2 },
  { "type": "check",     "t": 10.0 },
  { "type": "riser",     "t": 11.2, "end": 12.9 },
  { "type": "impact",    "t": 12.9, "snap": true }
]
```

Fields: `type`, `t` (seconds), optional `gain` (dB), `pitch`, `pan`, `end` (for risers), `snap` (snap to the beat grid when `--bpm` is given).

```bash
node <skill-dir>/scripts/motioncraft.mjs sfx make --cues sfx.json --bpm 93 --pack soft-pop --out audio/sfx.wav
node <skill-dir>/scripts/motioncraft.mjs beat snap sfx.json --grid audio/beatgrid.json --maxMs 80
```

`--density 0.6` randomly thins the small repeated sounds (word pops, ticks, typing).

## Rules

- One sound per meaningful visual event: a scene change, a card landing, a check, the big reveal. Not every word.
- Put the cue 1-2 frames before the visual, not after.
- A riser always resolves into an impact or the drop.
- If the voice is talking, keep SFX small. Save big sounds for pauses.
- `mix` places the SFX track at -4 dB relative; adjust with `--sfxDb`.
