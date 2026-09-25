import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
test('morph is style-controlled with modest overlay strength',()=>{
 for(const id of fs.readdirSync(new URL('../styles/',import.meta.url))){
  const t=JSON.parse(fs.readFileSync(new URL(`../styles/${id}/tokens.json`,import.meta.url)));
  assert.ok(t.motion.morph.frames>=12&&t.motion.morph.frames<=30,id);
  assert.ok(t.motion.morph.opacity<=0.7,id);
 }
 const src=fs.readFileSync(new URL('../assets/template/src/components/MorphTransition.tsx',import.meta.url),'utf8');
 assert.match(src,/a\.points\.length!==b\.points\.length/);
 assert.match(src,/<polygon points=/);
});
