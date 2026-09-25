import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {qaPixels,fontAudit} from '../scripts/lib/qa-pixels.mjs';
import {ff} from '../scripts/lib/util.mjs';

test('font audit catches unimported configured family',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-font-'));
 try{fs.mkdirSync(path.join(dir,'src/lib'),{recursive:true});fs.writeFileSync(path.join(dir,'src/style.json'),JSON.stringify({font:{display:'Figtree',mono:'JetBrains Mono',size:{h1:[64,76]}}}));
 fs.writeFileSync(path.join(dir,'src/lib/fonts.ts'),"import '@remotion/google-fonts/Figtree'");fs.writeFileSync(path.join(dir,'src/lib/tokens.ts'),"import './fonts'");
 assert.equal(fontAudit(dir).pass,false);assert.match(fontAudit(dir).issues.join(' '),/mono font/);
 fs.appendFileSync(path.join(dir,'src/lib/fonts.ts'),"\nimport '@remotion/google-fonts/JetBrainsMono'");assert.equal(fontAudit(dir).pass,true);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('pixels scans real vertical frames, writes contact sheet and frame evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-pixels-'));
 try{fs.mkdirSync(path.join(dir,'src/lib'),{recursive:true});fs.writeFileSync(path.join(dir,'src/style.json'),JSON.stringify({font:{display:'Figtree',mono:'JetBrains Mono',size:{h1:[64,76]}}}));
 fs.writeFileSync(path.join(dir,'src/lib/fonts.ts'),"import '@remotion/google-fonts/Figtree';import '@remotion/google-fonts/JetBrainsMono'");fs.writeFileSync(path.join(dir,'src/lib/tokens.ts'),"import './fonts'");
 const file=path.join(dir,'vertical.mp4'),outDir=path.join(dir,'review');
 ff(['-f','lavfi','-i','color=c=white:s=360x640:r=4:d=2','-vf','drawtext=text=HELLO:fontsize=48:fontcolor=black:x=60:y=90,drawtext=text=TINY:fontsize=7:fontcolor=black:x=320:y=590','-c:v','libx264','-pix_fmt','yuv420p',file]);
 const r=qaPixels({file,dir,outDir,_:['pixels',file]});assert.equal(r.height,640);assert.ok(r.frames.length>=2);assert.ok(fs.existsSync(r.contactSheet));assert.ok(fs.existsSync(r.manifest));assert.ok(r.frames.some(f=>f.ocrWords>=1));assert.equal(r.audioSnippets,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
