// Environment preflight. Detects, reports, and suggests - it NEVER installs anything.
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { has, run, writeJson, stateDir, SKILL_DIR, readJson } from './util.mjs';

const OS = process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'windows' : 'linux';
const pm = OS === 'mac' ? (has('brew') ? 'brew' : null) : OS === 'windows' ? (has('winget', ['--version']) ? 'winget' : has('choco') ? 'choco' : null) : (has('apt-get', ['--version']) ? 'apt' : has('dnf') ? 'dnf' : has('pacman', ['--version']) ? 'pacman' : null);
const INSTALL = {
  node: { brew: 'brew install node', winget: 'winget install OpenJS.NodeJS.LTS', choco: 'choco install nodejs-lts', apt: 'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs', dnf: 'sudo dnf install nodejs', pacman: 'sudo pacman -S nodejs npm', any: 'https://nodejs.org (LTS)' },
  ffmpeg: { brew: 'brew install ffmpeg', winget: 'winget install Gyan.FFmpeg', choco: 'choco install ffmpeg', apt: 'sudo apt-get install -y ffmpeg', dnf: 'sudo dnf install ffmpeg', pacman: 'sudo pacman -S ffmpeg', any: 'https://ffmpeg.org/download.html' },
  python: { brew: 'brew install python', winget: 'winget install Python.Python.3.12', choco: 'choco install python', apt: 'sudo apt-get install -y python3 python3-pip', dnf: 'sudo dnf install python3', pacman: 'sudo pacman -S python', any: 'https://python.org' },
  pylibs: { any: 'python3 -m pip install --user numpy scipy librosa soundfile pyloudnorm' },
  ytdlp: { brew: 'brew install yt-dlp', winget: 'winget install yt-dlp.yt-dlp', choco: 'choco install yt-dlp', apt: 'python3 -m pip install --user yt-dlp', dnf: 'python3 -m pip install --user yt-dlp', pacman: 'sudo pacman -S yt-dlp', any: 'python3 -m pip install --user yt-dlp' },
  whisper: { any: 'python3 -m pip install --user faster-whisper   (or build whisper.cpp: https://github.com/ggml-org/whisper.cpp)' },
  tesseract: { brew: 'brew install tesseract', winget: 'winget install UB-Mannheim.TesseractOCR', apt: 'sudo apt-get install -y tesseract-ocr', dnf: 'sudo dnf install tesseract', pacman: 'sudo pacman -S tesseract', any: 'https://github.com/tesseract-ocr/tesseract' },
  remotion: { any: 'node scripts/motioncraft.mjs new <folder>   (copies the template, then asks before running npm install)' },
};
const cmdFor = (k) => INSTALL[k][pm] || INSTALL[k].any;

export function doctor(a) {
  const quick = a.quick; const cacheP = path.join(stateDir(a), 'env.json');
  if (quick) { const c = readJson(cacheP); if (c && Date.now() - c.checkedAt < 7 * 864e5) return c; }
  const items = []; const add = (id, tier, ok, detail, fix, fallback) => items.push({ id, tier, ok: !!ok, detail: detail || '', fix: ok ? null : fix, fallback: ok ? null : fallback || null });
  const nodeV = process.versions.node; const major = +nodeV.split('.')[0];
  add('node', 'required', major >= 18, `v${nodeV}`, cmdFor('node'), 'none - Node 18+ is required');
  const npm = has('npm', ['--version']); add('npm', 'required', npm, npm ? `v${npm}` : 'missing', 'comes with Node.js', null);
  const proj = findProject(a.dir || process.cwd());
  let remV = null; if (proj) { try { remV = JSON.parse(fs.readFileSync(path.join(proj, 'node_modules', 'remotion', 'package.json'), 'utf8')).version; } catch {} }
  add('remotion', 'required', remV, remV ? `v${remV} in ${proj}` : proj ? `project at ${proj} but dependencies not installed` : 'no Remotion project here yet', proj ? `cd ${proj} && npm install` : cmdFor('remotion'), null);
  const ffv = has('ffmpeg', ['-version']); const ffBundled = !ffv && proj && remV && has('npx', ['--no-install', 'remotion', 'ffmpeg', '-version']);
  add('ffmpeg', 'recommended', ffv || ffBundled, ffv ? ffv.split('\n')[0] : ffBundled ? 'using Remotion bundled ffmpeg (H.264/H.265/VP8/VP9/ProRes only)' : 'missing', cmdFor('ffmpeg'), 'Remotion bundled ffmpeg (npx remotion ffmpeg) once the project is installed');
  const py = has('python3') || has('python'); add('python', 'optional', py, py || 'missing', cmdFor('python'), 'pure-Node analyzers (slightly less accurate BPM/key)');
  let libs = null; if (py) { const r = run(has('python3') ? 'python3' : 'python', ['-c', 'import numpy,scipy,librosa,soundfile,pyloudnorm;print("ok")']); libs = r.status === 0; }
  add('python-libs', 'optional', libs, libs ? 'numpy scipy librosa soundfile pyloudnorm' : 'missing', cmdFor('pylibs'), 'pure-Node analyzers');
  const yt = has('yt-dlp'); add('yt-dlp', 'recommended', yt, yt ? `v${yt}` : 'missing', cmdFor('ytdlp'), 'ask the user to download the reference video and pass the file');
  let wh = null; if (py) { const r = run(has('python3') ? 'python3' : 'python', ['-c', 'import faster_whisper;print("ok")']); if (r.status === 0) wh = 'faster-whisper'; }
  if (!wh && (has('whisper-cli', ['-h']) || has('whisper-cpp', ['-h']))) wh = 'whisper.cpp';
  if (!wh && has('whisper', ['--help'])) wh = 'openai-whisper';
  add('whisper', 'recommended', wh, wh || 'missing', cmdFor('whisper'), 'sentence-level sync from silence detection (less precise than word-level)');
  const tess = has('tesseract'); add('tesseract', 'optional', tess, tess ? tess.split('\n')[0] : 'missing', cmdFor('tesseract'), 'skip on-screen text OCR in reference analysis');
  const gpu = detectGpu(); add('gpu', 'optional', gpu.ok, gpu.detail, 'no action needed', 'render 3D with --gl=swangle (software, slower) or pre-render 3D to PNG');
  const disk = freeDiskGb(a.dir || process.cwd()); add('disk', 'recommended', disk == null || disk > 5, disk == null ? 'unknown' : `${disk.toFixed(1)} GB free`, 'free up space (renders need ~2-5 GB)', null);
  const res = { checkedAt: Date.now(), os: OS, arch: process.arch, cpus: os.cpus().length, ramGb: +(os.totalmem() / 1073741824).toFixed(1), packageManager: pm, project: proj, items,
    mode: { audioAnalysis: libs ? 'python' : 'node', sync: wh ? 'word' : 'sentence', ffmpeg: ffv ? 'system' : ffBundled ? 'remotion' : 'none', gl: gpu.ok ? 'angle' : 'swangle', reference: yt ? 'download' : 'manual' } };
  writeJson(cacheP, res); return res;
}
function findProject(dir) { let d = path.resolve(dir); for (let i = 0; i < 4; i++) { const p = path.join(d, 'package.json'); if (fs.existsSync(p)) { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if ((j.dependencies || {}).remotion) return d; } const up = path.dirname(d); if (up === d) break; d = up; } return null; }
function detectGpu() {
  if (process.platform === 'darwin') return { ok: true, detail: 'macOS (Metal via ANGLE)' };
  if (process.platform === 'win32') return { ok: true, detail: 'Windows (ANGLE/D3D)' };
  if (has('nvidia-smi', ['-L'])) return { ok: true, detail: 'NVIDIA GPU' };
  if (fs.existsSync('/dev/dri')) return { ok: true, detail: '/dev/dri present' };
  return { ok: false, detail: 'no GPU detected (server/container)' };
}
function freeDiskGb(dir) { try { const s = fs.statfsSync(dir); return s.bavail * s.bsize / 1073741824; } catch { return null; } }

export function printDoctor(r) {
  const icon = (it) => it.ok ? '✔' : it.tier === 'required' ? '✖' : '•';
  const lines = [`motioncraft doctor  -  ${r.os}/${r.arch}, ${r.cpus} CPU, ${r.ramGb} GB RAM, package manager: ${r.packageManager || 'none found'}`, ''];
  for (const tier of ['required', 'recommended', 'optional']) { lines.push(tier.toUpperCase());
    for (const it of r.items.filter((x) => x.tier === tier)) { lines.push(`  ${icon(it)} ${it.id.padEnd(12)} ${it.detail}`); if (!it.ok) { lines.push(`      install : ${it.fix}`); if (it.fallback) lines.push(`      fallback: ${it.fallback}`); } } lines.push(''); }
  const missing = r.items.filter((x) => !x.ok && x.tier !== 'optional');
  lines.push(missing.length ? 'AGENT: show this list to the user and ASK before installing anything. If they skip, use the fallback.' : 'All required and recommended tools are present.');
  lines.push(`modes: ${JSON.stringify(r.mode)}`);
  return lines.join('\n');
}
