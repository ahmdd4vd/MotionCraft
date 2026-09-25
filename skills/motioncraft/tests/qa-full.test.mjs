import assert from 'node:assert/strict';import {test} from 'node:test';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {qaFull} from '../scripts/lib/qa-full.mjs';import {run} from '../scripts/lib/util.mjs';
test('scans all frames of rendered video with timestamps and small-text flags',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-qa-full-'));
 try{
  const video=path.join(dir,'real.mp4');const r=run('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=white:s=640x360:r=5:d=1','-vf','drawtext=text=HELLO:fontsize=12:fontcolor=black:x=5:y=5','-frames:v','5','-y',video]);assert.equal(r.status,0,r.stderr);
  const q=qaFull({_:['full',video],outDir:path.join(dir,'report')});assert.equal(q.framesScanned,5);assert.ok(q.issues.length>0);assert.equal(q.issues[0].at,0);assert.ok(fs.existsSync(q.manifest));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
