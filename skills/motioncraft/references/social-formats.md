# Multi-format social output

Build one responsive Remotion composition, then export it for each canvas:

```bash
node <skill-dir>/scripts/motioncraft.mjs new my-video --format 9:16 --platform tiktok
cd my-video && npm install
# After QA and mix review, render all three from the SAME scene code and props:
node <skill-dir>/scripts/motioncraft.mjs render --comp Main --all-formats --preset ig
# Or individually (Reels is also 9:16):
node <skill-dir>/scripts/motioncraft.mjs render --comp Main --format 9:16 --platform reels --preset ig
```

`--all-formats` makes 1:1 IG feed (1080x1080), 4:5 IG feed (1080x1350), and 9:16 TikTok (1080x1920). To export Reels too, run the separate Reels command. `--props path.json` passes content props; format and platform are overlaid at export. Native Remotion preview: `npx remotion still src/index.ts Main out/feed.png --props='{"format":"4:5","platform":"ig-feed"}'`. `new --vertical` is a backward-compatible alias for 9:16.

The shared geometry in `assets/template/src/lib/format.mjs` defines conservative inset defaults: TikTok 72 left / 175 right / 210 top / 350 bottom; Reels 72 / 175 / 190 / 340; feed square 72 / 72 / 96 / 115 and 4:5 72 / 72 / 100 / 135 (pixels). These are **not** platform-certified safe areas. UI overlays vary with captions, audio badges, account features, phone and app versions. Review actual uploads or app previews for the exact target. Keep vital copy/logo inside the safe content rectangle; do not park captions or CTAs below it.

`Center` and `Zone` place content within this rectangle. Headline width and type shrink to fit narrow canvases; Example scene reflows card and checklist from a row to a column; ProductLaunch resizes the proof card; ScreenTutorial moves screen capture and captions into separate safe regions. `EndCard` scales mascot and handle. For a custom scene, use `useFormat()` and `geometry(format,platform)`, and adapt hero size/direction; absolute pixel coordinates from old widescreen scenes do not become responsive on their own. Long text, unusual branding, large screenshots, camera zoom and motion can still cross safe edges. Render critical frames for all outputs and inspect pixels; run overlap QA separately per format, e.g. `qa overlap --comp Main --format 4:5 --platform ig-feed`; the debug check uses that target's safe rectangle but only sees instrumented boxes. Do not call a video upload-ready until the footage, text, logo, audio, credits, and real app overlays pass review.
