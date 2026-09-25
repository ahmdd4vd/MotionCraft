import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {readJson,writeJson,die,mkdirp,ff,probe} from './util.mjs';
import {PRESETS} from './music.mjs';
import {SFX_TYPES} from './sfx.mjs';

const MAP={typing:'type',type:'type',keypress:'type',click:'button',button:'button',transition:'whoosh_in',enter:'whoosh_in',exit:'whoosh_out',logo:'logo_sting',logo_reveal:'logo_sting',cta:'icon_pop',reveal:'icon_pop',check:'check'};
const LOUD=new Set(['logo_sting','impact','whoosh_in','whoosh_out']);
const fallback={hook:[{type:'type',offset:0.45}],reframe:[{type:'whoosh_in',offset:0.05}],proof:[],how:[],cta:[{type:'icon_pop',offset:0.15}],end:[]};
const clean=x=>String(x??'').trim();
const seconds=(s,k)=>{const n=Number(s);if(!Number.isFinite(n)||n<0)die(`${k} needs non-negative seconds`);return n;};
export function autoCues(a){
 const board=readJson(path.resolve(a.board||'storyboard.json'));
 if(!board||!Array.isArray(board.scenes)||!board.scenes.length)die('board missing scenes; pass --board storyboard.json');
 const dur=seconds(board.duration,'duration');if(!dur)die('board duration must be positive');
 const fps=Number(board.fps)||30, raw=[]; let unknown=[];
 for(const [i,scene] of board.scenes.entries()){
  const start=seconds(scene.start,`scene ${i+1} start`), end=seconds(scene.end,`scene ${i+1} end`);
  if(end<=start||end>dur+0.001)die(`scene ${i+1} has invalid range`);
  const cue=clean(scene.cue).toLowerCase();
  const events=scene.events??(MAP[cue]||SFX_TYPES.includes(cue)?[{kind:cue,at:start+0.12}]:fallback[scene.role]?.map(e=>({kind:e.type,at:start+e.offset}))||[]);
  if(cue && !MAP[cue] && !SFX_TYPES.includes(cue) && !scene.events)unknown.push({scene:scene.id||i+1,kind:cue,note:'cue is not a known event; role fallback applied'});
  if(!Array.isArray(events))die(`scene ${i+1} events must be an array`);
  for(const event of events){
   const kind=clean(event.kind||event.type).toLowerCase(), type=MAP[kind]||(SFX_TYPES.includes(kind)?kind:null);
   if(!type){unknown.push({scene:scene.id||i+1,kind});continue;}
   const at=seconds(event.at??event.t??start,`event ${kind}`);
   if(at<start-0.001||at>=end||at>=dur)die(`event ${kind} at ${at}s falls outside scene ${scene.id||i+1}`);
   // Sound 1 frame ahead of an on-screen landing. Tiny type/click sounds keep their precise timing.
   const t=Math.max(0,at-((type==='type'||type==='button')?0:1/fps));
   raw.push({type,t:+t.toFixed(3),snap:false,scene:scene.id||String(i+1),kind});
  }
 }
 raw.sort((x,y)=>x.t-y.t);
 const minGap=seconds(a.minGap??0.12,'minGap'),maxPerMin=Number(a.maxPerMin??24);if(!Number.isFinite(maxPerMin)||maxPerMin<1||maxPerMin>240)die('maxPerMin must be 1-240');
 const max=Math.max(1,Math.floor(maxPerMin*dur/60)),cues=[];
 // Prefer a reveal or section transition over micro-clicks when the density cap binds.
 const priority={logo_sting:4,impact:4,whoosh_in:3,whoosh_out:3,icon_pop:2,button:1,type:0};
 raw.sort((x,y)=>(priority[y.type]??1)-(priority[x.type]??1)||x.t-y.t);
 for(const c of raw){ if(cues.length>=max)break; if(cues.some(x=>Math.abs(x.t-c.t)<minGap))continue;
  if(LOUD.has(c.type)&&cues.some(x=>LOUD.has(x.type)&&Math.abs(x.t-c.t)<0.55))continue;
  cues.push(c); }
 cues.sort((x,y)=>x.t-y.t);
 const out=path.resolve(a.out||'audio/auto-cues.json');writeJson(out,{duration:dur,fps,cues});
 return {file:out,cues:cues.length,skipped:raw.length-cues.length,unknown,perMinute:+(cues.length/dur*60).toFixed(1),note:'Review cue list against visual events. It is deliberately sparse; silence is valid. Explicit scene.events override role defaults.'};
}
export function moodOptions(a){
 const moods={calm:['cinematic-soft','dreamy'],warm:['warm-major','calm-punch'],focused:['lofi-desk','dark-minimal'],bright:['tech-bright','warm-major'],premium:['cinematic-soft','dark-minimal']};
 const name=clean(a.mood).toLowerCase();if(!moods[name])die(`choose --mood ${Object.keys(moods).join('|')}`);
 const options=moods[name].map(id=>({preset:id,bpm:PRESETS[id].bpm,key:PRESETS[id].key,lead:PRESETS[id].lead,progression:PRESETS[id].progression}));
 return {mood:name,options,note:'Options are existing instrumental presets, not a forced selection. Audition them and choose a different vibe from the last video; music make still enforces its variety guard.'};
}
export function reviewHash(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
export function mixReview(a){
 const file=path.resolve(a.file||'audio/final.wav');if(!fs.existsSync(file))die(`mix missing: ${file}`);
 const p=probe(file),dur=Number(p.format.duration);if(!Number.isFinite(dur)||dur<=0)die('invalid mix duration');
 const out=path.resolve(a.out||'out/mix-review');mkdirp(out);
 const manifest=path.join(out,'review.json');
 if(a.approve){const previous=readJson(manifest);if(!previous||previous.source!==file||previous.sha256!==reviewHash(file))die('mix changed or no matching review clips; rerun mix review');
  previous.approvedAt=new Date().toISOString();writeJson(manifest,previous);return {manifest,approved:true,note:'Review gate recorded. Approval states the operator listened to the full mix and clips.'};}
 const positions=a.cues?readJson(path.resolve(a.cues))?.cues||[]:[];
 const markers=[0,...positions.map(c=>Number(c.t)).filter(t=>Number.isFinite(t)&&t>=0&&t<dur),Math.max(0,dur-3)];
 const selected=[...new Set(markers.map(x=>+x.toFixed(2)))].sort((x,y)=>x-y).filter((t,i,all)=>i===0||t-all[i-1]>=0.5);
 const clips=[];for(const [i,t] of selected.entries()){
  const start=Math.max(0,t-0.45),length=Math.min(2.8,dur-start),dest=path.join(out,`cue-${String(i+1).padStart(2,'0')}.wav`);
  ff(['-ss',String(start),'-i',file,'-t',String(length),'-ac','2','-ar','48000','-c:a','pcm_s16le',dest]);clips.push({at:t,start:+start.toFixed(2),file:dest}); }
 writeJson(manifest,{source:file,sha256:reviewHash(file),duration:dur,clips});
 return {manifest,clips,note:'Listen to the full mix AND cue clips before export; this command does not judge taste, masking or clipping. Run qa audio after listening.'};
}
