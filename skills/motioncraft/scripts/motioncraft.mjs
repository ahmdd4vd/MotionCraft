#!/usr/bin/env node
// motioncraft - one entry point for every tool in the skill. Pure Node 18+, no npm install needed.
import { parseArgs, out, die } from './lib/util.mjs';
import { doctor, printDoctor } from './lib/doctor.mjs';
import * as C from './lib/commands.mjs';
import { qaFile, qaAudio, qaSheet, qaOverlap } from './lib/qa.mjs';
import {qaPixels} from './lib/qa-pixels.mjs';
import { cmdRender } from './lib/render.mjs';
import { cmdStyle } from './lib/style.mjs';
import {storyboard, preview, cache3d} from './lib/phase1.mjs';
import {autoCues,moodOptions,mixReview} from './lib/phase2.mjs';
import {templatePlan} from './lib/templates.mjs';
import {timelineEditor,timelineInit} from './lib/timeline-editor.mjs';
import {checkUpdate} from './lib/check-update.mjs';
import {gpuPreflight,workerManifest,workerVerify} from './lib/render-worker.mjs';

const HELP = `motioncraft <command> [options]      (all output is JSON unless noted)

  check-update                         compare installed SKILL.md version with latest GitHub release
  doctor [--quick]                     check the machine; never installs (prints a table)
  new <folder> [--style pi-v2] [--format 1:1|4:5|9:16] [--platform ig-feed|reels|tiktok] [--handle @you]   copy the Remotion template
  style list | check [tokens.json] | knobs [tokens.json] --energy 0-1 --density 0-1 --warmth 0-1 --roundness 0-1 --depth 0-1 --camera still|smooth|active
  ref get <url|file> | scenes | frames [--every 0.5] | sheet | motion | colors | audio | text | report   [--dir ref]
  audio analyze <file> [--out a.json] [--full]      BPM, beats, onsets, key, LUFS, true peak, drop, silences
  vo clean <file> | align <file> [--script script.txt] [--lang id] [--out audio/words.json]
  music presets | make [--preset dreamy] [--duration 52] [--drop 12.9] [--key D] [--bpm 93] [--spec music.json] [--stems] [--out audio]
  music audition [...same]             3 x 16 s variations to choose from
  sfx list | make --cues sfx.json [--bpm 93] [--pack soft-pop] [--density 1] [--out audio/sfx.wav]
  mix --vo vo.wav --music audio/music.wav --sfx audio/sfx.wav [--duration 52] [--out audio/final.wav]
  beat grid --bpm 93 --dur 52.6 | snap cues.json [--grid audio/beatgrid.json] [--maxMs 80]
  timeline init launch|tutorial [--out timeline-launch.json]
  timeline edit --board storyboard.json [--grid audio/beatgrid.json] [--out timeline-editor.html]
  timeline build [--words audio/words.json] [--grid audio/beatgrid.json] [--out public/timeline.json]
  template launch|tutorial --spec props.json [--dir project] [--duration 45] (validate real frames)
  storyboard --brief brief.json [--out storyboard.json] [--md storyboard.md]
  preview --board storyboard.json [--comp Main] [--scale 0.35] [--out out/preview-stills]
  sfx auto --board storyboard.json [--timeline public/timeline.json] [--maxPerMin 24] [--out audio/auto-cues.json]
  music moods --mood premium|calm|warm|focused|bright
  mix review --file audio/final.wav [--cues audio/auto-cues.json] [--out out/mix-review]; after listening: --approve
  cache3d --comp LogoOnly --start 0 --end 89 --sources src/scenes/Logo.tsx,src/style.json [--scale 1]
  qa pixels <video> [--board storyboard.json] [--outDir out/qa-pixels] | overlap [--comp Main] | sheet <video> | audio <file> | file <video> [--maxMb 16] | all <video> [--comp Main] [--maxMb 16]
  gpu probe --dir project [--gl angle|egl|swangle]
  worker manifest --dir project --comp Main --gl angle --out render-job.json | verify --dir project --manifest render-job.json
  render [--require-gpu --gl angle|egl] [--comp TimelineLaunch|TimelineTutorial --timeline storyboard.edited.json --grid beatgrid.edited.json --props props.json] [--review out/mix-review/review.json] [--comp Main] [--format 1:1|4:5|9:16] [--all-formats] [--platform ig-feed|reels|tiktok] [--preset wa|ig|yt|master] [--audio audio/final.wav] [--out out/final.mp4]
`;
const [cmd, ...rest] = process.argv.slice(2); const a = parseArgs(rest);
try {
  switch (cmd) {
    case 'check-update': out(await checkUpdate()); break;
    case 'doctor': { const r = doctor(a); if (a.json) out(r); else console.log(printDoctor(r)); break; }
    case 'new': out(C.cmdNew(a)); break;
    case 'style': out(cmdStyle(a)); break;
    case 'ref': out(C.cmdRef(a)); break;
    case 'audio': out(C.cmdAudio(a)); break;
    case 'vo': out(C.cmdVo(a)); break;
    case 'music': out(a._[0]==='moods'?moodOptions(a):C.cmdMusic({ ...a, _: a._[0] === 'make' ? a._.slice(1) : a._ })); break;
    case 'sfx': out(a._[0]==='auto'?autoCues(a):C.cmdSfx({ ...a, _: a._[0] === 'make' ? a._.slice(1) : a._ })); break;
    case 'mix': out(a._[0]==='review'?mixReview(a):C.cmdMix(a)); break;
    case 'beat': out(C.cmdBeat(a)); break;
    case 'timeline': out(a._[0]==='edit'?timelineEditor(a):a._[0]==='init'?timelineInit(a):C.cmdTimeline(a)); break;
    case 'render': out(cmdRender(a)); break;
    case 'gpu': out(gpuPreflight(a)); break;
    case 'worker': out(a._[0]==='manifest'?workerManifest(a):a._[0]==='verify'?workerVerify(a):die('worker manifest|verify')); break;
    case 'storyboard': out(storyboard(a)); break;
    case 'template': out(templatePlan(a)); break;
    case 'preview': out(preview(a)); break;
    case 'cache3d': out(cache3d(a)); break;
    case 'qa': { const s = a._[0], f = a._[1];
      if (s === 'pixels') out(qaPixels(a)); else if (s === 'overlap') out(qaOverlap(a)); else if (s === 'sheet') out(qaSheet(f, a)); else if (s === 'audio') out(qaAudio(f)); else if (s === 'file') out(qaFile(f, a));
      else if (s === 'all') { const r = { file: qaFile(f, a), audio: qaAudio(f), sheet: qaSheet(f, a), overlap: a.comp || a.dir ? qaOverlap(a) : 'skipped (pass --comp/--dir to run inside the project)' }; r.pass = r.file.pass && r.audio.pass && (typeof r.overlap === 'string' || r.overlap.pass); out(r); }
      else die('usage: qa overlap|sheet|audio|file|all'); break; }
    case undefined: case 'help': case '--help': case '-h': console.log(HELP); break;
    default: die(`unknown command "${cmd}"`, 'run: node scripts/motioncraft.mjs help');
  }
} catch (e) { die(e.message || String(e)); }
