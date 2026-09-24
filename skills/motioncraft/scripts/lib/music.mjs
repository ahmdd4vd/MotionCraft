// Music engine: arranges a calm-with-punch instrumental from a small JSON spec.
import * as D from './dsp.mjs';
import * as V from './voices.mjs';
const { SR } = D;

// Proven progressions grouped by mood. [scale degree semitones from key, chord quality]
export const PROGRESSIONS = {
  'warm-lift':   { mood: ['warm', 'optimistic'], chords: [[0, 'maj7'], [4, 'm7'], [5, 'maj7'], [7, 'sus']] },
  'dreamy':      { mood: ['dreamy', 'calm'], chords: [[9, 'm7'], [5, 'maj7'], [0, 'add9'], [7, 'sus']] },
  'soft-pop':    { mood: ['bright', 'friendly'], chords: [[0, 'add9'], [7, 'sus'], [9, 'm7'], [5, 'maj7']] },
  'night-drive': { mood: ['cool', 'focused'], chords: [[9, 'm7'], [7, '7sus'], [5, 'maj7'], [4, 'm7']] },
  'hopeful':     { mood: ['hopeful', 'cinematic'], chords: [[5, 'maj7'], [7, 'sus'], [9, 'm7'], [0, 'add9']] },
  'lofi-desk':   { mood: ['lofi', 'cozy'], chords: [[2, 'm9'], [7, '9'], [0, 'maj9'], [9, 'm7']] },
  'minimal-dark':{ mood: ['serious', 'dark'], chords: [[9, 'm9'], [5, 'maj7'], [2, 'm7'], [4, 'm7']] },
  'tech-bright': { mood: ['tech', 'energetic'], chords: [[0, 'add9'], [9, 'm7'], [5, 'add9'], [7, 'sus']] },
};
const Q = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus: [0, 5, 7, 10], '7sus': [0, 5, 7, 10], '7': [0, 4, 7, 10], add9: [0, 4, 7, 14], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14], '9': [0, 4, 7, 10, 14], m: [0, 3, 7], maj: [0, 4, 7] };

// Presets: every knob in one place. Guardrails live in validateSpec().
export const PRESETS = {
  'calm-punch':   { bpm: 102, key: 'F', progression: 'warm-lift', swing: 0.57, lead: 'marimba', comp: 'syncopated', drums: 'soft', brightness: 1.0, levels: {} },
  'dreamy':       { bpm: 93, key: 'D', progression: 'dreamy', swing: 0.62, lead: 'marimba', comp: 'syncopated', drums: 'soft', brightness: 0.85, levels: { bell: -9, keys: -6, pad: -9, hats: -7 } },
  'warm-major':   { bpm: 98, key: 'G', progression: 'soft-pop', swing: 0.55, lead: 'glock', comp: 'offbeat', drums: 'soft', brightness: 1.0, levels: {} },
  'lofi-desk':    { bpm: 84, key: 'Eb', progression: 'lofi-desk', swing: 0.64, lead: 'pluck', comp: 'lazy', drums: 'lofi', brightness: 0.7, levels: { hats: -9 } },
  'tech-bright':  { bpm: 112, key: 'A', progression: 'tech-bright', swing: 0.52, lead: 'pluck', comp: 'eighths', drums: 'tight', brightness: 1.15, levels: {} },
  'dark-minimal': { bpm: 90, key: 'C', progression: 'minimal-dark', swing: 0.54, lead: 'glock', comp: 'sustain', drums: 'soft', brightness: 0.75, levels: { bell: -10 } },
  'cinematic-soft': { bpm: 88, key: 'Bb', progression: 'hopeful', swing: 0.5, lead: 'glock', comp: 'sustain', drums: 'sparse', brightness: 0.9, levels: { pad: -7 } },
};
const MOOD_BPM = { calm: [80, 96], 'calm-punch': [90, 105], energetic: [105, 122] };

const COMP = {
  syncopated: [[0, 3], [3, 2], [6, 3], [10, 2], [12, 3]],
  offbeat: [[2, 2], [6, 2], [10, 2], [14, 2]],
  lazy: [[0, 5], [7, 3], [11, 5]],
  eighths: [[0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]],
  sustain: [[0, 16]],
};
const DRUMS = {
  soft:   { kick: [0, 8], kickMain: [7], kickOdd: [10], hats: 2, snare: true, shaker: true },
  tight:  { kick: [0, 8], kickMain: [6, 11], kickOdd: [10], hats: 1, snare: true, shaker: false },
  lofi:   { kick: [0, 7], kickMain: [10], kickOdd: [], hats: 2, snare: true, shaker: false },
  sparse: { kick: [0], kickMain: [8], kickOdd: [], hats: 4, snare: false, shaker: false },
};

export function resolveSpec(spec) {
  const base = PRESETS[spec.preset || 'calm-punch'] || PRESETS['calm-punch'];
  const s = { ...base, ...spec, levels: { ...base.levels, ...(spec.levels || {}) } };
  if (!s.chords) s.chords = (PROGRESSIONS[s.progression] || PROGRESSIONS['warm-lift']).chords;
  s.seed = s.seed ?? 7;
  return s;
}

export function validateSpec(s) {
  const issues = [];
  if (s.bpm < 70 || s.bpm > 128) issues.push(`bpm ${s.bpm} is outside 70-128; calm-with-punch lives at 88-108`);
  if (s.swing < 0.5 || s.swing > 0.68) issues.push(`swing ${s.swing} should be 0.50-0.68`);
  if (D.NOTE[s.key] == null) issues.push(`unknown key ${s.key}`);
  for (const [, q] of s.chords) if (!Q[q]) issues.push(`unknown chord quality ${q}`);
  if (!COMP[s.comp]) issues.push(`comp must be one of ${Object.keys(COMP).join(', ')}`);
  if (!DRUMS[s.drums]) issues.push(`drums must be one of ${Object.keys(DRUMS).join(', ')}`);
  if (s.lead && !['marimba', 'glock', 'pluck', 'none'].includes(s.lead)) issues.push('lead must be marimba, glock, pluck or none');
  return issues;
}

// Variety rule: a new track must differ from the last one on at least 2 of key, bpm (>=6), progression, lead.
export function varietyCheck(s, last) {
  if (!last) return { ok: true, diffs: 4 };
  let d = 0; const why = [];
  if (s.key !== last.key) d++; else why.push('same key');
  if (Math.abs(s.bpm - last.bpm) >= 6) d++; else why.push('bpm within 6');
  if (JSON.stringify(s.chords) !== JSON.stringify(last.chords)) d++; else why.push('same progression');
  if (s.lead !== last.lead) d++; else why.push('same lead');
  return { ok: d >= 2, diffs: d, why };
}

// Auto arrangement from duration + drop time
export function autoSections(dur, drop, bpm, tail = 2.5) {
  const bar = 240 / bpm; const total = Math.max(4, Math.round((dur - tail) / bar));
  let dropBar = drop != null ? Math.round(drop / bar) : Math.min(4, Math.floor(total / 3));
  dropBar = Math.max(1, Math.min(dropBar, total - 3));
  const intro = Math.min(2, dropBar), groove = dropBar - intro, outro = Math.min(3, Math.max(1, Math.round(total * 0.12)));
  const rest = total - dropBar - outro; const secs = [{ type: 'intro', bars: intro }];
  if (groove) secs.push({ type: 'groove', bars: groove });
  if (rest >= 9) { const m1 = Math.ceil((rest - 2) / 2); secs.push({ type: 'main', bars: m1 }, { type: 'breakdown', bars: 2 }, { type: 'main', bars: rest - 2 - m1 }); }
  else secs.push({ type: 'main', bars: Math.max(1, rest) });
  secs.push({ type: 'outro', bars: outro });
  return secs.filter((x) => x.bars > 0);
}

export function renderMusic(input) {
  const s = resolveSpec(input); D.setSeed(s.seed);
  const key = D.NOTE[s.key], beat = 60 / s.bpm, bar = beat * 4, six = beat / 4, swing = s.swing;
  const sections = s.sections || autoSections(s.duration || 60, s.drop, s.bpm, s.tail ?? 2.5);
  const totalBars = sections.reduce((a, x) => a + x.bars, 0);
  const dur = totalBars * bar + (s.tail ?? 2.5), n = Math.round(dur * SR);
  const T = Object.fromEntries(['kick', 'bass', 'snare', 'hats', 'keys', 'pad', 'bell', 'fx'].map((k) => [k, D.stereo(n)]));
  const swingT = (st) => Math.floor(st / 2) * (beat / 2) + (st % 2) * (beat / 2) * swing;
  const K = { snap: V.snap(), clap: V.clap(), hat: V.hat(), hatO: V.hat(true), shaker: V.shaker() };
  const dr = DRUMS[s.drums]; const kicks = []; const markers = []; let bar0 = 0;
  const comp = COMP[s.comp];
  sections.forEach((sec, si) => {
    const name = sec.type; markers.push({ section: name, start_s: +(bar0 * bar).toFixed(4), bars: sec.bars });
    for (let b = 0; b < sec.bars; b++) {
      const t0 = (bar0 + b) * bar; const [r, q] = s.chords[(bar0 + b) % s.chords.length]; const pc = (key + r) % 12;
      const voic = Q[q].map((iv) => { const m = 48 + pc + iv; return m >= 53 ? m : m + 12; });
      const bassM = pc < 8 ? 36 + pc : 24 + pc; const drums = name === 'groove' || name === 'main'; const last = b === sec.bars - 1;
      let pat = name === 'outro' ? [[0, 16]] : name === 'intro' ? [[0, 6], [6, 4], [10, 6]] : comp;
      for (const [p, L] of pat) for (const m of voic) D.place(T.keys, V.epNote(m, L * six * 1.1, 0.55, s.brightness), t0 + swingT(p), 0.3);
      D.place(T.pad, V.supersaw(voic, bar * 1.1, { bright: 1600 * s.brightness }), t0, 0.22);
      if (['groove', 'main', 'breakdown'].includes(name)) {
        const bl = name === 'breakdown' ? [[0, 16]] : [[0, 6], [6, 4], [10, 6]];
        for (const [p, L] of bl) D.place(T.bass, V.roundBass(D.midiHz(bassM), L * six * 0.95), t0 + swingT(p), 0.7);
        if (drums && b % 2 === 1) D.place(T.bass, V.roundBass(D.midiHz(bassM + 7), six * 1.8), t0 + swingT(14), 0.5);
      }
      if (drums) {
        const kp = [...dr.kick, ...(name === 'main' ? dr.kickMain : []), ...(b % 2 ? dr.kickOdd : [])];
        for (const p of kp) { D.place(T.kick, V.softKick(), t0 + swingT(p), 0.9); kicks.push(t0 + swingT(p)); }
        if (dr.snare) for (const qn of [1, 3]) { D.place(T.snare, K.snap, t0 + qn * beat, 0.45); D.place(T.snare, K.clap, t0 + qn * beat + 0.006, 0.2); }
        for (let p = 0; p < 16; p += dr.hats) D.place(T.hats, K.hat, t0 + swingT(p), p % 4 ? 0.16 : 0.22, 0.15);
        if (name === 'main' && dr.shaker) for (let p = 1; p < 16; p += 2) D.place(T.hats, K.shaker, t0 + swingT(p), 0.07, -0.2);
        if (last && si + 1 < sections.length) for (const p of [12, 13, 14, 15]) D.place(T.snare, K.snap, t0 + swingT(p), 0.12 + 0.05 * (p - 12));
      }
      if (name === 'main' && s.lead !== 'none') {
        const mel = b % 2 === 0 ? [[0, 12], [3, 14], [6, 16], [10, 19]] : [[0, 17], [4, 16], [6, 14], [8, 12], [12, 11]];
        for (const [p, iv] of mel) { const m = 60 + ((key + iv) % 24) + (key + iv < 12 ? 12 : 0);
          const v = s.lead === 'glock' ? V.glock(m + 12, 1.0, 0.5) : s.lead === 'pluck' ? V.pluck(m, 0.7, 0.55) : V.marimba(m, 0.9);
          D.place(T.bell, v, t0 + swingT(p), 0.35, (p % 3 - 1) * 0.25); }
      }
    }
    const nxt = sections[si + 1]?.type; const endT = (bar0 + sec.bars) * bar;
    if ((nxt === 'groove' || nxt === 'main') && (name === 'intro' || name === 'breakdown')) {
      const [nr, nq] = s.chords[(bar0 + sec.bars) % s.chords.length]; const npc = (key + nr) % 12;
      const sw = V.swell(bar * 0.9, Q[nq].map((iv) => (48 + npc + iv >= 53 ? 48 + npc + iv : 60 + npc + iv)));
      D.place(T.fx, sw, endT - sw.L.length / SR, 0.25);
      D.place(T.fx, D.filt(V.hat(true), 'lp', 7000), endT, 0.3);
    }
    bar0 += sec.bars;
  });
  const chain = {
    kick: (x) => D.compress(D.filt(x, 'lowshelf', 70, 0.707, 2), -14, 3, 3, 80),
    bass: (x) => D.compress(D.filt(x, 'lp', 1500), -16, 3, 8, 100),
    snare: (x) => D.withReverb(D.compress(D.filt(x, 'hp', 300), -18, 2.5, 3, 100), 0.35, 0.6, 0.2, 0.85),
    hats: (x) => D.filt(D.filt(x, 'hp', 6000), 'lp', 14000),
    keys: (x) => D.withReverb(D.compress(D.chorus(D.filt(D.filt(x, 'hp', 150), 'lp', 6500 * s.brightness), 0.9, 3, 0.35), -18, 2, 10, 150), 0.45, 0.5, 0.18, 0.85),
    pad: (x) => D.withReverb(D.filt(x, 'hp', 200), 0.8, 0.5, 0.35, 0.7),
    bell: (x) => D.withReverb(D.delay(D.filt(x, 'hp', 300), beat * 0.75, 0.3, 0.2), 0.5, 0.5, 0.25, 0.8),
    fx: (x) => D.withReverb(D.filt(x, 'hp', 150), 0.7, 0.5, 0.3, 0.8),
  };
  const levels = { kick: -2, bass: -3, snare: -3, hats: -6, keys: -8, pad: -11, bell: -5, fx: -9, ...s.levels };
  const sc = new Float32Array(n).fill(1); const rel = Math.round(beat * 0.4 * SR);
  for (const kt of kicks) { const i = Math.round(kt * SR); for (let k = 0; k < rel && i + k < n; k++) { const v = 1 - (1 - D.db(-3)) * Math.pow(1 - k / rel, 1.5); if (v < sc[i + k]) sc[i + k] = v; } }
  const stems = {}; const mix = D.stereo(n);
  for (const [k, x] of Object.entries(T)) { let y = D.peak(x) > 0 ? chain[k](x) : x; D.gain(y, D.db(levels[k]));
    if (['bass', 'keys', 'pad'].includes(k)) for (let i = 0; i < n; i++) { y.L[i] *= sc[i]; y.R[i] *= sc[i]; }
    stems[k] = y; D.mixInto(mix, y); }
  const secGain = { intro: 1.5, breakdown: -1.0 };
  for (const m of markers) if (secGain[m.section] != null) { const a = Math.round(m.start_s * SR), L = Math.round(m.bars * bar * SR), g = D.db(secGain[m.section]), r = Math.min(Math.round(0.08 * SR), L >> 2);
    for (let i = 0; i < L && a + i < n; i++) { let gg = g; if (i < r) gg = 1 + (g - 1) * i / r; else if (i > L - r) gg = g + (1 - g) * (i - (L - r)) / r; mix.L[a + i] *= gg; mix.R[a + i] *= gg; } }
  D.fadeOut(mix, 2.0);
  const beats = []; for (let t = 0; t < dur; t += beat) beats.push(+t.toFixed(4));
  return { mix, stems, markers, kicks, dur, spec: s, beats };
}
