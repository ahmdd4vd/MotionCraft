<div align="center">

# motioncraft

**Clean, high-taste motion graphics videos, made by your AI agent with Remotion.**

Give your agent a topic (or a video you like). It researches, writes the script, times every word to the voice, makes original music and sound effects, builds the video, checks every frame for overlapping text, and renders.

```bash
npx skills add ahmdd4vd/motioncraft
```

English · [Bahasa Indonesia](README.id.md)

</div>

## Made with motioncraft

Click a preview to watch the full video with sound.

<table>
<tr>
<td width="50%"><a href="https://github.com/ahmdd4vd/motioncraft/releases/download/v0.1.0/pi-v2.mp4"><img src="media/pi-v2-loop.gif" alt="Agent harness explainer in the pi-v2 style"></a><br><b>Agent harness explainer</b> · 61 s · English · pi-v2</td>
<td width="50%"><a href="https://github.com/ahmdd4vd/motioncraft/releases/download/v0.1.0/hindsight.mp4"><img src="media/hindsight-loop.gif" alt="Hindsight memory explainer"></a><br><b>Hindsight: agent memory</b> · 66 s · Indonesian</td>
</tr>
<tr>
<td width="50%"><a href="https://github.com/ahmdd4vd/motioncraft/releases/download/v0.1.0/impeccable.mp4"><img src="media/impeccable-loop.gif" alt="Impeccable skill explainer"></a><br><b>Impeccable: better AI-made websites</b> · 83 s · Indonesian</td>
<td width="50%"><a href="https://github.com/ahmdd4vd/motioncraft/releases/download/v0.1.0/tutorial.mp4"><img src="media/tutorial-loop.gif" alt="AI agent video tutorial"></a><br><b>Tutorial: make videos with an AI agent</b> · 53 s · Indonesian</td>
</tr>
</table>

## What it does

| | |
|---|---|
| **Locked styles** | 5 ready styles (`pi-v2`, `pi-v2-dark`, `warm-paper`, `mono-editorial`, `tech-neon-soft`), all from one tokens file. Or point it at a video you like and it copies the *feel*. |
| **Voice-synced text** | Words appear exactly when they are spoken (word timings from Whisper, or pauses as a fallback). |
| **Original music** | 7 instrumental presets synthesized on your machine, no licensing. A variety guard stops every video from sounding the same. |
| **Sound design** | 16 synthesized sound effects in 5 packs, snapped to the beat, mixed to -14 LUFS. |
| **Remotion template** | Headlines, UI cards, checklists, counters, step cards, real 3D shapes, mascot, end card. |
| **Automatic QA** | Scans every frame for overlapping text, stacked cards and text in the margins, plus loudness and file-size checks. |
| **Ready to share** | Render presets for WhatsApp (under 16 MB), Instagram, YouTube and a master file. |

## Install

```bash
npx skills add ahmdd4vd/motioncraft
```

Works with any AI agent that supports [Agent Skills](https://agentskills.io) - Claude Code, Codex, Cursor, Gemini CLI, Pi, Hermes Agent and many more (installed with the [skills CLI](https://github.com/vercel-labs/skills), listed on [skills.sh](https://skills.sh)).

Needs **Node.js 18+**. Remotion and the rest are installed per video project. Optional: Python with faster-whisper (word timings), yt-dlp (reference downloads).

## Use it

Just ask your agent:

> Make a 60 second explainer about \<topic\> in the motioncraft pi-v2 style, 16:9, with an English voiceover.

> Here's a video I like: \<link\>. Make one like it about \<topic\>.

The agent follows the loop: **brief → research → script → voice → music & SFX → build → QA → render → your feedback**. You approve the script before any voice or render, and you get stills before the full video.

## The CLI

Everything the skill does is also a plain command:

```bash
node skills/motioncraft/scripts/motioncraft.mjs doctor               # check your machine
node skills/motioncraft/scripts/motioncraft.mjs new my-video --style pi-v2
node skills/motioncraft/scripts/motioncraft.mjs music make --preset dreamy --duration 52 --drop 12.9
node skills/motioncraft/scripts/motioncraft.mjs qa overlap --comp Main
node skills/motioncraft/scripts/motioncraft.mjs render --preset wa --audio audio/final.wav
```

Run `... help` for the full list.

## What's inside

```
skills/motioncraft/
  SKILL.md          the workflow your agent follows
  references/       15 short guides (script, voice, music, typography, QA, taste...)
  scripts/          the motioncraft CLI (pure Node audio engine, analysis, QA, render)
  assets/template/  the Remotion project
  styles/           tokens + style notes for each look
```

## License

MIT - see [LICENSE](LICENSE). Remotion has its own license: free for individuals and small companies, a company license for larger teams. See [remotion.dev/license](https://www.remotion.dev/license).

Credits for the showcase topics and tools: [CREDITS.md](CREDITS.md).
