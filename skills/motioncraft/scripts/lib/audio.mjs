// Pure-JS audio analysis: loudness, true peak, BPM + beat grid, onsets, key, drop, silences.
import fs from 'node:fs';
import * as D from './dsp.mjs';

function fft(re, im) { // in-place radix-2
  const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
      re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
}
function spectrogram(mono, sr, N = 2048, hop = 512) {
  const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); const frames = [];
  for (let s = 0; s + N <= mono.length; s += hop) { const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < N; i++) re[i] = mono[s + i] * win[i]; fft(re, im);
    const mag = new Float32Array(N / 2); for (let k = 0; k < N / 2; k++) mag[k] = Math.hypot(re[k], im[k]); frames.push(mag); }
  return { frames, hop, N, sr };
}
function onsetEnvelope(sp) { // spectral flux on log magnitude
  const env = new Float32Array(sp.frames.length); let prev = null;
  sp.frames.forEach((m, i) => { const lm = m.map((v) => Math.log1p(v * 10)); if (prev) { let s = 0; for (let k = 1; k < lm.length; k++) { const d = lm[k] - prev[k]; if (d > 0) s += d; } env[i] = s; } prev = lm; });
  const mx = Math.max(...env) || 1; return env.map((v) => v / mx);
}
function tempo(env, fr) { // autocorrelation over 60-180 bpm, weighted toward 90-120
  let best = 0, bestBpm = 100; const scores = [];
  for (let bpm = 60; bpm <= 180; bpm += 0.25) { const lag = 60 * fr / bpm; let s = 0; for (let i = Math.ceil(lag); i < env.length; i++) { const j = i - lag, k = Math.floor(j), f = j - k; s += env[i] * (env[k] * (1 - f) + env[k + 1] * f); }
    const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 105) / 0.6, 2)); scores.push([bpm, s * w]); if (s * w > best) { best = s * w; bestBpm = bpm; } }
  return bestBpm;
}
function beatPhase(env, fr, bpm) { const period = 60 * fr / bpm; let best = 0, bp = 0; for (let ph = 0; ph < period; ph += 0.5) { let s = 0; for (let t = ph; t < env.length; t += period) s += env[Math.round(t)] || 0; if (s > best) { best = s; bp = ph; } } return bp / fr; }
function pickOnsets(env, fr) { const out = []; const w = 3; for (let i = w; i < env.length - w; i++) { let mean = 0; for (let k = i - 8; k <= i + 8; k++) mean += env[Math.max(0, Math.min(env.length - 1, k))]; mean /= 17; let isMax = true; for (let k = i - w; k <= i + w; k++) if (env[k] > env[i]) isMax = false; if (isMax && env[i] > mean + 0.08 && env[i] > 0.12) out.push(+(i / fr).toFixed(3)); } return out; }
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
function key(sp) { // Krumhansl-Schmuckler on a chroma average
  const ch = new Float64Array(12); const bin = sp.sr / sp.N;
  for (const m of sp.frames) for (let k = 3; k < m.length; k++) { const f = k * bin; if (f < 60 || f > 2000) continue; const pc = ((Math.round(12 * Math.log2(f / 440)) % 12) + 12 + 9) % 12; ch[pc] += m[k]; }
  const corr = (p, r) => { const x = [...Array(12)].map((_, i) => ch[(i + r) % 12]); const mx = x.reduce((a, b) => a + b) / 12, mp = p.reduce((a, b) => a + b) / 12; let n = 0, dx = 0, dp = 0; for (let i = 0; i < 12; i++) { n += (x[i] - mx) * (p[i] - mp); dx += (x[i] - mx) ** 2; dp += (p[i] - mp) ** 2; } return n / Math.sqrt(dx * dp + 1e-12); };
  let best = { c: -2 }; for (let r = 0; r < 12; r++) { const a = corr(MAJ, r), b = corr(MIN, r); if (a > best.c) best = { c: a, key: NAMES[r] + ' major' }; if (b > best.c) best = { c: b, key: NAMES[r] + ' minor' }; }
  return { key: best.key, confidence: +best.c.toFixed(2) };
}
function rmsCurve(mono, sr, win = 0.5) { const n = Math.round(win * sr), out = []; for (let s = 0; s + n <= mono.length; s += n) { let e = 0; for (let i = s; i < s + n; i++) e += mono[i] * mono[i]; out.push(D.toDb(Math.sqrt(e / n))); } return out; }
export function silences(mono, sr, thrDb = -38, minDur = 0.25) { const hop = Math.round(0.01 * sr), out = []; let st = null;
  for (let s = 0; s + hop <= mono.length; s += hop) { let e = 0; for (let i = s; i < s + hop; i++) e += mono[i] * mono[i]; const dbv = D.toDb(Math.sqrt(e / hop)); const t = s / sr;
    if (dbv < thrDb) { if (st == null) st = t; } else if (st != null) { if (t - st >= minDur) out.push([+st.toFixed(3), +t.toFixed(3)]); st = null; } }
  if (st != null && mono.length / sr - st >= minDur) out.push([+st.toFixed(3), +(mono.length / sr).toFixed(3)]); return out; }

export function analyze(wavPath, { withKey = true } = {}) {
  const { buf, sr } = D.readWav(wavPath, fs); const n = buf.L.length; const mono = new Float32Array(n); for (let i = 0; i < n; i++) mono[i] = (buf.L[i] + buf.R[i]) / 2;
  const dur = n / sr; const lufs = sr === 48000 ? D.lufs(buf) : null; const tp = D.truePeakDb(buf);
  // downsample to ~22 kHz for rhythm/key work
  const step = Math.max(1, Math.round(sr / 22050)); const ds = new Float32Array(Math.floor(n / step)); for (let i = 0; i < ds.length; i++) ds[i] = mono[i * step]; const dsr = sr / step;
  const sp = spectrogram(ds, dsr); const fr = dsr / sp.hop; const env = onsetEnvelope(sp);
  const bpm = +tempo(env, fr).toFixed(2); const phase = beatPhase(env, fr, bpm); const beat = 60 / bpm; const beats = []; for (let t = phase; t < dur; t += beat) beats.push(+t.toFixed(3));
  const onsets = pickOnsets(env, fr); const rms = rmsCurve(mono, sr);
  let drop = null, bestJump = 0; for (let i = 4; i < rms.length - 2; i++) { const before = (rms[i - 4] + rms[i - 3] + rms[i - 2] + rms[i - 1]) / 4, after = (rms[i] + rms[i + 1]) / 2; if (after - before > bestJump) { bestJump = after - before; drop = i * 0.5; } }
  const res = { file: wavPath, duration: +dur.toFixed(3), sampleRate: sr, lufs: lufs == null ? null : +lufs.toFixed(2), truePeakDb: +tp.toFixed(2), bpm, beatSeconds: +beat.toFixed(4), firstBeat: +phase.toFixed(3),
    beats, bars: beats.filter((_, i) => i % 4 === 0), onsets, drop: drop == null ? null : { t: +drop.toFixed(2), jumpDb: +bestJump.toFixed(1) }, silences: silences(mono, sr), energyDbPerHalfSecond: rms.map((v) => +v.toFixed(1)) };
  if (withKey) Object.assign(res, key(sp));
  return res;
}
