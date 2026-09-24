# Customization

## Styles

A style is a folder in `styles/<id>/` with:

- `tokens.json` - every color, font, size, motion, 3D, and audio value the template reads
- `style.md` - the look in words, with do's and don'ts

```bash
node <skill-dir>/scripts/motioncraft.mjs style list
node <skill-dir>/scripts/motioncraft.mjs new my-video --style <id>
```

`new` copies the tokens into `my-video/src/style.json`. Edit that file for this video only.

## Knobs

```bash
node <skill-dir>/scripts/motioncraft.mjs style knobs src/style.json --energy 0.7 --roundness 0.4 --camera active
```

| Knob | 0 | 1 | Changes |
|---|---|---|---|
| `energy` | slow, calm | quick, punchy | word/card/scene timing, springs, SFX density target |
| `warmth` | cool blue-white | warm paper | background colors |
| `roundness` | sharp | soft | card corner radius |
| `depth` | flat | tilted, deep | card tilt on entry |
| `camera` | `still` / `smooth` / `active` | | camera drift |
| `density` | | | stored as a note for you: how much content per frame. Not applied automatically. |

Knobs rewrite the tokens file and then run `style check`.

## Style check

```bash
node <skill-dir>/scripts/motioncraft.mjs style check src/style.json
```

It flags things that make videos look bad: low contrast for ink, accent and muted text; common AI-default fonts; weak size hierarchy between h0/h1/h2; more than 2 text lines; word timing and stagger outside the limits; heavy blur; linear easing; camera zoom over 1.3x; margins under 48 px; more than 2 background glows. Fix every error; warnings need a reason.

## Making a new style

1. Copy `styles/pi-v2` to `styles/<new-id>` and set `name`.
2. Change colors, fonts, sizes, motion. Keep one accent color.
3. Write `style.md`: 3-5 sentences on the feel, then do's and don'ts.
4. Run `style check styles/<new-id>/tokens.json` until clean.
5. Render the example scene with it and look at the stills.

## Vertical (9:16)

`new --vertical` sets 1080x1920. Keep text out of the bottom 20% and right 12% (platform buttons) - these are in `layout.vertical916`.
