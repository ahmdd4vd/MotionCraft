import {test} from 'node:test';
import assert from 'node:assert/strict';
import {geometry} from '../assets/template/src/lib/format.mjs';
import {cmdNew} from '../scripts/lib/commands.mjs';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('three true canvases and distinct social insets',()=>{
 const sq=geometry('1:1','ig-feed'),feed=geometry('4:5','ig-feed'),tt=geometry('9:16','tiktok'),reels=geometry('9:16','reels');
 assert.deepEqual([sq.width,sq.height],[1080,1080]);assert.deepEqual([feed.width,feed.height],[1080,1350]);assert.deepEqual([tt.width,tt.height],[1080,1920]);
 assert.ok(tt.safe.width<sq.safe.width);assert.ok(tt.safe.height<reels.safe.height);
 for(const g of [sq,feed,tt,reels]){assert.ok(g.safe.x>=0&&g.safe.y>=0);assert.ok(g.safe.width>0&&g.safe.height>0);assert.ok(g.safe.y+g.safe.height<=g.height);}
 assert.throws(()=>geometry('1:1','tiktok'),/requires 9:16/);assert.deepEqual([geometry('16:9').width,geometry('16:9').height],[1920,1080]);
});
test('new project sets the requested format and platform, retaining template compositions',()=>{
 const base=mkdtempSync(join(tmpdir(),'mc-formats-'));try{
  const dir=join(base,'project');cmdNew({_: [dir],format:'4:5',platform:'ig-feed',style:'pi-v2'});
  const config=JSON.parse(readFileSync(join(dir,'mc.config.json')));const style=JSON.parse(readFileSync(join(dir,'src/style.json')));
  assert.equal(config.format,'4:5');assert.equal(config.platform,'ig-feed');assert.equal(style.canvas.height,1350);
  assert.match(readFileSync(join(dir,'src/Root.tsx'),'utf8'),/calculateMetadata={meta}/);
 }finally{rmSync(base,{recursive:true,force:true});}
});
