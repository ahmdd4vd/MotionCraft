import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {autoCues,moodOptions,mixReview,reviewHash} from '../scripts/lib/phase2.mjs';
import {storyboard} from '../scripts/lib/phase1.mjs';
import {ff} from '../scripts/lib/util.mjs';
import {spawnSync} from 'node:child_process';

test('explicit scene events stay on timeline, default cues are sparse and unknown cue is disclosed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-audio-'));
 try{
  const brief=path.join(dir,'brief.json'),board=path.join(dir,'board.json'),out=path.join(dir,'cues.json');
  fs.writeFileSync(brief,JSON.stringify({topic:'Demo',audience:'A',goal:'B',duration:15,scenes:[{role:'hook',headline:'A',events:[{kind:'typing',at:1},{kind:'click',at:1.6}]},{role:'proof',headline:'B',cue:'visual-note'},{role:'cta',headline:'C',events:[{kind:'logo_reveal',at:12.5},{kind:'cta',at:12.53}]}]}));
  storyboard({brief,out:board});let r=autoCues({board,out,maxPerMin:24});let c=JSON.parse(fs.readFileSync(out));
  assert.equal(r.unknown[0].kind,'visual-note');assert.ok(r.skipped>=1);assert.ok(c.cues.find(x=>x.type==='type'&&x.t===1));assert.ok(c.cues.find(x=>x.type==='logo_sting'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('mood choices map to real distinct presets',()=>{assert.equal(moodOptions({mood:'premium'}).options.length,2);});
test('mix review clips and hash-gated approval reject a changed mix',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-review-'));
 try{
  const file=path.join(dir,'mix.wav'),out=path.join(dir,'review');
  ff(['-f','lavfi','-i','sine=frequency=440:duration=4','-ar','48000','-ac','2',file]);
  let r=mixReview({file,out});assert.ok(r.clips.length>=2);assert.equal(JSON.parse(fs.readFileSync(r.manifest)).approvedAt,undefined);
  const cli=path.resolve('skills/motioncraft/scripts/motioncraft.mjs');
  let check=spawnSync('node',[cli,'render','--dir',dir,'--audio',file,'--review',r.manifest,'--skipRender'],{encoding:'utf8'});
  assert.match(check.stderr,/mix review missing or stale/);
  r=mixReview({file,out,approve:true});assert.equal(r.approved,true);
  check=spawnSync('node',[cli,'render','--dir',dir,'--audio',file,'--review',r.manifest,'--skipRender'],{encoding:'utf8'});
  assert.doesNotMatch(check.stderr,/mix review missing or stale/);assert.match(check.stderr,/ffprobe failed/);
  fs.appendFileSync(file,'changed');
  assert.notEqual(JSON.parse(fs.readFileSync(r.manifest)).sha256,reviewHash(file));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('phase 3 derives cues from scenes and animation timeline while honoring manual overrides',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-auto-'));
 try {
  const board=path.join(dir,'board.json'),timeline=path.join(dir,'timeline.json'),out=path.join(dir,'cues.json');
  fs.writeFileSync(board,JSON.stringify({duration:20,fps:30,scenes:[
   {id:'intro',start:0,end:5,headline:'Hello'},
   {id:'demo',start:5,end:13,headline:'Demo',animations:[{kind:'ui_click',at:7},{kind:'logo_reveal',frame:300}]},
   {id:'silent',start:13,end:20,headline:'Muted',events:[]}
  ]}));
  fs.writeFileSync(timeline,JSON.stringify({events:[{scene:'demo',kind:'check',t:9},{scene:'other',kind:'logo',t:10}]}));
  const r=autoCues({board,timeline,out,maxPerMin:120});const cues=JSON.parse(fs.readFileSync(out)).cues;
  assert.equal(r.unknown.length,0);
  assert.ok(cues.some(c=>c.type==='type'&&c.scene==='intro'));
  assert.ok(cues.some(c=>c.type==='whoosh_in'&&c.scene==='demo'));
  assert.ok(cues.some(c=>c.type==='button'&&c.t===7));
  assert.ok(cues.some(c=>c.type==='logo_sting'&&c.scene==='demo'));
  assert.ok(cues.some(c=>c.type==='check'&&c.scene==='demo'));
  assert.ok(!cues.some(c=>c.scene==='silent'));
  assert.ok(!cues.some(c=>c.kind==='logo'&&c.t===10));
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
