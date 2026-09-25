import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {timelineEditor,retimeBoard,shiftBeatGrid,validateRenderBoard} from '../scripts/lib/timeline-editor.mjs';
const board={fps:30,duration:10,scenes:[
 {id:'one',start:0,end:4,fromFrame:0,toFrame:120,previewFrame:80,headline:'One',events:[{kind:'click',at:2}],animations:[{kind:'logo_reveal',frame:90}]},
 {id:'two',start:4,end:10,fromFrame:120,toFrame:300,previewFrame:220,headline:'Two'}]};
test('reorder, resize, and retime the attached event and preview frame',()=>{
 const b=retimeBoard(board,[{id:'two',duration:3},{id:'one',duration:5}]);
 assert.deepEqual(b.scenes.map(s=>s.id),['two','one']);assert.equal(b.duration,8);
 assert.deepEqual(b.scenes.map(s=>[s.fromFrame,s.toFrame]),[[0,90],[90,240]]);
 assert.equal(b.scenes[1].events[0].at,5.5);assert.equal(b.scenes[1].animations[0].frame,203);
 assert.ok(b.scenes.every(s=>s.previewFrame>=s.fromFrame&&s.previewFrame<s.toFrame));
});
test('reject missing scenes and invalid lengths',()=>{
 assert.throws(()=>retimeBoard(board,[{id:'one',duration:2}]),/every scene/);
 assert.throws(()=>retimeBoard(board,[{id:'one',duration:0},{id:'two',duration:3}]),/duration/);
});
test('beat shift trims outside the new duration',()=>{
 assert.deepEqual(shiftBeatGrid({beats:[0,1,4,9]},-.5,5).beats,[.5,3.5]);
});
test('local HTML editor embeds data safely and produces a file',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-edit-'));
 try {const input=path.join(dir,'board.json'),output=path.join(dir,'editor.html');fs.writeFileSync(input,JSON.stringify({...board,topic:'</script><script>alert(1)</script>'}));
 const result=timelineEditor({board:input,out:output});const html=fs.readFileSync(result.editor,'utf8');
 assert.match(html,/MotionCraft timeline editor/);assert.ok(!html.includes('</script><script>alert(1)'));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('timeline-aware render board requires contiguous safe scenes and a known role',()=>{
 const source={fps:30,duration:4,scenes:[{id:'a',role:'cta',fromFrame:0,toFrame:60},{id:'b',role:'problem',fromFrame:60,toFrame:120}]};
 assert.equal(validateRenderBoard(source,'launch').duration,4);
 assert.throws(()=>validateRenderBoard({...source,scenes:[source.scenes[0],{...source.scenes[1],fromFrame:62}]},'launch'),/noncontiguous/);
 assert.throws(()=>validateRenderBoard(source,'tutorial'),/noncontiguous/);
});
