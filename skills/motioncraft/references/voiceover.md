# Voiceover

## Sources

1. The user's own recording (best for trust).
2. A TTS voice from whatever tool the user or agent has.
3. No voice: text-only videos with music. Then timing comes from the beat grid.

## Clean

```bash
node <skill-dir>/scripts/motioncraft.mjs vo clean vo.wav      # high-pass, noise reduction, loudness normalize
```

## Align (word timings)

```bash
node <skill-dir>/scripts/motioncraft.mjs vo align vo_clean.wav --script script.txt --lang en --out audio/words.json
```

- With Python + `faster-whisper` installed: word-level timings (`mode: word`).
- Without it: phrase timings from pauses, matched to the script sentences (`mode: phrase`). `timeline build` spreads the words evenly inside each phrase. Put one sentence per line in `script.txt` and leave clear pauses between sentences.

## Always check the transcript

TTS voices and recognizers both get names wrong. After aligning:

1. Compare the returned `text` with the script, word by word, especially names, brands, and numbers.
2. If a spot looks wrong, cut that piece with ffmpeg and transcribe it alone - full-file transcripts can hide errors.
3. Fix pronunciation by respelling in the TTS input (for example "Remotion" -> "Ree-motion"), regenerate only that line, and re-align.

## Writing for voice

- Short sentences, 8-14 words.
- Numbers as they are said ("thirty frames per second", not "30fps").
- Leave a 0.3-0.5 s pause before a big reveal so the visual can land.
- Read the script aloud once. If you run out of breath, split the sentence.
