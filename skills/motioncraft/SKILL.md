---
name: motioncraft
description: Make clean, high-taste motion graphics videos (explainers, product promos, tutorials, social reels) with Remotion. Use when the user asks for a motion graphics video, an animated explainer, a promo or launch video, a reel/short with kinetic text, or wants to copy the style of a reference video. Covers research, script, voiceover timing, original music and sound effects, a ready Remotion template with a locked style, automatic overlap QA, and final render.
license: MIT
compatibility: Needs Node.js 18+ and Remotion (installed per project). ffmpeg is bundled through Remotion. Optional - Python 3 (faster-whisper for word timings, librosa for better audio analysis), yt-dlp, tesseract.
metadata:
  version: "0.1.0"
  author: ahmdd4vd
---

# motioncraft

Make motion graphics videos that look designed, not generated. Every video goes through the same loop:
**brief -> research -> script -> voice -> sound -> build -> QA -> render -> feedback**.

All helper commands run through one CLI:

```bash
node <skill-dir>/scripts/motioncraft.mjs <command>
```

`<skill-dir>` is the folder this SKILL.md lives in. Output is JSON unless noted. Run `... help` for all commands.

## Golden rules

1. **Reference first.** Never invent a style from nothing. Use a locked style from `styles/` or analyze a reference video the user gives (`ref get` + `ref report`).
2. **One idea per frame.** One headline, one focus. Headline and hero visual live in separate zones.
3. **Zero overlaps.** No text may touch other text or leave the safe area. `qa overlap` must pass before you show anything.
4. **Everything is timed to voice and beat.** Words appear when they are spoken. Big moments land on the beat or the drop.
5. **Only true facts.** Numbers, names, prices and claims must be checked against a live source right before render. Credit third-party examples on screen (`<Credit>`).
6. **Original or free audio only.** Music is synthesized by the CLI or CC0. Never use licensed tracks.
7. **Fresh vibe each video.** The music variety guard blocks repeating the last preset/key/progression. Do not bypass it with `--force` unless the user asks for the same sound.
8. **Show, then ask.** Share stills or a QA sheet early. Apply feedback, re-run QA, re-render.

## Step 0 - Preflight

```bash
node <skill-dir>/scripts/motioncraft.mjs doctor
```

Doctor checks Node, npm, Remotion, ffmpeg, Python and its audio libraries, yt-dlp, Whisper, tesseract, GPU and free disk, and prints a fallback for anything optional. It never installs anything. If something is missing, tell the user the exact fix it prints. Details: [references/preflight.md](references/preflight.md).

## Step 1 - Brief

Get (or fill with sensible defaults and state them):

- Topic and goal (teach, sell, announce, entertain)
- Audience and language of the voiceover
- Format: 16:9 (default), 9:16 (`--vertical`), or 1:1
- Length (30-90 s is the sweet spot)
- Style: `pi-v2` by default, or a reference video
- Voice: user's own recording, a TTS voice, or text only
- Handle / CTA for the end card
- Delivery target: WhatsApp (<16 MB), Instagram, YouTube, or master

## Step 2 - Research and script

- Research the topic from live sources. Save facts with URLs in `research.md`.
- Write the script with the structure in [references/script-and-structure.md](references/script-and-structure.md): hook (0-3 s) -> reframe -> proof -> how/formula -> CTA -> end card.
- Short sentences. One claim per line. Read it aloud; if it sounds like an ad, rewrite it.
- Mark each line with the visual that carries it.

Topic research: [references/research-and-topic.md](references/research-and-topic.md).

## Step 3 - Reference (when the user gives one)

```bash
node <skill-dir>/scripts/motioncraft.mjs ref get <url-or-file> --dir ref
node <skill-dir>/scripts/motioncraft.mjs ref report --dir ref
```

The report gives cut times, motion energy per second, the color palette, BPM / key / loudness / drop, and a contact sheet (`ref text` adds on-screen text via OCR). Turn it into style knobs, not a copy. How to read it: [references/reference-analysis.md](references/reference-analysis.md).

## Step 4 - Project

```bash
node <skill-dir>/scripts/motioncraft.mjs new my-video --style pi-v2 --handle @user
cd my-video && npm install
```

This copies the Remotion template with the style tokens in `src/style.json`. Tune the feel without touching code:

```bash
node <skill-dir>/scripts/motioncraft.mjs style knobs src/style.json --energy 0.6 --camera smooth
node <skill-dir>/scripts/motioncraft.mjs style check src/style.json
```

Styles and knobs: [references/customization.md](references/customization.md). Style list: `style list`.

## Step 5 - Voiceover and timing

```bash
node <skill-dir>/scripts/motioncraft.mjs vo clean vo.wav
node <skill-dir>/scripts/motioncraft.mjs vo align vo_clean.wav --script script.txt --lang en --out audio/words.json
```

Always read back the transcript. TTS voices often mispronounce names and brand words - fix with phonetic spelling and regenerate that line. Details: [references/voiceover.md](references/voiceover.md).

## Step 6 - Music, SFX, mix

```bash
node <skill-dir>/scripts/motioncraft.mjs music presets
node <skill-dir>/scripts/motioncraft.mjs music audition --duration 52        # 3 short options
node <skill-dir>/scripts/motioncraft.mjs music make --preset <id> --duration 52 --drop 12.9 --out audio
node <skill-dir>/scripts/motioncraft.mjs beat grid --bpm 93 --dur 52
node <skill-dir>/scripts/motioncraft.mjs sfx make --cues sfx.json --pack soft-pop --out audio/sfx.wav
node <skill-dir>/scripts/motioncraft.mjs mix --vo vo_clean.wav --music audio/music.wav --sfx audio/sfx.wav --out audio/final.wav
```

Music sits under the voice, never on top. SFX are small and sparse: one sound per meaningful event. The mix targets -14 LUFS and -1 dBTP. See [references/music.md](references/music.md) and [references/sfx.md](references/sfx.md).

## Step 7 - Build scenes

```bash
node <skill-dir>/scripts/motioncraft.mjs timeline build --words audio/words.json --grid audio/beatgrid.json --out public/timeline.json
npx remotion studio
```

Build scenes in `src/scenes/` from the template components (`Headline`, `Word`, `InlineIcon`, `Scene`, `Camera`, `Zone`, `Card`, `Pill`, `Keycap`, `Strike`, `CheckItem`, `Counter`, `StepCards`, `Callout`, `Frames`, `Logo3D`, `Mascot`, `FloatingShapes`, `EndCard`, `Credit`). Wrap any new text in `<McBox kind="text">` and any new card in `<McBox kind="block">` so QA can see it. Rules and component guide: [references/animation-system.md](references/animation-system.md), [references/typography.md](references/typography.md), [references/taste.md](references/taste.md).

Visual assets (logos, screenshots, icons) must be real and licensed: [references/assets-and-licensing.md](references/assets-and-licensing.md).

## Step 8 - QA (must pass)

```bash
node <skill-dir>/scripts/motioncraft.mjs qa overlap --comp Main
```

This renders a low-res debug pass where every text box is red and every block is green, then flags stacked boxes and text in the margin, with screenshots. Fix every hit. Then render and run the full check:

```bash
node <skill-dir>/scripts/motioncraft.mjs render --comp Main --preset wa --audio audio/final.wav --out out/final.mp4
node <skill-dir>/scripts/motioncraft.mjs qa all out/final.mp4 --comp Main --maxMb 16
```

Open `out/qa/sheet.jpg` and look at it yourself. Checklist: [references/qa.md](references/qa.md).

## Step 9 - Deliver and iterate

Send the video with a two-line note: what it is, and anything you assumed. Ask for feedback by timestamp. Apply it, re-run QA, re-render. Full loop: [references/workflow.md](references/workflow.md).

## When things break

See [references/troubleshooting.md](references/troubleshooting.md) (Chrome/GL errors, fonts, audio drift, file too big, slow renders).

## Licensing note

Remotion is free for individuals and small companies; larger companies need a Remotion company license. Check https://www.remotion.dev/license and tell the user if it applies.
