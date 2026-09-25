# Phase 4: two pi-v2 templates

A new project includes `ProductLaunch` (45s, 1920x1080, adjustable to 30-60s) and `ScreenTutorial` (60s, 1080x1920, adjustable to 30-90s). They reuse pi-v2 background, typography, cards, scenes and debug boxes, with a clear structure rather than a finished claim or asset. Demo/screen-capture placeholders are red and say DO NOT PUBLISH. Both require real numbered JPGs inside `public/`, a source credit and project-specific copy. The template checker validates key fields, time windows, safe pointer bounds and actual frame files. The render still needs final-pixel and audio QA.

## Product launch

Structure: problem 0-8s, real demonstration 8-27s, two substantiated features 27-39s, CTA 39-45s. Set `duration` in your props to 30-60. The composition metadata and four scene boundaries scale from the 45s version; inspect the pacing at your chosen length. Never invent a product claim. Example Remotion props:

```json
{"duration":45,"handle":"@brand","product":"Product name","problem":"Real pain point","feature1":"Verified feature","feature2":"Another verified feature","cta":"Try the demo","demoDir":"launch-frames","demoCount":540,"demoCredit":"Original capture by brand"}
```

Put JPGs `public/launch-frames/001.jpg` through `540.jpg`. This demo frame component advances at 30 fps after the scaled 9s reveal; confirm frame continuity, timing and source rights. Use `template launch --spec launch-props.json --out out/checked-props.json` to pass a checked prop file to Remotion. Run:

```bash
node <skill-dir>/scripts/motioncraft.mjs template launch --spec launch-props.json --dir .
npx remotion still src/index.ts ProductLaunch out/launch-still.png --frame 450 --props=launch-props.json
```

## Screen tutorial

Default: three 20s steps. Set `duration` to 30-90 and make the contiguous steps finish at that second; composition metadata follows it. A 920px-wide capture panel fills the middle. The title sits above it and step cards/captions sit below it, not over the UI. Each step points to a capture-relative fractional `(x,y)` (safe bounds x .12-.88, y .12-.85) and zoom 1-1.6. The highlight follows the transformed capture coordinate during the 12-frame focus zoom; confirm it still points at the intended control and is not clipped by the capture panel. Example props:

```json
{"duration":60,"handle":"@brand","title":"How to do the task","captureDir":"tutorial-frames","captureCount":1800,"captureFps":30,"sourceCredit":"Original recording by brand","steps":[{"title":"Open","caption":"Open the project","from":0,"to":20,"x":0.5,"y":0.3,"zoom":1.2},{"title":"Choose","caption":"Select the item","from":20,"to":40,"x":0.7,"y":0.5,"zoom":1.35},{"title":"Finish","caption":"Review the result","from":40,"to":60,"x":0.5,"y":0.7,"zoom":1.15}]}
```

Run `template tutorial --spec tutorial-props.json --dir .`, then inspect actual stills at each step and the exported video at phone size. Adjust captions so they remain short and do not overlap platform chrome. Long or scroll-heavy recordings may need resampling, manual cuts or a different focus path; the template does not detect what the UI says.

For both templates: create a private preflight storyboard and cue annotations, render with a reviewed audio mix, run `qa all` and `qa pixels`, inspect the final PNGs and listen to the final export. Placeholder content, fabricated UI, missing credits or unreadable real screen content are not ready for delivery. The template checker is not a license check and cannot prove the frame sequence corresponds to a real demo.
