# Phase 2: timeline audio

The storyboard is the cue source. When editing `brief.scenes`, add events at actual on-screen times in seconds. `storyboard` preserves them. `sfx auto` maps `typing`, `click`, `transition`, `logo_reveal`, `cta`, `check`, `enter`, `exit` to existing synthesized sounds. It puts non-click/typing cues one frame before the visual and disables beat snap so timing stays tied to the event. Explicit `events: []` means intentional silence. Without explicit events, scene-role defaults only mark the hook, reframe, and CTA. `cue` can name one known event near the scene start. An unknown cue is reported, not rendered.

```json
{"role":"proof","headline":"See it work","events":[{"kind":"typing","at":14.2},{"kind":"click","at":15.6},{"kind":"transition","at":18.0}]}
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

`music moods` is a selection aid over existing instrumental presets. Audition before making a track, then choose a distinct sound per video. The existing variety guard blocks a too-similar new track. For voiceover add `--vo vo_clean.wav` to mix. Listen to the entire mix and cue snippets, inspect that each sound corresponds to the actual motion, and adjust the cue JSON or bed level when needed. `qa audio` checks measured loudness/peak but cannot judge taste or voice masking. After listening:

```bash
node <skill-dir>/scripts/motioncraft.mjs mix review --file audio/final.wav --out out/mix-review --approve
node <skill-dir>/scripts/motioncraft.mjs render --comp Main --audio audio/final.wav --review out/mix-review/review.json
```

A changed mix invalidates approval by SHA-256. Rendering with audio stops if the matching review is missing. This is an operator review, not an automated listening test. The source audio still must be checked against final video sync. Avoid cue overload: default cap 24 cues/minute with a 120 ms gap, and 550 ms between loud cues. Lower with `--maxPerMin` and change `--minGap` if the scene needs more space. This isn't audio source separation and doesn't detect a visual event from arbitrary Remotion code: the storyboard must match the actual animation timing. The music arranger rounds up to bars, so it may run longer than the video. `mix --duration <seconds>` trims and fades its last 0.35 s to the exact video length, but refuses a source shorter than the target. Confirm the end in the final rendered file.
