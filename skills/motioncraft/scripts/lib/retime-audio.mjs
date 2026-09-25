import fs from 'node:fs';
import path from 'node:path';
import {ff,probe,readJson,mkdirp} from './util.mjs';

export function audioPlan(original,edited) {
 const fps=original?.fps;
 if(!Number.isInteger(fps)||fps<1||edited?.fps!==fps||!Array.isArray(original.scenes)||!original.scenes.length||!Array.isArray(edited.scenes))throw Error('Original and edited boards need matching fps and scenes');
 const ids=new Map(original.scenes.map(s=>[s.id,s]));
 if(ids.size!==original.scenes.length||edited.scenes.length!==ids.size||new Set(edited.scenes.map(s=>s.id)).size!==ids.size)throw Error('Both boards must contain each unique scene exactly once');
 let sourceEnd=0,targetEnd=0;
 const segments=edited.scenes.map(s=>{
  const o=ids.get(s.id);
  if(!o||!Number.isInteger(o.fromFrame)||!Number.isInteger(o.toFrame)||o.toFrame<=o.fromFrame||!Number.isInteger(s.fromFrame)||!Number.isInteger(s.toFrame)||s.fromFrame!==targetEnd||s.toFrame<=s.fromFrame)throw Error(`Invalid source or edited scene ${s.id}`);
  targetEnd=s.toFrame;
  return {id:s.id,start:o.fromFrame/fps,end:o.toFrame/fps,duration:(s.toFrame-s.fromFrame)/fps,ratio:(s.toFrame-s.fromFrame)/(o.toFrame-o.fromFrame)};
 });
 for(const s of original.scenes){if(s.fromFrame!==sourceEnd)throw Error('Original scenes must be contiguous');sourceEnd=s.toFrame;}
 if(Math.abs(edited.duration*fps-targetEnd)>.01||Math.abs(original.duration*fps-sourceEnd)>.01)throw Error('Board duration does not match scene frames');
 return {segments,duration:targetEnd/fps,sourceDuration:sourceEnd/fps};
}
// atempo takes speed, inverse of scene length ratio. Chain when outside ffmpeg's portable [0.5,2] range.
export function tempoFilters(ratio){if(!Number.isFinite(ratio)||ratio<=0)throw Error('Invalid stretch ratio');let speed=1/ratio,filters=[];
 if(!Number.isFinite(speed)||speed<=0)throw Error('Invalid stretch ratio');
 while(speed>2){filters.push('atempo=2');speed/=2;}
 while(speed<.5){filters.push('atempo=0.5');speed*=2;}
 filters.push(`atempo=${speed.toFixed(8)}`);return filters.join(',');
}
export function retimeAudio(a) {
 if(!a.original||!a.edited||(!a.music&&!a.vo))throw Error('usage: timeline audio --original storyboard.json --edited storyboard.edited.json --music music.wav [--vo vo.wav] [--grid beatgrid.edited.json] --outDir audio/retimed');
 const original=readJson(path.resolve(a.original)),edited=readJson(path.resolve(a.edited)),plan=audioPlan(original,edited);
 const grid=a.grid?readJson(path.resolve(a.grid)):null;
 const offset=Number(grid?.beatOffset??edited.beatOffset??0);
 if(!Number.isFinite(offset)||Math.abs(offset)>60)throw Error('Invalid beat offset');
 const dest=path.resolve(a.outDir||'audio/retimed');mkdirp(dest);
 const outputs={};
 for(const type of ['music','vo'])if(a[type]){
  const input=path.resolve(a[type]);if(!fs.existsSync(input))throw Error(`Missing ${type}: ${input}`);
  const info=probe(input),length=Number(info.format.duration);
  if(!info.streams.some(s=>s.codec_type==='audio')||length+0.02<plan.sourceDuration)throw Error(`${type} must contain audio through the original board duration (${plan.sourceDuration}s)`);
  // atrim/reset timestamps, stretch each scene, then force exact output sample counts
  // so an imperfect tempo filter cannot drift between scenes or from the video.
  const chains=plan.segments.map((s,i)=>`[0:a]atrim=start=${s.start}:end=${s.end},asetpts=PTS-STARTPTS,aresample=48000,${tempoFilters(s.ratio)},apad,atrim=duration=${s.duration},asetpts=PTS-STARTPTS[a${i}]`);
  const n=plan.segments.length;let graph=`${chains.join(';')};${plan.segments.map((_,i)=>`[a${i}]`).join('')}concat=n=${n}:v=0:a=1`;
  if(type==='music'&&offset){graph+=`,${offset>0?`adelay=${Math.round(offset*1000)}:all=1`:`atrim=start=${-offset},asetpts=PTS-STARTPTS`},apad,atrim=duration=${plan.duration}`;}
  graph+=',aresample=48000[out]';
  const output=path.join(dest,`${type}.wav`);ff(['-i',input,'-filter_complex',graph,'-map','[out]','-c:a','pcm_s24le',output]);outputs[type]=output;
 }
 return {files:outputs,duration:plan.duration,beatOffset:offset,segments:plan.segments,note:'Scene audio is reordered and tempo-stretched to edited timing. Music additionally follows beat offset. Listen to cuts and stretched voice; re-mix, approve a new mix review, then render with --audio. This does not change the original media files.'};
}
