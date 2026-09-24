// motioncraft DSP core - pure Node, no dependencies.
// Stereo buffers are {L: Float32Array, R: Float32Array}.
export const SR = 48000;

let seed = 7;
export function setSeed(s) { seed = s >>> 0 || 7; }
export function rand() { // mulberry32
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const randn = () => { let u = 0, v = 0; while (!u) u = rand(); v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
export const db = (x) => Math.pow(10, x / 20);
export const toDb = (x) => 20 * Math.log10(Math.max(1e-12, x));
export const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

export function stereo(n) { return { L: new Float32Array(n), R: new Float32Array(n) }; }
export function fromMono(x) { return { L: x, R: Float32Array.from(x) }; }
export function len(b) { return b.L.length; }
export function clone(b) { return { L: Float32Array.from(b.L), R: Float32Array.from(b.R) }; }

export function place(buf, x, t, g = 1, panPos = 0) {
  const i0 = Math.round(t * SR); const n = len(buf);
  if (i0 >= n) return;
  const l = Math.cos((panPos + 1) * Math.PI / 4) * Math.SQRT2, r = Math.sin((panPos + 1) * Math.PI / 4) * Math.SQRT2;
  const xl = x.L || x, xr = x.R || x;
  for (let k = Math.max(0, -i0); k < xl.length && i0 + k < n; k++) {
    buf.L[i0 + k] += xl[k] * g * l; buf.R[i0 + k] += xr[k] * g * r;
  }
}
export function mixInto(dst, src, g = 1) { const n = Math.min(len(dst), len(src)); for (let i = 0; i < n; i++) { dst.L[i] += src.L[i] * g; dst.R[i] += src.R[i] * g; } }
export function gain(b, g) { for (let i = 0; i < len(b); i++) { b.L[i] *= g; b.R[i] *= g; } return b; }
export function peak(b) { let p = 0; for (let i = 0; i < len(b); i++) { p = Math.max(p, Math.abs(b.L[i]), Math.abs(b.R[i])); } return p; }

export function adsr(n, a, d, s, r, hold = null) {
  const A = Math.max(1, Math.round(a * SR)), D = Math.max(1, Math.round(d * SR)), Rl = Math.max(1, Math.round(r * SR));
  let H = hold == null ? n - A - D - Rl : Math.round(hold * SR); H = Math.max(0, H);
  const e = new Float32Array(n); let i = 0;
  for (let k = 0; k < A && i < n; k++) e[i++] = k / A;
  for (let k = 0; k < D && i < n; k++) e[i++] = 1 + (s - 1) * k / D;
  for (let k = 0; k < H && i < n; k++) e[i++] = s;
  for (let k = 0; k < Rl && i < n; k++) e[i++] = s * (1 - k / Rl);
  return e;
}

// ---------- biquad (RBJ cookbook)
export function biquadCoefs(type, f, q = 0.707, gainDb = 0) {
  f = Math.min(f, SR / 2.2);
  const w = 2 * Math.PI * f / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q), A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  switch (type) {
    case 'lp': b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
    case 'hp': b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
    case 'bp': b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
    case 'peak': b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A; break;
    case 'lowshelf': { const sq = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) - (A - 1) * c + sq); b1 = 2 * A * ((A - 1) - (A + 1) * c); b2 = A * ((A + 1) - (A - 1) * c - sq);
      a0 = (A + 1) + (A - 1) * c + sq; a1 = -2 * ((A - 1) + (A + 1) * c); a2 = (A + 1) + (A - 1) * c - sq; break; }
    case 'highshelf': { const sq = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) + (A - 1) * c + sq); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - sq);
      a0 = (A + 1) - (A - 1) * c + sq; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - sq; break; }
    default: throw new Error('biquad type ' + type);
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
export function biquadMono(x, co) {
  const [b0, b1, b2, a1, a2] = co; let x1 = 0, x2 = 0, y1 = 0, y2 = 0; const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
export function filt(b, type, f, q, g) { const co = biquadCoefs(type, f, q, g); return { L: biquadMono(b.L, co), R: biquadMono(b.R, co) }; }

// ---------- compressor (feed-forward, peak detector, stereo linked)
export function compress(b, thrDb = -18, ratio = 3, attMs = 5, relMs = 100, makeupDb = 0) {
  const at = Math.exp(-1 / (attMs * SR / 1000)), rt = Math.exp(-1 / (relMs * SR / 1000));
  let env = 0; const out = clone(b); const mk = db(makeupDb);
  for (let i = 0; i < len(b); i++) {
    const lv = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i]));
    env = lv > env ? at * env + (1 - at) * lv : rt * env + (1 - rt) * lv;
    const e = toDb(env); const over = e - thrDb; const gr = over > 0 ? over * (1 - 1 / ratio) : 0;
    const g = db(-gr) * mk; out.L[i] *= g; out.R[i] *= g;
  }
  return out;
}

// ---------- Freeverb-style reverb (wet only)
const CombT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], APT = [556, 441, 341, 225];
export function reverb(b, room = 0.5, damp = 0.5, wet = 0.25, width = 1) {
  const n = len(b), scale = SR / 44100, fb = 0.7 + room * 0.28, out = stereo(n);
  for (const [ch, spread] of [['L', 0], ['R', 23]]) {
    const input = ch === 'L' ? b.L : b.R; const acc = new Float32Array(n);
    for (const ct of CombT) {
      const L = Math.round((ct + spread) * scale); const buf = new Float32Array(L); let idx = 0, store = 0;
      for (let i = 0; i < n; i++) { const o = buf[idx]; store = o * (1 - damp) + store * damp; buf[idx] = input[i] * 0.015 + store * fb; acc[i] += o; idx = (idx + 1) % L; }
    }
    for (const at of APT) {
      const L = Math.round((at + spread) * scale); const buf = new Float32Array(L); let idx = 0;
      for (let i = 0; i < n; i++) { const bo = buf[idx]; const o = -acc[i] + bo; buf[idx] = acc[i] + bo * 0.5; acc[i] = o; idx = (idx + 1) % L; }
    }
    out[ch] = acc;
  }
  const w1 = wet * (width / 2 + 0.5), w2 = wet * ((1 - width) / 2);
  const res = stereo(n);
  for (let i = 0; i < n; i++) { res.L[i] = out.L[i] * w1 + out.R[i] * w2; res.R[i] = out.R[i] * w1 + out.L[i] * w2; }
  return res;
}
export function withReverb(b, room, damp, wet, dry = 1) { const w = reverb(b, room, damp, wet); const o = clone(b); gain(o, dry); mixInto(o, w); return o; }

export function delay(b, timeS, fbk = 0.3, mix = 0.2) {
  const d = Math.round(timeS * SR), n = len(b), o = clone(b);
  for (const ch of ['L', 'R']) { const y = new Float32Array(n); for (let i = 0; i < n; i++) { y[i] = b[ch][i] + (i >= d ? y[i - d] * fbk : 0); } for (let i = 0; i < n; i++) o[ch][i] += (i >= d ? y[i - d] : 0) * mix; }
  return o;
}
export function chorus(b, rate = 0.9, depthMs = 3, mix = 0.35) {
  const n = len(b), o = clone(b), base = 0.012 * SR, dep = depthMs / 1000 * SR;
  for (const [ch, ph] of [['L', 0], ['R', Math.PI / 2]]) {
    const x = b[ch];
    for (let i = 0; i < n; i++) { const d = base + dep * Math.sin(2 * Math.PI * rate * i / SR + ph); const p = i - d; const k = Math.floor(p); const fr = p - k; const v = k >= 1 ? x[k] * (1 - fr) + x[k + 1] * fr : 0; o[ch][i] = x[i] * (1 - mix) + v * mix; }
  }
  return o;
}

// ---------- loudness (ITU-R BS.1770-4, gated integrated LUFS)
export function lufs(b) {
  const pre = biquadCoefsRaw([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]);
  const rlb = biquadCoefsRaw([1, -2, 1], [1, -1.99004745483398, 0.99007225036621]);
  const kw = (x) => biquadMono(biquadMono(resampleTo48(x), pre), rlb);
  const l = kw(b.L), r = kw(b.R); const blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR); const zs = [];
  for (let s = 0; s + blk <= l.length; s += hop) { let z = 0; for (let i = s; i < s + blk; i++) z += l[i] * l[i] + r[i] * r[i]; zs.push(z / blk); }
  if (!zs.length) return -70;
  const L = (z) => -0.691 + 10 * Math.log10(Math.max(z, 1e-12));
  let g = zs.filter((z) => L(z) > -70); if (!g.length) return -70;
  const rel = L(g.reduce((a, c) => a + c, 0) / g.length) - 10; g = g.filter((z) => L(z) > rel);
  return L(g.reduce((a, c) => a + c, 0) / g.length);
}
function biquadCoefsRaw(bb, aa) { return [bb[0], bb[1], bb[2], aa[1], aa[2]]; }
function resampleTo48(x) { return x; } // engine always runs at 48 kHz
export function truePeakDb(b) { // 4x linear-interp oversample estimate
  let p = 0; for (const ch of ['L', 'R']) { const x = b[ch]; for (let i = 0; i < x.length - 1; i++) { for (let k = 0; k < 4; k++) { const v = Math.abs(x[i] + (x[i + 1] - x[i]) * k / 4); if (v > p) p = v; } } }
  return toDb(p);
}
export function master(b, target = -14, tp = -1) {
  let x = compress(filt(b, 'hp', 30), -16, 2, 20, 200);
  for (let it = 0; it < 5; it++) {
    gain(x, db(target - lufs(x)));
    if (truePeakDb(x) <= tp) break;
    const c = db(tp - 0.3), k = c * 0.7, w = c * 0.3;
    for (const ch of ['L', 'R']) { const y = x[ch]; for (let i = 0; i < y.length; i++) { const a = Math.abs(y[i]); if (a > k) y[i] = Math.sign(y[i]) * (k + w * Math.tanh((a - k) / w)); } }
  }
  const pk = truePeakDb(x); if (pk > tp) gain(x, db(tp - pk));
  return { buf: x, lufs: lufs(x), truePeak: truePeakDb(x) };
}
export function fadeOut(b, sec) { const n = len(b), f = Math.min(n, Math.round(sec * SR)); for (let i = 0; i < f; i++) { const g = 1 - i / f; b.L[n - f + i] *= g; b.R[n - f + i] *= g; } }

// ---------- WAV io
export function writeWav(path, b, bits = 24, fs) {
  const { writeFileSync } = fs; const n = len(b), bps = bits / 8, data = n * 2 * bps; const buf = Buffer.alloc(44 + data);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + data, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2 * bps, 28); buf.writeUInt16LE(2 * bps, 32); buf.writeUInt16LE(bits, 34);
  buf.write('data', 36); buf.writeUInt32LE(data, 40); let o = 44; const mx = bits === 24 ? 8388607 : 32767;
  for (let i = 0; i < n; i++) for (const v of [b.L[i], b.R[i]]) { const s = Math.max(-1, Math.min(1, v)); const q = Math.round(s * mx); if (bits === 24) buf.writeIntLE(q, o, 3); else buf.writeInt16LE(q, o); o += bps; }
  writeFileSync(path, buf);
}
export function readWav(path, fs) {
  const buf = fs.readFileSync(path); let p = 12, fmt = null, dataOff = 0, dataLen = 0;
  while (p + 8 <= buf.length) { const id = buf.toString('ascii', p, p + 4), sz = buf.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { fmt: buf.readUInt16LE(p + 8), ch: buf.readUInt16LE(p + 10), sr: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) };
    if (id === 'data') { dataOff = p + 8; dataLen = Math.min(sz, buf.length - dataOff); break; } p += 8 + sz + (sz & 1); }
  if (!fmt) throw new Error('not a WAV file: ' + path);
  const bps = fmt.bits / 8, fr = Math.floor(dataLen / (bps * fmt.ch)); const L = new Float32Array(fr), R = new Float32Array(fr);
  for (let i = 0; i < fr; i++) for (let c = 0; c < Math.min(2, fmt.ch); c++) { const o = dataOff + (i * fmt.ch + c) * bps; let v;
    if (fmt.fmt === 3) v = buf.readFloatLE(o); else if (fmt.bits === 16) v = buf.readInt16LE(o) / 32768; else if (fmt.bits === 24) v = buf.readIntLE(o, 3) / 8388608; else if (fmt.bits === 32) v = buf.readInt32LE(o) / 2147483648; else v = (buf[o] - 128) / 128;
    (c === 0 ? L : R)[i] = v; }
  if (fmt.ch === 1) R.set(L);
  return { buf: { L, R }, sr: fmt.sr };
}
