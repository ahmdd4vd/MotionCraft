import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {templatePlan} from '../scripts/lib/templates.mjs';

const setup=(kind)=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-template-'));fs.mkdirSync(path.join(dir,'public/frames'),{recursive:true});return dir;};
test('launch validates required proof and real numbered demo frames',()=>{
 const dir=setup();try{
 const p={product:'P',problem:'X',feature1:'A',feature2:'B',cta:'Try',handle:'@me',demoDir:'frames',demoCount:540,demoCredit:'My capture'},spec=path.join(dir,'props.json');
 fs.writeFileSync(spec,JSON.stringify(p));let r=templatePlan({_:['launch'],spec,dir});assert.equal(r.pass,false);assert.match(r.issues.join(' '),/frame 1 missing/);
 for(let i=1;i<=540;i++)fs.writeFileSync(path.join(dir,'public/frames',`${String(i).padStart(3,'0')}.jpg`),'x');r=templatePlan({_:['launch'],spec,dir,out:path.join(dir,'checked.json')});assert.equal(r.pass,true);assert.ok(fs.existsSync(r.props));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('tutorial rejects an unsafe pointer, gaps and short recording',()=>{
 const dir=setup();try{
 const p={title:'Tutorial',handle:'@me',captureDir:'frames',captureCount:1,sourceCredit:'My capture',steps:[{title:'First',caption:'A',from:0,to:20,x:.99,y:.3},{title:'Second',caption:'B',from:21,to:60,x:.5,y:.5}]};const spec=path.join(dir,'props.json');fs.writeFileSync(spec,JSON.stringify(p));
 const r=templatePlan({_:['tutorial'],spec,dir});assert.equal(r.pass,false);assert.match(r.issues.join(' '),/pointer/);assert.match(r.issues.join(' '),/expected start 20/);assert.match(r.issues.join(' '),/too short/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
