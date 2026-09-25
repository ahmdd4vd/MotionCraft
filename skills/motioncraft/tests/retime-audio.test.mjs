import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {audioPlan,tempoFilters,retimeAudio} from '../scripts/lib/retime-audio.mjs';
import {run,probe} from '../scripts/lib/util.mjs';
const base={fps:30,duration:4,scenes:[{id:'a',fromFrame:0,toFrame:60},{id:'b',fromFrame:60,toFrame:120}]};
const edited={fps:30,duration:5,scenes:[{id:'b',fromFrame:0,toFrame:90},{id:'a',fromFrame:90,toFrame:150}]};
test('scene mapping supports reorder and stretch and refuses invalid boards',()=>{
 const p=audioPlan(base,edited);assert.deepEqual(p.segments.map(s=>[s.id,s.start,s.duration]),[['b',2,3],['a',0,2]]);
 assert.throws(()=>audioPlan(base,{...edited,scenes:[edited.scenes[0]]}),/each unique scene/);
 assert.match(tempoFilters(8),/atempo=0.5,atempo=0.5/);
});
test('actual audio reorder/stretch and beat offset gives exact duration',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-audio-'));
 try{
  const old=path.join(dir,'old.json'),next=path.join(dir,'edited.json'),grid=path.join(dir,'grid.json'),wav=path.join(dir,'input.wav');
  for(const [p,x] of [[old,base],[next,edited],[grid,{beatOffset:0.5}]])fs.writeFileSync(p,JSON.stringify(x));
  const r=run('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','sine=frequency=440:duration=2','-f','lavfi','-i','sine=frequency=880:duration=2','-filter_complex','[0:a][1:a]concat=n=2:v=0:a=1[a]','-map','[a]','-y',wav]);assert.equal(r.status,0,r.stderr);
  const out=retimeAudio({original:old,edited:next,grid,music:wav,vo:wav,outDir:path.join(dir,'out')});
  for(const file of Object.values(out.files))assert.ok(Math.abs(Number(probe(file).format.duration)-5)<0.02);
  assert.equal(out.beatOffset,.5);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
