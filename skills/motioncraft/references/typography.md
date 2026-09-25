# Typography

Values below are the `pi-v2` defaults from `styles/pi-v2/tokens.json`. Other styles change the numbers, not the rules.

## Levels

| Level | Use | Size at 1080p | Weight | Line height |
|---|---|---|---|---|
| h0 | one big word or number | 120-150 | 700 | 1.08 |
| h1 | main headline | 64-76 | 600 | 1.15 |
| h2 | supporting line | 34-46 | 500 | 1.3 |
| caption | labels, credits | 20-30 | 500 | 1.35 |

For 9:16, keep the same pixel sizes; the narrower width forces shorter lines, which is good.

## Rules

- Display font: Figtree. Mono: JetBrains Mono (code, commands). Two fonts max.
- Tracking -0.02 em on display text.
- Max 2 lines, max 7 words per line. Longer? Split into two beats.
- One accent word per sentence, marked with `*word*` in `words()`. Accent = color, never a different font.
- No all-caps sentences. All-caps only for a single short label.
- Text is never centered on top of a busy visual. Use zones: headline in `top`, hero in `center`.
- Text only appears when it is spoken (word timings), and leaves before the next headline enters.
- Numbers use tabular figures (`Counter` already does).
- Don't stack more than 3 text levels on one frame.

## Measuring

`Headline` measures every word with `@remotion/layout-utils` and breaks lines by real width: one line if it fits, otherwise the most balanced two lines, never a single orphan word on line 2. If it still does not fit in 2 lines, it prints a `[motioncraft] headline too long` warning in the console - rewrite the line shorter; do not drop below the level's minimum size.

## Kinetic reveals (v0.5)

`<Headline reveal="character" items={words('A big *idea*', at)} />` staggers characters inside each word with fixed layout width. The default word reveal remains unchanged. Character timing, blur and rise come from `motion.character` in the selected style. Keep copy short and inspect the entire line at phone size; character reveals on long sentences read slowly. `<Counter from={20} to={100} at={...} decimals={0} />` animates a cited number, and `motion.number.duration` controls its default length. A counter still needs a visible `<Credit>` for real data.
