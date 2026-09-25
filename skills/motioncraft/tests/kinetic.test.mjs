import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
test('all styles define safe character and number timings',()=>{
 for(const id of fs.readdirSync(new URL('../styles/',import.meta.url))){
  const t=JSON.parse(fs.readFileSync(new URL(`../styles/${id}/tokens.json`,import.meta.url)));
  assert.ok(t.motion.character.stagger>=1&&t.motion.character.stagger<=4,id);
  assert.ok(t.motion.number.duration>=12&&t.motion.number.duration<=90,id);
 }
});
