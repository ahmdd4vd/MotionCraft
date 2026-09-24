// Style validator: blocks combinations that look cheap, explains why, suggests a fix.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, die, SKILL_DIR } from './util.mjs';
const SLOP_FONTS = ['inter', 'roboto', 'arial', 'helvetica', 'poppins', 'montserrat', 'open sans'];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h) => { const c = hex(h).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export function checkStyle(t) {
  const E = [], Wn = []; const add = (arr, rule, why, fix) => arr.push({ rule, why, fix });
  const bg = t.color.bg[t.color.bg.length - 1];
  const ci = contrast(t.color.ink, bg); if (ci < 4.5) add(E, 'ink contrast', `ink on background is ${ci.toFixed(2)}:1, needs >= 4.5:1`, 'darken ink or lighten background');
  const ca = contrast(t.color.accent, bg); if (ca < 3) add(E, 'accent contrast', `accent on background is ${ca.toFixed(2)}:1; accent words are large, so >= 3:1 is the floor`, 'pick a deeper accent');
  const cm = contrast(t.color.muted, bg); if (cm < 2.8) add(Wn, 'muted contrast', `muted text is ${cm.toFixed(2)}:1 - captions may disappear on phones`, 'darken muted');
  if (SLOP_FONTS.includes(t.font.display.toLowerCase())) add(Wn, 'default font', `${t.font.display} is the most common AI-default font; the video will look generic`, 'Figtree, Manrope, Satoshi, General Sans, Geist, or a brand font');
  const s = t.font.size; if (s.h0[0] / s.h1[1] < 1.5) add(E, 'hierarchy', 'h0 must be >= 1.5x h1 so the big moment reads as big', 'raise h0 or lower h1');
  if (s.h1[0] / s.h2[1] < 1.35) add(E, 'hierarchy', 'h1 must be >= 1.35x h2', 'separate the sizes');
  if (t.font.maxLines > 2) add(E, 'max lines', 'more than 2 lines of text on screen turns into reading, not watching', 'keep maxLines at 2');
  const m = t.motion, L = m.limits;
  if (m.word.inFrames < L.minEnterFrames || m.word.inFrames > L.maxEnterFrames) add(E, 'word timing', `word enter ${m.word.inFrames}f outside ${L.minEnterFrames}-${L.maxEnterFrames}f`, 'use 10-14f');
  if (m.word.stagger[0] < L.minStagger) add(E, 'stagger', 'stagger under 2 frames reads as one blob', 'use 3-5 frames');
  if (m.word.blur > 16 || m.card.blur > 20) add(Wn, 'blur', 'very large blur makes motion feel mushy', 'keep word blur ~10, card blur ~12');
  const eo = t.ease.out; if (eo[0] === eo[1] && eo[2] === eo[3]) add(E, 'easing', 'linear easing on UI motion looks robotic', 'use [0.22,1,0.36,1] for enters');
  if (m.camera.maxZoom > 1.3) add(Wn, 'camera', 'zoom over 1.3x crops text and makes collisions likely', 'cap at 1.2');
  if (t.layout.safe.min < 48) add(E, 'safe area', 'margins under 48px get cut by phone UIs', 'min 60');
  if ((t.color.glow || []).length > 2) add(Wn, 'glow', 'more than 2 background glows starts to look like the colored-blob AI look', 'max 2, same hue family');
  return { style: t.name, pass: E.length === 0, errors: E, warnings: Wn };
}
export function cmdStyle(a) {
  const sub = a._[0];
  if (sub === 'list') return { styles: fs.readdirSync(path.join(SKILL_DIR, 'styles')).map((s) => ({ id: s, description: readJson(path.join(SKILL_DIR, 'styles', s, 'tokens.json'))?.description })) };
  if (sub === 'check') { const f = a._[1] ? path.resolve(a._[1]) : fs.existsSync('src/style.json') ? path.resolve('src/style.json') : path.join(SKILL_DIR, 'styles', 'pi-v2', 'tokens.json'); const t = readJson(f) || die(`cannot read ${f}`); return checkStyle(t); }
  if (sub === 'knobs') { // apply knob values to a tokens file -> new tokens (never edits components)
    const f = path.resolve(a._[1] || 'src/style.json'); const t = readJson(f) || die(`cannot read ${f}`); const k = { ...t.knobs }; for (const n of ['energy', 'density', 'warmth', 'roundness', 'depth']) if (a[n] != null) k[n] = Math.max(0, Math.min(1, +a[n])); if (a.camera) k.camera = a.camera;
    const e = k.energy; const sp = 1.25 - e * 0.5; // energy 0 -> slower, 1 -> faster
    t.motion.word.inFrames = Math.round(12 * sp); t.motion.word.stagger = [Math.max(2, Math.round(4.5 * sp)), Math.max(3, Math.round(5 * sp))]; t.motion.card.frames = Math.round(24 * sp); t.motion.scene.overlap = Math.round(17 * sp);
    t.motion.word.spring.damping = +(11 + (0.5 - e) * 4).toFixed(1); t.motion.camera.drift = k.camera === 'still' ? 0 : k.camera === 'active' ? 12 : 8;
    t.shape.cardRadius = Math.round(10 + k.roundness * 20); t.motion.card.rotateX = +(k.depth * 17).toFixed(1);
    const warm = k.warmth; t.color.bg = warm > 0.6 ? ['#faf8f5', '#f8f5f0', '#f3ece2'] : warm < 0.25 ? ['#f6f8fb', '#f2f5fa', '#e6eef9'] : t.color.bg;
    t.audio.sfxPerMinute = [Math.round(80 + e * 80), Math.round(120 + e * 100)]; t.knobs = k;
    const o = path.resolve(a.out || f); fs.writeFileSync(o, JSON.stringify(t, null, 2)); return { written: o, knobs: k, check: checkStyle(t) };
  }
  die('usage: style list | check [tokens.json] | knobs [tokens.json] --energy 0.7 --warmth 0.5 ...');
}
