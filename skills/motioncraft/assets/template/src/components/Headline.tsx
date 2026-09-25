import React, {useMemo} from 'react';
import {measureText} from '@remotion/layout-utils';
import {S, FONT} from '../lib/tokens';
import {useFormat} from '../lib/format-context';
import {geometry} from '../lib/format.mjs';
import {Word, InlineIcon, CharReveal} from './Word';
import {McBox} from '../lib/debug';

export type Item = {t?: string; icon?: string; at: number; accent?: boolean};
type Level = 'h0' | 'h1' | 'h2' | 'caption';
// Split "Kuncinya bukan *prompt*" into items. *word* marks the accent. Words get `step` frames of stagger.
export const words = (text: string, at: number, step = S.motion.word.stagger[0]): Item[] =>
  text.split(/\s+/).filter(Boolean).map((raw, i) => ({t: raw.replace(/\*/g, ''), accent: /^\*.*\*$/.test(raw), at: Math.round(at + i * step)}));

// Line breaking by real measured width, max 2 lines, no orphan on line 2.
const layout = (items: Item[], size: number, weight: number, maxW: number) => {
  const wOf = (it: Item) => it.icon ? size * S.motion.icon.slotWidth : measureText({text: (it.t ?? '') + ' ', fontFamily: FONT, fontSize: size, fontWeight: String(weight), letterSpacing: `${size * S.font.tracking}px`}).width;
  const widths = items.map(wOf); const total = widths.reduce((a, b) => a + b, 0);
  if (total <= maxW) return {lines: [items], overflow: false};
  // best split = most balanced two lines that both fit
  let best = -1, bestDiff = Infinity;
  for (let k = 1; k < items.length; k++) {
    const a = widths.slice(0, k).reduce((x, y) => x + y, 0), b = total - a;
    if (a <= maxW && b <= maxW && items.length - k >= 2 && k >= 2 && Math.abs(a - b) < bestDiff) { best = k; bestDiff = Math.abs(a - b); }
  }
  if (best < 0) return {lines: [items.slice(0, Math.ceil(items.length / 2)), items.slice(Math.ceil(items.length / 2))], overflow: true};
  return {lines: [items.slice(0, best), items.slice(best)], overflow: false};
};

export const Headline: React.FC<{items: Item[]; level?: Level; size?: number; out?: number; maxWidth?: number; align?: 'center' | 'left'; style?: React.CSSProperties; allowOverlap?: boolean; reveal?: 'word'|'character'}> =
({items, level = 'h1', size, out, maxWidth, align = 'center', style, allowOverlap, reveal = 'word'}) => {
  const {format,platform}=useFormat(); const g=geometry(format,platform); const maxW=Math.min(maxWidth ?? g.safe.width,g.safe.width);
  const range=S.font.size[level]; const fs=(size ?? range[1]) * (g.width<1400 ? .78 : 1); const weight = S.font.weights[level];
  const lh = S.font.lineHeight[level];
  const {lines, overflow} = useMemo(() => layout(items, fs, weight, maxW), [items, fs, weight, maxW]);
  if (overflow) console.warn(`[motioncraft] headline too long for 2 lines at ${fs}px: shorten the text`);
  let idx = 0;
  return <McBox kind="text" allowOverlap={allowOverlap} style={{display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', maxWidth:maxW, ...style}}>
    {lines.map((line, li) => <div key={li} style={{display: 'flex', alignItems: 'center', height: fs * lh, justifyContent: align === 'center' ? 'center' : 'flex-start'}}>
      {line.map((it, k) => { const i = idx++; const o = out !== undefined ? out + i * S.motion.wordOut.stagger : undefined;
        const space = k > 0 && !line[k - 1].icon && !it.icon ? ' ' : '';
        return it.icon ? <InlineIcon key={k} src={it.icon} at={it.at} size={fs * 1.05} out={o} /> : reveal === 'character' ? <CharReveal key={k} text={space + it.t} at={it.at} size={fs} accent={it.accent} out={o} weight={weight} /> : <Word key={k} t={space + it.t} at={it.at} size={fs} accent={it.accent} out={o} weight={weight} />; })}
    </div>)}
  </McBox>;
};
