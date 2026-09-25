# Phase 3: honest final-pixel QA

After `render`, run `qa all` and `qa pixels` on the *final exported video*, not on the Remotion debug pass. Supply the storyboard to sample scene starts, near-ends, and representative preview frames. Without a board, eight evenly spaced frames plus first/last are checked. `qa pixels` writes actual full-size PNGs, scene-timed audio snippets when the video has audio, a contact sheet, and `review.json` with source hash, OCR text flags, font-import audit and frame timestamps.

```bash
node <skill-dir>/scripts/motioncraft.mjs qa pixels out/final.mp4 --board storyboard.json --dir . --outDir out/qa-pixels
```

This check flags likely small glyphs on a 360px-wide phone, text near frame edges, text under likely 9:16 app chrome (right 12% after top 12%, bottom 20%), and dense edges near the apparent headline. These are conservative *review leads*. OCR can miss words, confuse text with graphics, and report false alarms. Its headline-area test measures local edge density, not semantic empty space. Review the corresponding full-size PNG and watch motion at normal speed. A pass never means zero overlaps. `qa overlap` sees only instrumented `McBox` debug rectangles; graphics and text can collide in final pixels even when debug-box checks pass.

Font audit checks that `src/style.json` names font families imported in `src/lib/fonts.ts` and that tokens load the file. It cannot prove a font downloaded or every glyph rendered in the intended face. Inspect the final glyph shapes and console for fallbacks. Text sizing is based on OCR glyph boxes after scaling to a 360px-wide phone, not CSS font-size, so treat flags as cues to inspect.

Listen to the **final exported video** and its critical-time snippets, not only to the pre-export mix. Check sync at intro, scene cuts, logo and CTA, VO legibility and final fade. `qa audio` measures LUFS/true peak/silence, while `mix review` generates cue snippets and a hash-bound approval before export; neither hears quality. Sample checks do not replace watching the whole video. Keep an explicit human review note for crop, spacing, fonts, readability and audio, with timestamps of problems and fixes. Do not report a zero-overlap result without opening final pixels at the affected times.
