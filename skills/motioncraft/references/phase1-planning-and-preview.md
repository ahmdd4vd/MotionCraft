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
