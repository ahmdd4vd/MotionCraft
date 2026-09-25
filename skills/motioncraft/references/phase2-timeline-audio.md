# Phase 2: timeline audio

The storyboard and structured animation timeline are cue sources. `sfx auto` now creates sparse cues without `events` in the brief: it detects a headline appearance near each scene start and a transition at each subsequent scene boundary. Pass `--timeline public/timeline.json` for precise `events` that name a scene and visual action (`text`, `transition`, `ui_click`, `logo_reveal`, `check`). Alternatively put structured `animations` on a scene with `kind` and absolute `at` seconds or `frame` (at storyboard FPS). Only recognized kinds become sounds. A separate scene's timeline events are ignored.

The mapping is text/headline -> typing, scene transition -> whoosh, UI click -> button, logo reveal -> logo sting, check -> check. All audio lands on the existing synthesized SFX timeline. The system does not inspect Remotion JSX or watch video pixels: the animation data must describe the actual on-screen time. It will not invent a logo or click from prose alone.

For a precise override, put `events` on a scene. An `events` array completely replaces automatic cues for that scene, including boundary and headline cues; `events: []` means intentional silence. The older `cue` field also works when no `events` are supplied. Unknown cue types are reported, not rendered.

```json
{"role":"proof","headline":"See it work","animations":[{"kind":"ui_click","at":15.6},{"kind":"logo_reveal","frame":540}]}
```

Run from the project directory (replace `<skill-dir>` with this folder):

```bash
node <skill-dir>/scripts/motioncraft.mjs storyboard --brief brief.json --out storyboard.json
node <skill-dir>/scripts/motioncraft.mjs sfx auto --board storyboard.json --out audio/auto-cues.json
node <skill-dir>/scripts/motioncraft.mjs music moods --mood premium
node <skill-dir>/scripts/motioncraft.mjs music audition --duration 52 --out audio
node <skill-dir>/scripts/motioncraft.mjs music make --preset cinematic-soft --duration 52 --out audio
node <skill-dir>/scripts/motioncraft.mjs sfx make --cues audio/auto-cues.json --duration 52 --pack soft-pop --out audio/sfx.wav
node <skill-dir>/scripts/motioncraft.mjs mix --music audio/music.wav --sfx audio/sfx.wav --duration 52 --out audio/final.wav
node <skill-dir>/scripts/motioncraft.mjs mix review --file audio/final.wav --cues audio/auto-cues.json --out out/mix-review
```

After `timeline build`, add `--timeline public/timeline.json` to `sfx auto` and rerun `sfx make` for animation events. `music moods` is a selection aid over existing instrumental presets. Audition before making a track, then choose a distinct sound per video. The existing variety guard blocks a too-similar new track. For voiceover add `--vo vo_clean.wav` to mix. Listen to the entire mix and cue snippets, inspect that each sound corresponds to the actual motion, and adjust the cue JSON or bed level when needed. `qa audio` checks measured loudness/peak but cannot judge taste or voice masking. After listening:

```bash
node <skill-dir>/scripts/motioncraft.mjs mix review --file audio/final.wav --out out/mix-review --approve
node <skill-dir>/scripts/motioncraft.mjs render --comp Main --audio audio/final.wav --review out/mix-review/review.json
```

A changed mix invalidates approval by SHA-256. Rendering with audio stops if the matching review is missing. This is an operator review, not an automated listening test. The source audio still must be checked against final video sync. Avoid cue overload: default cap 24 cues/minute with a 120 ms gap, and 550 ms between loud cues. Lower with `--maxPerMin` and change `--minGap` if the scene needs more space. This isn't audio source separation or detection of arbitrary Remotion animation code: keep the structured scene/timeline data aligned with the actual animation timing. The music arranger rounds up to bars, so it may run longer than the video. `mix --duration <seconds>` trims and fades its last 0.35 s to the exact video length, but refuses a source shorter than the target. Confirm the end in the final rendered file.
