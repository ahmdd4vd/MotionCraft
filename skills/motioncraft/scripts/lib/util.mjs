import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const log = (...a) => console.error('[motioncraft]', ...a);
export const out = (obj) => process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
export function die(msg, hint) { console.error(`\n✖ ${msg}` + (hint ? `\n  → ${hint}` : '')); process.exit(1); }
export function has(cmd, args = ['--version']) { try { const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32', timeout: 20000 }); return r.status === 0 ? (r.stdout || r.stderr || '').trim() : null; } catch { return null; } }
export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, shell: process.platform === 'win32', ...opts });
  if (r.error) throw r.error; return r;
}
export function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) { const t = argv[i];
    if (t.startsWith('--')) { const [k, v] = t.slice(2).split('='); if (v !== undefined) a[k] = v; else if (argv[i + 1] && !argv[i + 1].startsWith('--')) a[k] = argv[++i]; else a[k] = true; }
    else a._.push(t); }
  return a;
}
export const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
export const writeJson = (p, o) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 2)); };
export const mkdirp = (p) => fs.mkdirSync(p, { recursive: true });
export const workDir = (a) => path.resolve(a.dir || process.cwd());
export const stateDir = (a) => { const d = path.join(workDir(a), '.motioncraft'); mkdirp(d); return d; };

// ffmpeg resolution: system binary first, then Remotion's bundled one (v4+, limited codecs).
let FF = null;
export function ffmpeg() {
  if (FF) return FF;
  if (has('ffmpeg', ['-version'])) FF = { ff: ['ffmpeg'], fp: ['ffprobe'], source: 'system' };
  else if (has('npx', ['--no-install', 'remotion', 'ffmpeg', '-version'])) FF = { ff: ['npx', '--no-install', 'remotion', 'ffmpeg'], fp: ['npx', '--no-install', 'remotion', 'ffprobe'], source: 'remotion-bundled' };
  else die('ffmpeg not found (neither system ffmpeg nor Remotion\'s bundled one).', 'Run `node scripts/motioncraft.mjs doctor` to see install options, or run this inside a Remotion project (npx remotion ffmpeg).');
  return FF;
}
export function ff(args, opts) { const F = ffmpeg(); const r = run(F.ff[0], [...F.ff.slice(1), '-hide_banner', '-y', ...args], opts); if (r.status !== 0) die('ffmpeg failed: ' + (r.stderr || '').split('\n').slice(-6).join('\n')); return r; }
export function probe(file) {
  const F = ffmpeg(); const r = run(F.fp[0], [...F.fp.slice(1), '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]);
  if (r.status !== 0) die('ffprobe failed on ' + file); return JSON.parse(r.stdout);
}
// decode any audio to 48k stereo wav with ffmpeg (so the pure-JS analyzers only ever see one format)
export function toWav48(input, tmpName = 'a48.wav') { const o = path.join(os.tmpdir(), `mc-${process.pid}-${tmpName}`); ff(['-i', input, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', o]); return o; }
export const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
