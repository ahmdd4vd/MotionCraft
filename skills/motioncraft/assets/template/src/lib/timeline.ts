// Reads public/timeline.json (built by `motioncraft timeline build`).
// words: VO words with start/end seconds. beats: beat times. scenes: scene windows. events: named moments.
import {staticFile, delayRender, continueRender} from 'remotion';
import {useEffect, useState} from 'react';
import {FPS} from './tokens';
export type TLWord = {w: string; start: number; end: number};
export type Timeline = {duration: number; bpm?: number; words: TLWord[]; beats: number[]; scenes: {id: string; start: number; end: number}[]; events: {id: string; t: number}[]};
export const useTimeline = (file = 'timeline.json') => {
  const [tl, setTl] = useState<Timeline | null>(null);
  const [h] = useState(() => delayRender('timeline'));
  useEffect(() => {
    fetch(staticFile(file)).then((r) => r.json()).then((j) => { setTl(j); continueRender(h); }).catch(() => { setTl({duration: 20, words: [], beats: [], scenes: [], events: []}); continueRender(h); });
  }, [file, h]);
  return tl;
};
// Frame where the n-th occurrence of a word starts (case-insensitive). Text appears 2 frames early: eyes lead ears.
export const wordAt = (tl: Timeline | null, word: string, nth = 0, lead = 2): number => {
  if (!tl) return 0;
  const hits = tl.words.filter((x) => x.w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === word.toLowerCase());
  const w = hits[nth]; return w ? Math.max(0, Math.round(w.start * FPS) - lead) : 0;
};
export const eventAt = (tl: Timeline | null, id: string) => { const e = tl?.events.find((x) => x.id === id); return e ? Math.round(e.t * FPS) : 0; };
// snap a frame to the nearest beat if within maxMs
export const snapToBeat = (tl: Timeline | null, frame: number, maxMs = 80) => {
  if (!tl?.beats?.length) return frame;
  const t = frame / FPS; let best = tl.beats[0];
  for (const b of tl.beats) if (Math.abs(b - t) < Math.abs(best - t)) best = b;
  return Math.abs(best - t) * 1000 <= maxMs ? Math.round(best * FPS) : frame;
};
