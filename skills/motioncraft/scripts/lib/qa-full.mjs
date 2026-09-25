import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {probe,run,mkdirp,writeJson,die} from './util.mjs';

// Inspect every decoded frame of the rendered video. Sampling can miss a one-frame flash.
export function qaFull(a) {
 const input=path.resolve(a._?.[1]||a.file||'out/final.mp4');
 if(!fs.existsSync(input))die(`video not found: ${input}`);
 const p=probe(input),v=p.streams.find(s=>s.codec_type==='video');if(!v)die('qa full needs a video stream');
 const fpsNum=Number(v.avg_frame_rate?.split('/')[0]),fpsDen=Number(v.avg_frame_rate?.split('/')[1]||1),fps=fpsNum/fpsDen;
 if(!Number.isFinite(fps)||fps<=0)die('video frame rate unavailable');
 const duration=Number(p.format.duration);if(!Number.isFinite(duration)||duration<=0)die('video duration unavailable');
 const dir=path.resolve(a.outDir||'out/qa-full');mkdirp(dir);const flaggedDir=path.join(dir,'flagged');mkdirp(flaggedDir);
 const script=path.join(path.dirname(new URL(import.meta.url).pathname),'qa_full.py');
 const r=run('python3',[script,input,String(v.width),String(v.height),String(fps),path.join(dir,'findings.json'),flaggedDir],{maxBuffer:1<<24});
 if(r.status!==0)die('full QA failed: '+(r.stderr||r.stdout||'').slice(-800));
 const findings=JSON.parse(fs.readFileSync(path.join(dir,'findings.json'),'utf8'));
 const framesScanned=findings.framesScanned;
 if(!framesScanned)die('No decoded frames');
 const report={source:input,sha256:crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex'),framesScanned,width:v.width,height:v.height,duration,fps,issues:findings.issues,ocrFailures:findings.ocrFailures,pass:findings.issues.length===0&&findings.ocrFailures.length===0,note:'Every decoded frame was checked. OCR heuristics can miss low-contrast, animated, stylized or non-Latin text; collision flags are OCR geometry, not semantic proof. Inspect flagged frames and watch/listen to the final video. A pass is not visual certification.',flaggedFramesDir:flaggedDir};
 const manifest=path.join(dir,'review.json');writeJson(manifest,report);
 return {manifest,...report};
}
