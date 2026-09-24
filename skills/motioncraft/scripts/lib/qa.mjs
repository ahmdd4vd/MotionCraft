import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as D from './dsp.mjs';
import { ff, ffmpeg, probe, toWav48, run, die, readJson, mkdirp, has } from './util.mjs';
import { silences } from './audio.mjs';

export function qaFile(file, a) {
  const p = probe(file); const v = p.streams.find((s) => s.codec_type === 'video'); const au = p.streams.find((s) => s.codec_type === 'audio');
  const size = +p.format.size / 1048576; const dur = +p.format.duration; const max = a.maxMb ? +a.maxMb : null; const issues = [];
  if (max && size > max) issues.push(`file is ${size.toFixed(1)} MB, limit ${max} MB -> re-encode with render --preset wa`);
  if (!au) issues.push('no audio stream');
  if (au && v && Math.abs(+(au.duration || dur) - +(v.duration || dur)) > 0.15) issues.push(`audio (${au.duration}s) and video (${v.duration}s) lengths differ`);
  return { file, sizeMb: +size.toFixed(2), duration: +dur.toFixed(2), video: v && `${v.width}x${v.height} ${v.codec_name} ${v.r_frame_rate}`, audio: au && `${au.codec_name} ${au.sample_rate}Hz`, pass: !issues.length, issues };
}
export function qaAudio(file) {
  const w = D.readWav(toWav48(file, 'qa.wav'), fs).buf; const l = D.lufs(w), tp = D.truePeakDb(w); const issues = [];
  if (Math.abs(l + 14) > 1) issues.push(`loudness ${l.toFixed(1)} LUFS (target -14 ±1)`);
  if (tp > -1) issues.push(`true peak ${tp.toFixed(2)} dBTP (must be <= -1)`);
  const sil = silences(w.L, 48000, -45, 1.2).filter(([s]) => s > 0.5 && s < w.L.length / 48000 - 3); if (sil.length) issues.push(`long silences at ${sil.map((x) => x[0] + 's').join(', ')}`);
  return { lufs: +l.toFixed(2), truePeak: +tp.toFixed(2), pass: !issues.length, issues };
}
export function qaSheet(file, a) {
  const dur = +probe(file).format.duration; const n = +(a.count || 24); const dir = path.resolve(a.outDir || 'out/qa'); mkdirp(dir); const frames = [];
  for (let i = 0; i < n; i++) { const t = (i + 0.5) * dur / n; const o = path.join(dir, `q_${String(i).padStart(2, '0')}.jpg`); ff(['-ss', t.toFixed(2), '-i', file, '-frames:v', '1', '-vf', `scale=480:-2,drawtext=text='${t.toFixed(1)}s':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5`, o]); frames.push(o); }
  const sheet = path.join(dir, 'sheet.jpg'); ff(['-pattern_type', 'glob', '-i', path.join(dir, 'q_*.jpg'), '-frames:v', '1', '-vf', 'tile=4x6:padding=4', sheet]);
  return { sheet, frames: frames.length, note: 'Open the sheet. Check: text collisions, text near edges, one focus per frame, hierarchy, accent count, anything that looks like AI slop.' };
}
// Overlap check: renders the composition in debug-box mode at 1/4 scale, then scans every frame.
export function qaOverlap(a) {
  const proj = path.resolve(a.dir || '.'); const comp = a.comp || 'Main'; const scale = +(a.scale || 0.25); const tmp = path.join(os.tmpdir(), `mc-ov-${process.pid}`); mkdirp(tmp);
  const props = JSON.stringify({ ...(a.props ? JSON.parse(a.props) : {}), mcDebug: true });
  const r = run('npx', ['--no-install', 'remotion', 'render', 'src/index.ts', comp, path.join(tmp, 'dbg.mp4'), `--props=${props}`, `--scale=${scale}`, '--codec=h264', '--crf=1', '--muted', `--gl=${a.gl || 'swangle'}`], { cwd: proj, stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) die('debug render failed: ' + (r.stderr || '').slice(-600), 'run inside the project folder after npm install');
  const p = probe(path.join(tmp, 'dbg.mp4')); const v = p.streams.find((s) => s.codec_type === 'video'); const W = v.width, H = v.height; const fps = eval(v.r_frame_rate);
  const F = ffmpeg(); const rawPath = path.join(tmp, 'frames.rgb');
  run(F.ff[0], [...F.ff.slice(1), '-y', '-v', 'error', '-i', path.join(tmp, 'dbg.mp4'), '-f', 'rawvideo', '-pix_fmt', 'rgb24', rawPath]);
  const fsz = W * H * 3, frames = Math.floor(fs.statSync(rawPath).size / fsz); const safe = readJson(path.join(proj, 'src', 'style.json'))?.layout?.safe || { min: 60 }; const m = Math.round((safe.min || 60) * scale);
  const hits = []; const minPx = Math.max(4, Math.round(W * H * 0.00015)); const fd = fs.openSync(rawPath, 'r'); const raw = Buffer.alloc(fsz);
  for (let f = 0; f < frames; f++) { let over = 0, blockOver = 0, edge = 0; fs.readSync(fd, raw, 0, fsz, f * fsz);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, R = raw[i], G = raw[i + 1], B = raw[i + 2];
      if (R > 200 && G < 100 && B < 100) over++;                       // two text boxes stacked (red on red)
      if (G > 200 && R < 110 && B < 110) blockOver++;                  // two blocks stacked (green on green)
      if ((x < m || x >= W - m || y < m || y >= H - m) && R > 200 && G < 170 && B < 170) edge++; } // text in the margin
    if (over > minPx || blockOver > minPx * 4 || edge > minPx) hits.push({ frame: f, time: +(f / fps).toFixed(2), textOverlapPx: over, blockOverlapPx: blockOver, textInMarginPx: edge }); }
  fs.closeSync(fd); fs.rmSync(rawPath, { force: true });
  const shots = []; const dir = path.resolve(proj, 'out', 'qa-overlap'); mkdirp(dir);
  const groups = []; for (const h of hits) { const g = groups[groups.length - 1]; if (g && h.frame - g.end <= 2) g.end = h.frame; else groups.push({ start: h.frame, end: h.frame, first: h }); }
  for (const g of groups.slice(0, 12)) { const o = path.join(dir, `overlap_f${g.start}.png`); ff(['-ss', (g.start / fps).toFixed(3), '-i', path.join(tmp, 'dbg.mp4'), '-frames:v', '1', o]); shots.push(o); }
  return { frames, pass: hits.length === 0, problemRanges: groups.map((g) => ({ fromFrame: g.start, toFrame: g.end, fromSec: +(g.start / fps).toFixed(2), toSec: +(g.end / fps).toFixed(2), ...g.first })), screenshots: shots,
    note: hits.length ? 'Red = text box, green = card/block. Dark red/green = two boxes stacked. Fix by moving to separate zones, exiting the old element first, or shortening text. Mark intentional stickers with allowOverlap.' : 'No text collisions, no stacked blocks, no text in the safe margin.' };
}
