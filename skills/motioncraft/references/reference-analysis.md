# Reference analysis

Use this when the user sends a video and says "make it like this".

```bash
node <skill-dir>/scripts/motioncraft.mjs ref get <url-or-file> --dir ref   # downloads with yt-dlp, or copies a local file
node <skill-dir>/scripts/motioncraft.mjs ref report --dir ref               # writes ref/ref_report.md
node <skill-dir>/scripts/motioncraft.mjs ref text --dir ref                 # optional, needs tesseract
```

If yt-dlp is missing or the site blocks it, ask the user to download the video and pass the file.

## What the report gives you and how to use it

| Report part | Read it as | Turn it into |
|---|---|---|
| Cuts (times) | pace. Many cuts per minute = energetic | `--energy` knob, scene lengths |
| Motion per second | how much moves on screen | `--energy`, camera `still/smooth/active` |
| Palette | background, ink, accent colors | `color` tokens (keep one accent) |
| Music: BPM, key, LUFS, drop | tempo and where the peak is | `music make --bpm --drop`, pick a preset with a similar feel |
| Contact sheet | layout, type, density, 3D or flat | zones, font level choice, `--density`, `--depth` |

The key estimate is rough; treat it as a hint. BPM and loudness are reliable.

## Also look yourself

Open the contact sheet and a few frames and write down in plain words:

- How text enters (blur, slide, type-on, scale)
- How many words are on screen at once
- Font feel (geometric sans, serif, mono) - find a free font with that feel
- What the hero visuals are (UI mockups, 3D objects, photos, icons)
- How scenes change (cut, crossfade, camera move)

## Copy the feel, not the video

Never reuse the reference's footage, logos, music, or exact layouts. Build the same *feel* with the style tokens and your own content. If you want to show part of the reference on screen (for example in a "look at this" moment), credit it with `<Credit>`.
