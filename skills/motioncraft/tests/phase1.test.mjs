import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {storyboard} from '../scripts/lib/phase1.mjs';

test('storyboard fills the exact duration with contiguous frame windows', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-board-'));
  const brief=path.join(dir,'brief.json'), out=path.join(dir,'board.json');
  fs.writeFileSync(brief,JSON.stringify({topic:'Intro',audience:'pemula',goal:'explain',duration:61}));
  const result=storyboard({brief,out}); const board=JSON.parse(fs.readFileSync(result.storyboard));
  assert.equal(board.scenes.length,8); assert.equal(result.needsCopy,8);
  assert.equal(board.scenes[0].fromFrame,0); assert.equal(board.scenes.at(-1).toFrame,1830);
  board.scenes.forEach((s,i)=>{assert.ok(s.toFrame>s.fromFrame); assert.ok(s.previewFrame>=s.fromFrame&&s.previewFrame<s.toFrame); if(i)assert.equal(s.fromFrame,board.scenes[i-1].toFrame);});
  assert.match(fs.readFileSync(result.review,'utf8'),/TODO: write and approve/);
  fs.rmSync(dir,{recursive:true,force:true});
});
test('user-supplied scene roles and copy are preserved without invented facts', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-board-'));
  const brief=path.join(dir,'brief.json'), out=path.join(dir,'board.json');
  fs.writeFileSync(brief,JSON.stringify({topic:'A',audience:'B',goal:'C',duration:24,scenes:[{role:'hook',headline:'One line',visual:'real prompt'},{role:'proof',headline:'Actual demo',proof:'source'},{role:'cta',headline:'Try it'}]}));
  storyboard({brief,out}); const board=JSON.parse(fs.readFileSync(out));
  assert.deepEqual(board.scenes.map(s=>s.headline),['One line','Actual demo','Try it']);
  assert.equal(board.scenes[1].proof,'source'); assert.equal(board.scenes.at(-1).toFrame,720);
  fs.rmSync(dir,{recursive:true,force:true});
});
