# Troubleshooting

| Problem | Fix |
|---|---|
| Render fails with a GL / WebGL error | add `--gl=swangle` (software). Slower but works everywhere. |
| 3D scenes render black or very slow | use `--gl=swangle`, lower `FloatingShapes` count, or pre-render 3D to a PNG sequence and play it with `<Frames>` |
| Fonts look wrong in the render | fonts load from Google Fonts via `src/lib/fonts.ts`; make sure the machine is online, or switch to `@remotion/fonts` with local files in `public/fonts` (see the comment in that file) |
| Text changes line breaks between studio and render | same cause: font not loaded when measured. Fix fonts first. |
| `headline too long` warning | rewrite the line shorter. Don't shrink below the level's minimum. |
| Words appear out of sync | re-run `vo align`; check you used the cleaned VO file in `mix` and `timeline build`; confirm the composition fps matches the style (30) |
| Audio and video lengths differ (qa file) | set `durationInFrames` in `src/Root.tsx` to the `timeline.json` duration x fps |
| Final file too big for WhatsApp | `render --preset wa` (two-pass, aims under 16 MB) |
| Loudness off in `qa audio` | re-run `mix`; don't normalize again in another tool |
| `music make` refuses ("too similar") | change key, BPM (by 6+), progression or lead. That's the variety guard. |
| `qa overlap` fails on a crossfade | it shouldn't: scenes switch at the midpoint in debug mode. If it does, your two scenes overlap by more than the token `scene.overlap`. |
| `qa overlap` misses an element | wrap it in `McBox` |
| `yt-dlp` blocked | ask the user for the file |
| Render is slow | render at 30 fps, use `--concurrency`, close Remotion Studio, pre-render heavy 3D |
| Remotion license question | https://www.remotion.dev/license |
