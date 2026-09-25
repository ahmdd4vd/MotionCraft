# Animation system

The template in `assets/template` is the animation system. Every motion value comes from `src/style.json` (copied from `styles/<id>/tokens.json`), so a style change never needs code edits.

## Timing helpers (`src/lib`)

| Helper | What it does |
|---|---|
| `sec(s)` | seconds -> frames at the style fps |
| `ramp(f, at, dur)` | 0..1 progress with ease-out, clamped |
| `spr(f, at, cfg)` | spring from the style tokens |
| `useTimeline()` | loads `public/timeline.json` (words, beats, scenes, events) |
| `wordAt(tl, 'word', nth)` | frame where a spoken word starts, 2 frames early (eyes lead ears) |
| `eventAt(tl, 'id')` | frame of a named event (drop, CTA...) |
| `snapToBeat(tl, frame)` | nearest beat frame |

Rule: never hard-code a time that belongs to the voice. Use `wordAt`. Hard-coded `sec()` is fine for the example and for music-only videos.

## Building blocks

- `Scene from to` - a scene window. Scenes overlap by `motion.scene.overlap` frames with a blur crossfade. Never hard-cut.
- `Camera3D keys` - actual perspective dolly/orbit/target motion inside each 3D canvas. Pass `cameraMove={[[frame, distance, orbitRadians, targetX, targetY], ...]}` to `FloatingShapes`, `Logo3D`, or `Mascot` for a per-scene shot; the default comes from `three.camera.moves` style tokens as offsets from `at` (distance is a multiplier of the canvas base distance). Depth-separated shapes produce actual parallax. Check the rendered frame; this does not move DOM headline text.
- `Camera keys` - slow in-out camera moves `[frame, scale, x, y]` plus a tiny constant drift so the frame never goes dead. Max zoom comes from tokens.
- `Zone name="top|center|bottom"` - keeps headline and hero from competing for space.
- `Headline items={words('Text with *accent*', at)} level="h0|h1|h2"` - words rise out of blur, one after another, accent gets the accent color.
- `Word`, `InlineIcon` - single animated word or icon inside a line.
- `Card`, `Pill`, `Keycap` - UI surfaces that enter with rise + tilt + blur.
- `Strike` - "not X" crossed out, for the "Not X. Y." pattern.
- `CheckItem`, `StepCards`, `Callout`, `Counter` - proof and formula scenes. `Counter` only for real numbers, always with a `Credit`.
- `Frames` - play a PNG sequence (screen recordings, pre-rendered 3D).
- `Logo3D`, `Mascot`, `FloatingShapes` - real 3D (react-three-fiber). Use `finish="metal"` or `finish="glass"` on a logo, or `finishes={["ceramic", "metal", "glass"]}` on floating objects. The style tokens set physical roughness, metalness, transmission, environment and soft shadow radius. This is material depth, not a depth-of-field blur pass; true camera DOF remains a separate render/postproduction step. `FloatingShapes` keeps a clear box around the headline.
- `EndCard` - handle + one line.
- `McBox kind="text|block"` - wrap any custom element so `qa overlap` can check it.

## Motion rules

1. Enter with ease-out, exit faster than you enter (exit frames < enter frames).
2. Stagger words 4-5 frames. Never all at once, never slower than a reader.
3. Hold each state at least `0.8 s + 0.25 s per word` before it changes.
4. At least 1.5 s between big transitions.
5. One thing moves big at a time. Everything else is still or drifts gently.
6. Big moments (reveal, number, logo) land on a beat or the music drop.
7. Old text leaves before new text enters in the same zone.
8. Text never bounces visibly: word springs stay soft (tokens), bigger springs only for small UI (pills, icons, 3D).
9. Motion blur and camera speed stay under the token limits (`motion.limits`).

## Adding a new component

Take values from `S` / `C` (tokens), wrap text/blocks in `McBox`, accept an `at` frame, and hide text color in debug mode like the built-in components do. Then run `qa overlap`.

## Beat-locked visual accents

Pass the real beatgrid `beats` array (seconds) to `Main` or `TimelineLaunch` / `TimelineTutorial` composition props. `Main` snaps its hook, number and CTA to a nearby beat; timeline templates snap each headline, card and CTA to beats in absolute time. The helper `nearestBeatFrame(frame, beats, maxMs?)` is available for custom scenes and `beatAccent(frame, beats)` returns a brief scale multiplier for logo/shape accents. The default maximum adjustment (80 ms), pulse amount and decay live in each style's `motion.beat`. No grid means unchanged timings, not a synthetic clock. Check the actual music mix: the grid and music file must match.

## Morphing scene handoff

`MorphTransition` from `components/MorphTransition` interpolates a shape's matching vertices, position and size through a scene boundary. Put it above adjacent `Scene` layers at `at={boundaryFrame - 11}` (default 22 frames) and give it `from`/`to` with equal-length `points` arrays of at least three normalized `[-1,1]` vertices. Positions `x/y` are fractions of the canvas, `size` is pixels. The sample `Main` composition has a four-point diamond-to-square handoff. This is a real shape morph but **not** automatic matching of arbitrary 3D meshes or every scene: author corresponding shapes and keep the overlay out of text-safe areas. The old blur/crossfade remains behind the morph, and other scene boundaries are unchanged. `motion.morph` tokens control duration/opacity in all five styles.
