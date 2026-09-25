import path from 'node:path';
import fs from 'node:fs';
import { run, die, ff, probe, mkdirp, has, readJson } from './util.mjs';
import {reviewHash} from './phase2.mjs';
const PRESETS = { wa: { maxMb: 15.5, audioK: 128 }, ig: { maxMb: 95, audioK: 192 }, yt: { crf: 16, audioK: 192 }, master: { crf: 12, audioK: 256 } };
export function cmdRender(a) {
  const proj = path.resolve(a.dir || '.'); const comp = a.comp || 'Main'; const preset = PRESETS[a.preset || 'yt'] || die(`unknown preset ${a.preset}`, 'wa | ig | yt | master');
  if(a.audio){ const audio=path.resolve(a.audio), review=readJson(path.resolve(a.review||path.join(proj,'out/mix-review/review.json')));
    if(!review?.approvedAt||review.source!==audio||review.sha256!==reviewHash(audio))die('mix review missing or stale; listen to full mix and cue clips, then run mix review --file <mix> --approve before export'); }
  mkdirp(path.join(proj, 'out')); const raw = path.join(proj, 'out', 'raw.mp4'); const gl = a.gl || (process.platform === 'linux' && !fs.existsSync('/dev/dri') ? 'swangle' : 'angle');
  const args = ['--no-install', 'remotion', 'render', 'src/index.ts', comp, raw, '--crf=14', `--gl=${gl}`]; if (a.props) args.push(`--props=${a.props}`); if (a.concurrency) args.push(`--concurrency=${a.concurrency}`);
  if (!a.skipRender) { const r = run('npx', args, { cwd: proj, stdio: 'inherit' }); if (r.status !== 0) die('render failed', 'common fixes: video clips that fail to decode -> convert to a JPG sequence (<Frames>); out of memory -> --concurrency 2; WebGL errors -> --gl swangle'); }
  const outF = path.resolve(proj, a.out || `out/${comp}_${a.preset || 'yt'}.mp4`); const dur = +probe(raw).format.duration; const audio = a.audio ? path.resolve(a.audio) : null;
  const inA = audio ? ['-i', audio, '-map', '0:v', '-map', '1:a', '-shortest'] : [];
  if (preset.maxMb) { const vk = Math.max(300, Math.floor(preset.maxMb * 8192 / dur - preset.audioK)); const pl = path.join(proj, 'out', 'pass');
    ff(['-i', raw, '-c:v', 'libx264', '-preset', 'medium', '-b:v', `${vk}k`, '-pass', '1', '-passlogfile', pl, '-an', '-f', 'mp4', process.platform === 'win32' ? 'NUL' : '/dev/null']);
    ff(['-i', raw, ...inA, '-c:v', 'libx264', '-preset', 'medium', '-b:v', `${vk}k`, '-pass', '2', '-passlogfile', pl, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', `${preset.audioK}k`, outF]); }
  else ff(['-i', raw, ...inA, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(preset.crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', `${preset.audioK}k`, outF]);
  const p = probe(outF); return { output: outF, sizeMb: +(+p.format.size / 1048576).toFixed(2), duration: +(+p.format.duration).toFixed(2), gl };
}
