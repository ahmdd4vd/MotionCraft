# Phase 1: board, stills, and reusable 3D frames

The board is a scaffold, not an AI script generator. The agent still writes the hook, checks facts, chooses licensed assets, and gets copy approved. Use one plain sentence per scene. A new `brief.json` can start like this:

```json
{
  "topic":"MotionCraft intro",
  "audience":"orang baru kenal motion graphics",
  "goal":"jelaskan hasil dan cara pasang",
  "language":"id", "duration":60, "format":"16:9", "handle":"@pensourceid",
  "cta":"Coba skill-nya",
  "scenes":[
    {"role":"hook","headline":"Cukup ketik satu kalimat","visual":"chat prompt"},
    {"role":"proof","headline":"Lihat hasilnya","visual":"real screen recording","proof":"source link"},
    {"role":"cta","headline":"Coba MotionCraft","visual":"repo/install"}
  ]
}
```

Omit `scenes` for the eight-role default. That default has blank headlines on purpose, so an agent cannot pass invented copy off as approved. Run:

```bash
node <skill-dir>/scripts/motioncraft.mjs storyboard --brief brief.json --out storyboard.json
```

The JSON has start/end and a late-in-scene preview frame for each scene. The Markdown board is for review. After approval, build actual Remotion scenes at those times, then render only one still per scene:

```bash
node <skill-dir>/scripts/motioncraft.mjs preview --dir my-video --board storyboard.json --comp Main --scale 0.35
```

Open every PNG and the contact sheet. The stills show the **current composition**, not a pretend video automatically generated from the board. They are not a substitute for motion/audio review or overlap QA. If a frame shows an entering animation, move its `previewFrame` to a later frame inside that scene and rerun.

## Reorder and retime the rendered video

Start with a timeline-aware composition:

```bash
node <skill-dir>/scripts/motioncraft.mjs timeline init launch --out timeline-launch.json
node <skill-dir>/scripts/motioncraft.mjs timeline edit --board timeline-launch.json --grid audio/beatgrid.json --out timeline-editor.html
```

Open the local HTML. Drag scenes or use arrow buttons, change each duration, and shift beat markers. Export `storyboard.edited.json` and, if you supplied a grid, `beatgrid.edited.json`. Attached scene events scale with the new scene windows. Render the actual edited scene order and duration with no source-code change:

```bash
node <skill-dir>/scripts/motioncraft.mjs render --dir my-video --comp TimelineLaunch --timeline storyboard.edited.json --grid beatgrid.edited.json --props launch-props.json --out out/edited.mp4
```

For tutorials, use `timeline init tutorial` and `--comp TimelineTutorial`. Timeline-aware compositions have built-in `problem`, `demo`, `features`, `cta` launch roles and `intro`, `step`, `outro` tutorial roles. Edit headlines in the JSON. Product copy and real media paths come from props. Sequence windows move actual content blocks; the visible beat marker pulses at shifted beat times. Rerun `sfx auto` with the edited board, make a new mix and review it.

**Limits:** The existing `ProductLaunch`, `ScreenTutorial`, and `Main` compositions remain hand-coded and do not consume this editor's plan. Footage frames advance from each scene's local start: moving or stretching a scene does not intelligently cut or resample source recordings. VO and music are not time-stretched. Shifting beat-grid markers does not move music. Independently synced media, VO, music and external events need separate review and adjustment. Inspect the final rendered pixels and audio; placeholder demo/capture panels are not publishable.

## Cache heavy 3D once

Make an isolated composition (for example `LogoOnly`) containing just the 3D element on a transparent background, at the same canvas size, position and timing as the final scene. The CLI cannot automatically remove a rendered background: test transparency before using the cache as an overlay. Render a short range:

```bash
node <skill-dir>/scripts/motioncraft.mjs cache3d --dir my-video --comp LogoOnly --start 240 --end 329 --fps 30 --scale 1 --sources src/scenes/LogoOnly.tsx,src/components/Three.tsx,src/style.json
```

The command creates lossless PNGs under `public/mc-cache/` and a manifest with hashes of the listed sources, props and render settings. Call it again with unchanged inputs: it returns `cached:true` without WebGL. In the final scene, replace the live 3D element in the same bounds with:

```tsx
import {CachedFrames} from '../components/CachedFrames';
<CachedFrames dir="mc-cache/LogoOnly-<key from output>" start={240} count={90} />
```

The generated `component` field gives exact JSX. If your scene is inside a `<Sequence>`, Remotion's `useCurrentFrame()` is local to that sequence; pass a matching local `start` or put CachedFrames outside it. Always visually compare source and cache at entry, midpoint and exit. **List all source files that affect the 3D pixels**, including textures and token files. A change outside `--sources` cannot invalidate the key; delete the cache or add that file if unsure. Do not cache text/VO with the 3D or a text revision will invalidate the cache too. Re-run overlap QA on the final composed video.
