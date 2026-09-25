import fs from 'node:fs';
import path from 'node:path';
import {readJson,die,writeJson} from './util.mjs';

// The exported board is an edit decision, not a mutation of a Remotion composition.
export function retimeBoard(board, edits) {
 const fps=Number(board?.fps), scenes=board?.scenes;
 if(!Number.isInteger(fps)||fps<1||!Array.isArray(scenes)||!scenes.length)throw Error('board needs fps and scenes');
 const byId=new Map(scenes.map(s=>[s.id,s]));
 if(byId.size!==scenes.length||scenes.some(s=>!s.id))throw Error('scene IDs must be unique');
 if(edits.length!==scenes.length||new Set(edits.map(e=>e.id)).size!==scenes.length||edits.some(e=>!byId.has(e.id)))throw Error('edits must include every scene exactly once');
 let frame=0;
 const next=edits.map(e=>{
  const original=byId.get(e.id), duration=Number(e.duration), frames=Math.round(duration*fps);
  if(!Number.isFinite(duration)||duration<0.8||!Number.isSafeInteger(frames))throw Error(`invalid duration for ${e.id}`);
  const oldStart=Number(original.start),oldEnd=Number(original.end),oldLength=oldEnd-oldStart;
  if(!Number.isFinite(oldLength)||oldLength<=0)throw Error(`invalid original scene ${e.id}`);
  const shift=t=>+(frame/fps+(Number(t)-oldStart)*frames/fps/oldLength).toFixed(3);
  const shiftEvent=event=>{
   const out={...event};
   for(const k of ['at','t'])if(event[k]!=null)out[k]=shift(event[k]);
   if(event.frame!=null)out.frame=Math.round(shift(Number(event.frame)/fps)*fps);
   return out;
  };
  const oldPreview=Number(original.previewFrame), ratio=Number.isFinite(oldPreview)?(oldPreview-Number(original.fromFrame))/(Number(original.toFrame)-Number(original.fromFrame)):0.7;
  const s={...original,fromFrame:frame,toFrame:frame+frames,start:+(frame/fps).toFixed(3),end:+((frame+frames)/fps).toFixed(3),previewFrame:frame+Math.min(frames-1,Math.max(0,Math.round(ratio*frames)))};
  if(Array.isArray(s.events))s.events=s.events.map(shiftEvent);
  if(Array.isArray(s.animations))s.animations=s.animations.map(shiftEvent);
  frame+=frames; return s;
 });
 return {...board,duration:+(frame/fps).toFixed(3),scenes:next};
}
export function shiftBeatGrid(grid, offset, duration) {
 const n=Number(offset);if(!Number.isFinite(n)||Math.abs(n)>60)throw Error('beat offset must be between -60 and 60 seconds');
 const shift=a=>a.map(t=>+(Number(t)+n).toFixed(3)).filter(t=>Number.isFinite(t)&&t>=0&&t<duration);
 return {...grid,duration,beatOffset:n,beats:shift(grid.beats||[]),sections:Array.isArray(grid.sections)?grid.sections.map(s=>typeof s==='number'?+(s+n).toFixed(3):{...s,t:s.t==null?s.t:+(Number(s.t)+n).toFixed(3)}):grid.sections};
}
export function timelineEditor(a){
 const source=path.resolve(a.board||'storyboard.json'),board=readJson(source);
 if(!board?.scenes?.length)die(`cannot read storyboard scenes: ${source}`);
 const grid=a.grid?readJson(path.resolve(a.grid)):null;
 if(a.grid && !grid)die(`cannot read beat grid: ${a.grid}`);
 try{retimeBoard(board,board.scenes.map(s=>({id:s.id,duration:s.end-s.start})));}catch(e){die(e.message);}
 const data=JSON.stringify({board,grid}).replace(/</g,'\\u003c');
 const script=fs.readFileSync(new URL('../assets/timeline-editor.js',import.meta.url),'utf8');
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MotionCraft timeline editor</title><style>
 :root{font-family:system-ui,sans-serif;color:#e8edf7;background:#111827}body{max-width:900px;margin:35px auto;padding:0 20px}h1{font-size:28px}p{color:#aab8ce;line-height:1.5}.row{display:flex;align-items:center;gap:14px;background:#243247;border:1px solid #465a76;padding:14px;margin:8px 0;border-radius:10px}.row.dragging{opacity:.45}.handle{cursor:grab;font-size:25px}.name{flex:1}.name small{display:block;color:#aab8ce}input{width:72px;padding:7px;background:#111827;color:white;border:1px solid #789;border-radius:5px}button{padding:10px 14px;margin:8px 8px 8px 0;background:#72bcf5;color:#102033;border:0;border-radius:6px;font-weight:700;cursor:pointer}button:focus,input:focus{outline:2px solid #ffa86c}#error{color:#ffaaa0}code{color:#b3dafa}</style>
 <h1>MotionCraft timeline editor</h1><p>Drag scenes to reorder. Change each duration in seconds. Shift the beat grid by a signed offset. Export both files, then review the updated storyboard against your Remotion composition before rendering. Main, MainVertical, ProductLaunch, ScreenTutorial, TimelineLaunch and TimelineTutorial render this exported timing plan without code edits.</p>
 <main id="list"></main><label>Beat offset (seconds) <input id="beat" type="number" step="0.01" value="0"></label><p id="summary"></p><p id="error" role="alert"></p><button id="export">Export storyboard and beat grid</button>
 <p>Render with <code>--comp Main|ProductLaunch|ScreenTutorial|TimelineLaunch|TimelineTutorial --timeline storyboard.edited.json --grid beatgrid.edited.json</code>. Run timeline audio with original and edited boards; re-mix and review audio and footage.</p><script type="application/json" id="data">${data}</script><script>${script.replace(/<\/script/gi,'<\\/script')}</script></html>`;
 const dest=path.resolve(a.out||'timeline-editor.html');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);
 return {editor:dest,scenes:board.scenes.length,note:'Open the HTML locally in a browser. Export JSON and render the matching composition with --timeline. Run timeline audio for scene-synced media and review cuts; other footage needs independent sync review.'};
}

const presets={
 main:[['hook',3.4],['reframe',4.2],['proof',4.4],['formula',3.2],['cta',2.4],['end',2.4]],
 'product-launch':[['problem',8],['demo',19],['features',12],['cta',6]],
 'screen-tutorial':[['step',20],['step',20],['step',20]],
 launch:[['problem',8],['demo',19],['features',12],['cta',6]],
 tutorial:[['intro',5],['step',10],['step',10],['outro',5]]
};
export function timelineInit(a){
 const kind=String(a._[1]||a.kind||'');if(!presets[kind])die('timeline init needs main|product-launch|screen-tutorial|launch|tutorial');
 const fps=30;let frame=0;const scenes=presets[kind].map(([role,seconds],i)=>{const begin=frame;frame+=seconds*fps;return {id:(kind==='tutorial'||kind==='screen-tutorial')&&role==='step'?`step-${i}`:role,role,headline:({problem:'A real problem',demo:'Product in action',features:'What changes',cta:'Try it',intro:'A clear tutorial',step:`Step ${i}`,outro:'Review',hook:'Make videos like this',reframe:'References',proof:'Give feedback until it fits',formula:'The formula',end:'Follow for more'})[role],fromFrame:begin,toFrame:frame,start:begin/fps,end:frame/fps,previewFrame:begin+Math.floor(seconds*fps*.7),sourceFromFrame:begin,sourceToFrame:frame}});
 const file=path.resolve(a.out||`timeline-${kind}.json`);writeJson(file,{version:1,kind,fps,duration:frame/fps,scenes});return {board:file,kind,scenes:scenes.length};
}
export function validateRenderBoard(board,kind){
 if(!['launch','tutorial','main','product-launch','screen-tutorial'].includes(kind))throw Error('unsupported timeline composition');
 const allowed=kind==='launch'||kind==='product-launch'?new Set(['problem','demo','features','cta']):kind==='main'?new Set(['hook','reframe','proof','formula','cta','end']):new Set(['intro','step','outro']);
 if(!board||board.fps!==30||!Array.isArray(board.scenes)||board.scenes.length<2||board.scenes.length>12)throw Error('timeline needs 30 fps and 2-12 scenes');
 let end=0;const ids=new Set();for(const s of board.scenes){if(!s.id||ids.has(s.id)||!allowed.has(s.role)||s.fromFrame!==end||!Number.isInteger(s.toFrame)||s.toFrame-s.fromFrame<24 || (['main','product-launch','screen-tutorial'].includes(kind)&&(!Number.isInteger(s.sourceFromFrame)||!Number.isInteger(s.sourceToFrame)||s.sourceToFrame<=s.sourceFromFrame||s.sourceFromFrame<0||s.sourceToFrame>(kind==='main'?600:kind==='product-launch'?1350:1800))))throw Error(`invalid or noncontiguous timeline scene ${s.id||''}`);ids.add(s.id);end=s.toFrame;}
 if(['main','product-launch','screen-tutorial'].includes(kind)){const sources=[...board.scenes].sort((a,b)=>a.sourceFromFrame-b.sourceFromFrame);let pos=0;for(const scene of sources){if(scene.sourceFromFrame!==pos)throw Error('legacy source scenes must cover original composition once, with no gaps or overlaps');pos=scene.sourceToFrame;}if(pos!==(kind==='main'?600:kind==='product-launch'?1350:1800))throw Error('legacy source scenes must cover the original composition duration');}
 if(Math.abs(board.duration*30-end)>.01)throw Error('timeline duration differs from scene frames');return board;
}
