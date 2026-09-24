// SFX engine: 16 synthesized sounds, placed on timeline events, snapped to the beat grid.
import * as D from './dsp.mjs';
import * as V from './voices.mjs';
const { SR } = D;

// Default levels (dB) and high-pass (Hz). These are the tested pi-v2 values.
export const SFX_RULES = {
  word_pop: [-17, 300], icon_pop: [-14, 250], letter_tick: [-18, 400], check: [-12, 300], success: [-10, 250], slot_tick: [-18, 500],
  bubble: [-15, 250], type: [-22, 500], button: [-14, 300], whoosh_in: [-9, 150], whoosh_out: [-10, 150], swoosh: [-11, 150],
  riser: [-8, 120], impact: [-6, 20], confetti: [-16, 400], logo_sting: [-8, 200],
};
export const SFX_TYPES = Object.keys(SFX_RULES);

// Packs change timbre, never the level table. pitch in semitones, bright = filter multiplier, decay = envelope multiplier.
export const PACKS = {
  'soft-pop':     { pitch: 0, bright: 1.0, decay: 1.0, room: 0.18 },
  'glass':        { pitch: 5, bright: 1.4, decay: 0.7, room: 0.26 },
  'paper':        { pitch: -3, bright: 0.7, decay: 1.4, room: 0.1 },
  'digital-soft': { pitch: 2, bright: 1.2, decay: 1.2, room: 0.14 },
  'organic-wood': { pitch: -5, bright: 0.8, decay: 1.1, room: 0.2 },
};

function bank(pk) {
  const dk = pk.decay; const P = (x) => V.pitchShift(x, pk.pitch);
  const B = {
    word_pop: [0, 2, 4, 6].map((i) => V.sineBlip(1400 * 2 ** (i / 12), 700 * 2 ** (i / 12), 0.07, 55 * dk)),
    icon_pop: [0, 1].map(() => { const a = V.sineBlip(900, 450, 0.12, 30 * dk); D.mixInto(a, V.chime([96], 0.12), 0.35); return a; }),
    letter_tick: [V.sineBlip(2400, 1800, 0.03, 120), V.sineBlip(2600, 1900, 0.03, 120)],
    check: [V.chime([84, 91], 0.9, 0.07)],
    success: [V.chime([79, 84, 88, 91], 1.4, 0.06)],
    slot_tick: [V.sineBlip(2000, 1500, 0.03, 150)],
    bubble: [V.sineBlip(600, 1100, 0.09, 35 * dk, 0.05), V.sineBlip(700, 1250, 0.09, 35 * dk, 0.05)],
    type: [0, 1, 2].map((i) => { const b = V.hat(); return D.gain(D.filt(b, 'bp', 3000 + i * 500, 1.2), 0.8); }),
    button: [V.sineBlip(1200, 900, 0.05, 80)],
    whoosh_in: [D.gain(V.noiseSweep(0.32, 400, 7000 * pk.bright, true, 0.8), 0.5)],
    whoosh_out: [D.gain(V.noiseSweep(0.32, 7000 * pk.bright, 400, false, 0.8), 0.5)],
    swoosh: [D.gain(V.noiseSweep(0.45, 2500 * pk.bright, 600, false, 1.5), 0.4)],
    riser: [D.gain(V.noiseSweep(1.8, 250, 9000 * pk.bright, true, 1.0), 0.6)],
    impact: [D.gain(V.deepKick(1.3), 0.9)],
    confetti: [0, 1, 2].map((i) => V.chime([100 + i, 103 + i], 0.3, 0.02)),
    logo_sting: [D.gain(V.chime([77, 84, 89, 96], 2.0, 0.05), 0.8)],
  };
  for (const k of Object.keys(B)) if (!['impact', 'riser', 'whoosh_in', 'whoosh_out', 'swoosh'].includes(k)) B[k] = B[k].map(P);
  return B;
}

// cues: [{type, t, gain?, pitch?, pan?, end? (riser), snap?}]
export function renderSfx(cues, dur, { bpm = null, pack = 'soft-pop', density = 1, seed = 11 } = {}) {
  D.setSeed(seed); const pk = PACKS[pack] || PACKS['soft-pop']; const B = bank(pk);
  const n = Math.round(dur * SR), out = D.stereo(n), grid = bpm ? 60 / bpm / 4 : null; const count = {}; const warnings = []; let lastLoud = -1;
  const sorted = [...cues].sort((a, b) => a.t - b.t);
  for (const c of sorted) {
    const typ = c.type; if (!B[typ]) { warnings.push(`unknown sfx type ${typ}`); continue; }
    if (density < 1 && ['word_pop', 'letter_tick', 'type', 'slot_tick'].includes(typ) && D.rand() > density) continue;
    let t = c.t;
    if (typ === 'riser' && c.end != null) t = c.end - 1.8;
    else if (grid && c.snap !== false) { const s = Math.round(t / grid) * grid; if (Math.abs(s - t) < 0.045) t = s; }
    const [g0, hp] = SFX_RULES[typ]; const g = g0 + (c.gain || 0);
    if (g > -12 && lastLoud >= 0 && t - lastLoud < 0.12) warnings.push(`two loud sfx within 120 ms at ${t.toFixed(2)}s`);
    if (g > -12) lastLoud = t;
    const i = count[typ] = (count[typ] || 0) + 1; let x = B[typ][(i - 1) % B[typ].length];
    if (c.pitch) x = V.pitchShift(x, c.pitch);
    x = D.filt(x, 'hp', hp);
    D.place(out, x, Math.max(0, t), D.db(g), c.pan || 0);
  }
  const wet = D.reverb(out, 0.2, 0.6, pk.room); D.mixInto(out, wet);
  return { buf: out, warnings };
}
