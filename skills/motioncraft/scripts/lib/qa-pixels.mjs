import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ff,probe,readJson,writeJson,mkdirp,die,run} from './util.mjs';

const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const times=(duration,board,fps)=>{
 const at=new Set([0,Math.max(0,duration-0.3)]);
 if(board?.scenes?.length){for(const s of board.scenes){for(const t of [s.start,s.end-2/fps,s.previewFrame/fps])if(Number.isFinite(+t)&&t>=0&&t<duration)at.add(+t.toFixed(3));}}
 else for(let i=0;i<8;i++)at.add(+((i+0.5)*duration/8).toFixed(3));
 return [...at].sort((a,b)=>a-b).filter((v,i,x)=>i===0||v-x[i-1]>=0.18);
};
export function fontAudit(dir){
 const style=readJson(path.join(dir,'src/style.json'));if(!style?.font) return {pass:false,issues:['src/style.json missing font config']};
 const fontFile=path.join(dir,'src/lib/fonts.ts');if(!fs.existsSync(fontFile))return {pass:false,issues:['src/lib/fonts.ts missing']};
 const text=fs.readFileSync(fontFile,'utf8'),tokenFile=path.join(dir,'src/lib/tokens.ts');const issues=[];
 for(const [label,name] of Object.entries({display:style.font.display,mono:style.font.mono})){
  if(!name)issues.push(`${label} font unset`);
  else if(!text.includes(`@remotion/google-fonts/${name.replace(/[^A-Za-z0-9]/g,'')}`)&&!text.includes(`@remotion/fonts`))issues.push(`${label} font ${name} not imported in fonts.ts`);
 }
 if(!fs.existsSync(tokenFile)||!fs.readFileSync(tokenFile,'utf8').includes("import './fonts'"))issues.push('tokens.ts does not import fonts.ts');
 const sizes=style.font.size||{};for(const [level,range] of Object.entries(sizes))if(!Array.isArray(range)||!range.every(x=>Number.isFinite(x)&&x>0))issues.push(`${level} font range invalid`);
 return {pass:!issues.length,issues,note:'Static import/weight check only; inspect rendered glyphs for missing fonts or fallback. A successful import does not prove every character loaded.'};
}
export function qaPixels(a){
 const file=path.resolve(a._?.[1]||a.file||'out/final.mp4'),p=probe(file),v=p.streams.find(s=>s.codec_type==='video');if(!v)die('qa pixels needs video');
 const duration=Number(p.format.duration),fps=Number(v.avg_frame_rate?.split('/')[0])/Number(v.avg_frame_rate?.split('/')[1]||1)||30;
 const dir=path.resolve(a.outDir||'out/qa-pixels');mkdirp(dir);
 const board=a.board?readJson(path.resolve(a.board)):null,frames=[],audio=p.streams.some(s=>s.codec_type==='audio');
 for(const [i,t] of times(duration,board,fps).entries()){
  const image=path.join(dir,`frame-${String(i+1).padStart(2,'0')}.png`);
  ff(['-ss',String(t),'-i',file,'-frames:v','1',image]);
  const snippet=audio?path.join(dir,`audio-${String(i+1).padStart(2,'0')}.wav`):null;
  if(snippet)ff(['-ss',String(Math.max(0,t-0.5)),'-i',file,'-vn','-t',String(Math.min(2,duration-Math.max(0,t-0.5))),'-ac','2','-ar','48000',snippet]);
  frames.push({at:t,image,snippet});
 }
 const script=path.join(path.dirname(fileURLToPath(import.meta.url)),'qa_pixels.py');
 const r=run('python3',[script,JSON.stringify({frames,width:v.width,height:v.height,dir})],{encoding:'utf8',maxBuffer:1<<23});if(r.status!==0)die('pixel review failed: '+(r.stderr||r.stdout||'').slice(-800));
 const metrics=JSON.parse(r.stdout);metrics.frames.forEach((f,i)=>f.audioSnippet=frames[i].snippet);const project=path.resolve(a.dir||'.');const fonts=fontAudit(project);
 if(!metrics.frames.every(x=>x.ocrAvailable))fonts.issues.push('OCR unavailable on at least one frame; text checks incomplete');
 fonts.pass=!fonts.issues.length;
 const report={source:file,sha256:hash(file),duration,width:v.width,height:v.height,frames:metrics.frames,contactSheet:metrics.contactSheet,fonts,audioSnippets:audio,pass:fonts.pass&&!metrics.frames.some(x=>x.warnings.length),note:'Heuristic OCR and edge analysis on sampled final pixels only. A pass is not a zero-overlap or perfect-crop claim. Inspect the contact sheet and each critical full-size frame; listen to the audio snippets, then watch the full video at phone size with audio. No sound playback occurs automatically.'};
 const manifest=path.join(dir,'review.json');writeJson(manifest,report);
 return {manifest,...report};
}
