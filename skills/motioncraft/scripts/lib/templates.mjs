import path from 'node:path';
import fs from 'node:fs';
import {readJson,writeJson,die} from './util.mjs';
const launch={id:'ProductLaunch',duration:45,min:30,max:60,required:['product','problem','feature1','feature2','cta','handle','demoDir','demoCount','demoCredit'],asset:'demo'};
const tutorial={id:'ScreenTutorial',duration:60,min:30,max:90,required:['title','handle','captureDir','captureCount','sourceCredit','steps'],asset:'capture'};
export function templatePlan(a){
 const kind=a._[0],model=kind==='launch'?launch:kind==='tutorial'?tutorial:null;if(!model)die('usage: template launch|tutorial --spec props.json --dir project');
 if(a._[1]==='fields')return model;
 const file=path.resolve(a.spec||`${kind}-props.json`),p=readJson(file);if(!p||typeof p!=='object')die(`read ${file} first`);
 const issues=model.required.filter(k=>p[k]===undefined||p[k]===null||p[k]==='').map(k=>`missing ${k}`);
 const duration=Number(a.duration??p.duration??model.duration);
 if(!Number.isFinite(duration)||duration<model.min||duration>model.max)issues.push(`duration must be ${model.min}-${model.max}s`);
 const dir=path.resolve(a.dir||'.');let data=null;
 if(model===tutorial){if(!Array.isArray(p.steps)||!p.steps.length)issues.push('steps required');else{
  let end=0;for(const [i,s] of p.steps.entries()){
   if(typeof s.title!=='string'||!s.title.trim()||typeof s.caption!=='string'||!s.caption.trim())issues.push(`step ${i+1} needs title and caption`);
   if(!Number.isFinite(s.from)||!Number.isFinite(s.to)||Math.abs(s.from-end)>0.001||s.to<=s.from||s.to>duration)issues.push(`step ${i+1} has invalid time; expected start ${end}`);
   if(!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x<.12||s.x>.88||s.y<.12||s.y>.85)issues.push(`step ${i+1} pointer must be within safe fractional x/y bounds`);
   if(s.zoom!=null&&(s.zoom<1||s.zoom>1.6))issues.push(`step ${i+1} zoom must be 1-1.6`);end=s.to;
  }if(Math.abs(end-duration)>.001)issues.push(`steps must finish at duration ${duration}s`);
 }}
 if(p.audio){const audio=path.resolve(dir,'public',p.audio);if(!audio.startsWith(path.resolve(dir,'public')+path.sep)||!fs.existsSync(audio))issues.push('audio missing or outside public');}
 const name=model===launch?p.demoDir:p.captureDir,count=model===launch?p.demoCount:p.captureCount;
 if(name){const folder=path.resolve(dir,'public',name);if(!folder.startsWith(path.resolve(dir,'public')+path.sep))issues.push('frames path outside project public folder');
 else if(!Number.isInteger(count)||count<1)issues.push('frame count needs a positive integer');
 else if(!fs.existsSync(folder))issues.push(`frame folder missing: ${folder}`);
 else for(let i=1;i<=count;i++)if(!fs.existsSync(path.join(folder,`${String(i).padStart(3,'0')}.jpg`))) {issues.push(`frame ${i} missing`);break;}
 }
 if(model===tutorial&&(!Number.isFinite(Number(p.captureFps??30))||Number(p.captureFps??30)<=0||Number(p.captureFps??30)>120))issues.push('captureFps must be 1-120');
 if(model===tutorial&&Number.isFinite(duration)&&Number.isInteger(count)&&count<Math.ceil(duration*(Number(p.captureFps)||30)))issues.push('captureCount too short for duration * captureFps');
 if(model===launch&&Number.isFinite(duration)&&Number.isInteger(count)&&count<Math.ceil(18*30))issues.push('demoCount too short for 18s demonstration at 30 fps');
 if(a.out&&issues.length===0){const dest=path.resolve(a.out);writeJson(dest,{...p,duration});data=dest;}
 return {template:model.id,duration,pass:issues.length===0,issues,props:data,note:'This checks fields and numbered JPGs only. It does not verify capture authenticity, source rights, readable UI, captions, visual motion, or factual claims. Preview final frames and listen to audio.'};
}
