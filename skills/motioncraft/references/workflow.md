# Workflow

The full loop, with what to show the user at each checkpoint.

| # | Step | Output | Show the user? |
|---|---|---|---|
| 0 | `doctor` | ready machine | only if something is missing |
| 1 | Brief | `brief.md` (topic, audience, format, length, style, voice, CTA, target) | yes, if you filled gaps with assumptions |
| 2 | Research | `research.md` with source URLs | no, unless facts are uncertain |
| 3 | Script | `script.txt` + a scene list (line -> visual) | **yes - get OK before voice** |
| 4 | Reference (optional) | `ref/ref_report.md` + knob values | short summary |
| 5 | Project | `new` + `npm install` + knobs + `style check` | no |
| 6 | Voice | `vo clean` + `vo align` -> `audio/words.json` | check names by ear |
| 7 | Music | `music audition` -> pick -> `music make` + `beat grid` | yes, the 3 auditions if the user cares about music |
| 8 | Build | scenes in `src/scenes`, `timeline build` | 3-4 stills of key moments |
| 9 | SFX + mix | `sfx make`, `mix` -> `audio/final.wav` | no |
| 10 | QA | `qa overlap` pass, `render`, `qa all` pass, look at the sheet | no |
| 11 | Deliver | final MP4 + two-line note | yes |
| 12 | Feedback | changes by timestamp -> back to the right step -> QA -> render | yes |

## Time budget for a 60 s video

Script and research take the longest thinking; the build takes the longest clock time. Show stills before a full render - it's much cheaper to fix a layout in a still than after a render.

## Feedback loop

- Ask for feedback with timestamps ("0:12 the text is too small").
- Group changes, apply them together, re-run QA, render once.
- Note any preference that should hold for future videos (font, music vibe, pace) in the project's `brief.md`, so the next video starts right.

## Files in a project

```
my-video/
  brief.md  research.md  script.txt  mc.config.json
  audio/     vo_clean.wav  words.json  music.wav  beatgrid.json  sfx.wav  final.wav
  public/    timeline.json  (images, logos, screen recordings)
  src/       style.json  scenes/  components/  lib/
  out/       final.mp4  qa/  qa-overlap/
```
