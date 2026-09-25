# QA

Nothing goes to the user until all of these pass.

## 1. Automatic checks

```bash
node <skill-dir>/scripts/motioncraft.mjs qa overlap --comp Main
node <skill-dir>/scripts/motioncraft.mjs qa all out/final.mp4 --comp Main --maxMb 16
node <skill-dir>/scripts/motioncraft.mjs qa pixels out/final.mp4 --board storyboard.json --dir .
```

`qa overlap` flags only registered debug boxes and cannot prove that the final pixels are collision-free. `qa pixels` samples the actual exported video at scene starts, ends and preview frames, makes a contact sheet, and runs heuristic OCR checks for tiny or cropped text. Inspect every flagged frame at full size and a phone-sized version, then watch the full video.

`qa overlap` renders the composition in debug mode at 1/4 size. Every `McBox kind="text"` is painted light red, every `McBox kind="block"` light green, and the content is hidden. It then scans every frame:

| Flag | Meaning | Usual fix |
|---|---|---|
| `textOverlapPx` | two text boxes stacked (dark red) | put them in different zones, exit the old one first, shorten the text |
| `blockOverlapPx` | two cards stacked (dark green) | spread them out, or stagger their entry/exit |
| `textInMarginPx` | text inside the safe margin | move it in, reduce size, or reduce camera zoom in that range |

Screenshots of each problem range land in `out/qa-overlap/`. During the debug pass, scene crossfades switch at the midpoint, so the intended blurred crossfade is not reported. A sticker that is meant to sit on a card can use `allowOverlap`, but use it rarely.

Only boxes wrapped in `McBox` are checked. If you add a new text element, wrap it.

`qa all` also checks:
- file: size limit, audio stream present, audio and video length match
- audio: -14 LUFS (±1), true peak <= -1 dBTP, no long silences
- sheet: 24 frames tiled into `out/qa/sheet.jpg`

## 2. Look at it yourself

Open the sheet and at least 3 full-size frames. Check:

- [ ] One focus per frame. Your eye knows where to look within half a second.
- [ ] Headline readable at phone size (h1 >= 64 px at 1080p).
- [ ] At most one accent word per sentence.
- [ ] Nothing cut off at the edges, nothing hidden behind platform UI (9:16: bottom 20%, right 12%).
- [ ] No leftover placeholder text, lorem, or "Example data" credits.
- [ ] Numbers and names match the research sources.
- [ ] Every third-party logo/screenshot has a credit.

## 3. Listen

- [ ] Every name and brand word is said correctly (read the word timings, then listen to those spots).
- [ ] Music never covers the voice.
- [ ] Big visual moments land on a beat or the drop.
- [ ] SFX are sparse; no sound without a visual reason.

## 4. Watch once at full speed

Anything that feels rushed, dead, or jumpy gets fixed before sending. Holds should be at least `0.8 s + 0.25 s per word`.
