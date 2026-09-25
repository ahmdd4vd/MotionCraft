import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {run, die, readJson, writeJson, mkdirp, workDir, ff} from './util.mjs';

const ROLES = ['hook', 'reframe', 'proof', 'proof', 'how', 'how', 'cta', 'end'];
const WEIGHTS = [0.09, 0.12, 0.19, 0.13, 0.15, 0.14, 0.10, 0.08];
const VISUAL = {
  hook: 'one plain-language headline and one visual focal point',
  reframe: 'show the old problem, then the new approach',
  proof: 'real footage, credited example, or a verified claim',
  how: 'one step with an on-screen action',
  cta: 'one clear action',
  end: 'brand and handle with breathing room',
};
const clean = (x) => String(x || '').trim();
const num = (x, name, min, max) => { const n = Number(x); if (!Number.isFinite(n) || n < min || n > max) die(`${name} must be ${min}-${max}`); return n; };
const slug = (x) => x.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'scene';
function loadBrief(a) {
  const file = path.resolve(a.brief || 'brief.json'); const b = readJson(file);
  if (!b || typeof b !== 'object') die(`read a brief JSON at ${file}`, 'required: topic, audience, goal; optional: duration, language, handle, facts, proof, cta, scenes');
  for (const k of ['topic','audience','goal']) if (!clean(b[k])) die(`brief needs ${k}`);
  const duration = num(b.duration ?? 60, 'duration', 15, 180);
  return { ...b, duration, language: clean(b.language) || 'id', format: clean(b.format) || '16:9' };
}
export function storyboard(a) {
  const brief = loadBrief(a); const scenes = [];
  const supplied = brief.scenes;
  if (supplied && (!Array.isArray(supplied) || supplied.length < 3 || supplied.length > 12)) die('brief.scenes needs 3-12 scene objects');
  const specs = supplied || ROLES.map((role) => ({role}));
  const weights = supplied ? specs.map((s) => num(s.weight ?? 1, 'scene weight', 0.1, 20)) : WEIGHTS;
  const fps = num(a.fps || 30, 'fps', 1, 120), total = Math.round(brief.duration * fps);
  if(!Number.isInteger(fps)) die('fps must be a whole number');
  const minFrames = Math.round(0.8 * fps); if (total < specs.length * minFrames) die('video too short for scene count');
  const free = total - specs.length * minFrames, sum = weights.reduce((x,y) => x+y,0);
  const ends = []; let cumulative = 0;
  for (let i=0;i<specs.length;i++) { cumulative += weights[i]/sum; ends.push(i === specs.length-1 ? total : Math.round((i+1)*minFrames + cumulative*free)); }
  let start=0;
  for (let i=0;i<specs.length;i++) { const s=specs[i], role=clean(s.role)||'scene'; const end=ends[i];
    scenes.push({ id: `${String(i+1).padStart(2,'0')}-${slug(role)}`, role, fromFrame:start, toFrame:end, start:+(start/fps).toFixed(2), end:+(end/fps).toFixed(2), previewFrame:Math.min(end-1, start+Math.max(1,Math.floor((end-start)*0.72))),
      headline:clean(s.headline), visual:clean(s.visual) || VISUAL[role] || 'one clear focal point', proof:clean(s.proof), cue:clean(s.cue), status:s.headline?'draft':'needs_copy' }); start=end; }
  const board={version:1, topic:brief.topic, audience:brief.audience, goal:brief.goal, language:brief.language, format:brief.format, duration:brief.duration, fps, handle:clean(brief.handle), cta:clean(brief.cta), scenes,
    notes:['This is a timing and visual-role scaffold, not a written script or a Remotion composition.', 'Fill each headline, confirm factual claims and licenses, and inspect the stills before a full render.']};
  const file=path.resolve(a.out||'storyboard.json'); writeJson(file,board);
  const md=path.resolve(a.md||file.replace(/\.json$/i,'')+'.md');
  fs.writeFileSync(md,`# ${brief.topic}\n\nAudience: ${brief.audience} | Goal: ${brief.goal} | ${brief.duration}s | ${brief.language}\n\n| Time | Role | Headline | Visual / evidence |\n|---|---|---|---|\n${scenes.map(s=>`| ${s.start.toFixed(1)}-${s.end.toFixed(1)}s | ${s.role} | ${s.headline||'TODO: write and approve'} | ${s.visual.replace(/\|/g,'/')} |`).join('\n')}\n\nApprove the copy, proof and assets before rendering. This board is not final video code.\n`);
  return {storyboard:file, review:md, scenes:scenes.length, duration:brief.duration, needsCopy:scenes.filter(s=>!s.headline).length};
}
function project(a) { const p=workDir(a), entry=path.join(p,'src/index.ts'); if (!fs.existsSync(entry)) die(`not a Remotion project: ${p}`); return p; }
function remotion(p,args) { const r=run('npx',['--no-install','remotion',...args],{cwd:p,encoding:'utf8',maxBuffer:1<<24}); if(r.status!==0) die('Remotion failed: '+(r.stderr||r.stdout||'').slice(-800)); return r; }
export function preview(a) {
  const p=project(a), board=readJson(path.resolve(a.board||path.join(p,'storyboard.json')));
  if (!board?.scenes?.length) die('storyboard scenes missing; pass --board storyboard.json');
  const fps=num(board.fps,'storyboard fps',1,120), scale=num(a.scale??0.35,'scale',0.1,1), comp=clean(a.comp)||'Main';
  const r=remotion(p,['compositions','src/index.ts']); const line=r.stdout.split('\n').find(x=>x.trim().startsWith(comp+' '));
  if(!line) die(`composition ${comp} not found`); const match=line.match(/^\s*\S+\s+(\d+)\s+\S+\s+(\d+)\s+\(/);
  if(!match) die(`could not read composition metadata: ${line}`);
  if(Number(match[1])!==fps) die(`board fps ${fps} differs from composition fps ${match[1]}`);
  const last=Math.max(...board.scenes.map(s=>Number(s.previewFrame))); if(last>=Number(match[2])) die(`board needs frame ${last}, but composition ${comp} ends at ${Number(match[2])-1}; update durationInFrames in src/Root.tsx before preview`);
  const out=path.resolve(a.out||path.join(p,'out','preview-stills')); mkdirp(out);
  const ids=new Set(); for(const scene of board.scenes) { if(!/^[a-z0-9_-]+$/i.test(scene.id||'')) die(`invalid scene id: ${scene.id}`); if(ids.has(scene.id)) die(`duplicate scene id: ${scene.id}`); ids.add(scene.id); }
  const frames=[];
  for (const s of board.scenes) { const f=Math.round(Number(s.previewFrame)); if (!Number.isFinite(f)||f<0) die(`bad preview frame for ${s.id}`);
    const image=path.join(out,`${s.id}.png`); remotion(p,['still','src/index.ts',comp,image,'--frame',String(f),'--scale',String(scale),'--gl',a.gl||'swangle']); frames.push({id:s.id,frame:f,time:+(f/fps).toFixed(2),image}); }
  // ffmpeg tile is deterministic and operates on actual rendered still pixels, not a mock storyboard.
  const list=path.join(out,'frames.txt'); fs.writeFileSync(list,frames.map(f=>`file '${f.image.replace(/'/g,"'\\''")}'`).join('\n')+'\n');
  const sheet=path.join(out,'contact-sheet.jpg');
  ff(['-f','concat','-safe','0','-i',list,'-vf',`scale=640:-2,tile=${Math.min(3,frames.length)}x${Math.ceil(frames.length/Math.min(3,frames.length))}:padding=12:margin=12:color=white`,'-frames:v','1',sheet]);
  return {sheet,frames,note:'Stills are sampled from the current composition at storyboard frames. Review every image; this does not create scenes from the board or replace a motion/audio preview.'};
}
function sourceFiles(root,paths) { return paths.flatMap(name=>{const p=path.resolve(root,name); if(!p.startsWith(root+path.sep)||!fs.existsSync(p)) die(`missing or outside project source: ${name}`); const st=fs.statSync(p); if(st.isDirectory()) return fs.readdirSync(p).sort().flatMap(child=>sourceFiles(root,[path.relative(root,path.join(p,child))])); return [{file:path.relative(root,p),hash:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}];}); }
export function cache3d(a) {
  const p=project(a), comp=clean(a.comp); if(!comp) die('cache3d needs --comp for an isolated 3D-only composition');
  const sources=clean(a.sources).split(',').map(s=>s.trim()).filter(Boolean); if(!sources.length) die('cache3d needs --sources src/scenes/Logo.tsx,... so edits invalidate the cache');
  const start=num(a.start??0,'start',0,1e6), end=num(a.end,'end',start+1,1e6), scale=num(a.scale??1,'scale',0.1,1);
  if(!Number.isInteger(start)||!Number.isInteger(end)) die('start and end must be whole frames');
  if(a.props) die('cache3d --props is not supported yet; bake the intended properties into the isolated composition so the cache reflects exactly what is rendered');
  const fps=num(a.fps??30,'fps',1,120); const cs=remotion(p,['compositions','src/index.ts']); const line=cs.stdout.split('\n').find(x=>x.trim().startsWith(comp+' '));
  const c= line?.match(/^\s*\S+\s+(\d+)\s+\S+\s+(\d+)\s+\(/); if(!c) die(`composition ${comp} not found`);
  if(Number(c[1])!==fps) die(`composition fps ${c[1]} differs from --fps ${fps}`); if(end>=Number(c[2])) die(`end frame ${end} exceeds composition last frame ${Number(c[2])-1}`);
  const manifest={version:1,comp,start,end,scale,fps,sources:sourceFiles(p,sources),engine:'motioncraft-cache3d-v1'};
  const key=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex').slice(0,16);
  const base=path.join(p,'public','mc-cache',`${slug(comp)}-${key}`), count=end-start+1, meta=path.join(base,'manifest.json');
  if(fs.existsSync(meta)&&Array.from({length:count},(_,i)=>fs.existsSync(path.join(base,`${String(i).padStart(6,'0')}.png`))).every(Boolean)) return {cached:true,dir:base,frames:count,key,component:`<CachedFrames dir="mc-cache/${slug(comp)}-${key}" start={${start}} count={${count}} />`};
  mkdirp(base); for(const f of fs.readdirSync(base)) if(f.endsWith('.png')) fs.rmSync(path.join(base,f)); remotion(p,['render','src/index.ts',comp,base,'--sequence','--image-format','png','--frames',`${start}-${end}`,'--scale',String(scale),'--gl',a.gl||'swangle','--muted']);
  const files=fs.readdirSync(base).filter(f=>/^element-\d+\.png$/.test(f)).sort((x,y)=>Number(x.match(/\d+/)[0])-Number(y.match(/\d+/)[0]));
  if(files.length!==count || files.some((name,i)=>Number(name.match(/\d+/)[0])!==start+i)) die(`expected ${count} contiguous frames from ${start}, got ${files.length}; cache not marked complete`);
  files.forEach((name,i)=>fs.renameSync(path.join(base,name),path.join(base,`${String(i).padStart(6,'0')}.png`)));
  writeJson(meta,manifest); return {cached:false,dir:base,frames:count,key,component:`<CachedFrames dir="mc-cache/${slug(comp)}-${key}" start={${start}} count={${count}} />`,warning:'Use an isolated 3D-only composition with a transparent background; include every 3D source, asset and style token in --sources. Changes outside that list cannot invalidate this cache.'};
}
