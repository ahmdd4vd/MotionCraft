import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readJson,writeJson,die} from './util.mjs';

const secretFile=/^(?:\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx|asc)|id_(?:rsa|ed25519)|credentials(?:\..*)?|secrets?(?:\..*)?)$/i;
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const permitted=new Set(['angle','swangle','egl']);
export function probeRenderer(a={}){
 const project=path.resolve(a.dir||'.'),gl=String(a.gl||'angle');
 if(!permitted.has(gl))throw Error('GL backend must be angle, egl, or swangle');
 const entry=path.join(project,'src/index.ts');if(!fs.existsSync(entry))throw Error('missing Remotion src/index.ts');
 const device=process.platform==='linux'?(fs.existsSync('/dev/dri')?'/dev/dri':null):process.platform==='win32'?'Windows graphics API':process.platform==='darwin'?'macOS Metal':null;
 const nvidia=spawnSync('nvidia-smi',['-L'],{encoding:'utf8',timeout:5000});
 const candidate=!!device||nvidia.status===0;
 // Device presence is a lead, not proof that Chromium used hardware acceleration.
 return {platform:process.platform,device,nvidia:nvidia.status===0?nvidia.stdout.trim():null,gpuCandidate:candidate,gl,requiresVisualAndTimingTest:true,note:candidate?'GPU device visible; this is not proof that Remotion uses hardware. Compare a short 3D render and inspect logs/output.':'No GPU device visible. Use software fallback or move the project to a configured GPU worker.'};
}
export function gpuPreflight(a){try{return probeRenderer(a)}catch(e){die(e.message)}}
export function workerManifest(a){
 const root=path.resolve(a.dir||'.'),dest=path.resolve(a.out||'render-job.json');
 const comp=String(a.comp||'Main'),gl=String(a.gl||'angle');if(!/^[A-Za-z0-9_-]+$/.test(comp)||!permitted.has(gl))die('invalid composition or GL mode');
 const required=['package.json','src/index.ts'];for(const item of required)if(!fs.existsSync(path.join(root,item)))die(`project missing ${item}`);
 const props=a.props?path.resolve(a.props):null;if(props&&!readJson(props))die('cannot read props JSON');
 const files=[];function walk(dir){for(const name of fs.readdirSync(dir).sort()){if(['node_modules','.git','out','.motioncraft'].includes(name))continue;if(secretFile.test(name))die(`secret-looking file in project: ${name}; move it outside the render project before packaging`);const p=path.join(dir,name),rel=path.relative(root,p).replaceAll('\\','/'),st=fs.lstatSync(p);if(st.isSymbolicLink())die(`symlink not accepted in job: ${rel}`);if(st.isDirectory())walk(p);else if(st.isFile()){if(st.size>2*1024*1024*1024)die(`file too large: ${rel}`);files.push({path:rel,sha256:sha(p),bytes:st.size});}}}
 walk(root);if(props&&!files.some(f=>f.path===path.relative(root,props).replaceAll('\\','/')))die('props file must be inside the project and included in the manifest');
 if(!files.some(f=>f.path==='package-lock.json'))die('package-lock.json required: run npm install --package-lock-only before bundling a worker job');
 const manifest={version:1,composition:comp,gl,createdAt:new Date().toISOString(),files,propsPath:props?(props.startsWith(root+path.sep)?path.relative(root,props).replaceAll('\\','/'):null):null,warning:'No GPU or cloud execution guaranteed. Worker must use matching source, media, fonts and Chromium; inspect a short 3D segment and final pixels.'};
 if(props&&!manifest.propsPath)die('props file must be inside the project for portable worker jobs');
 writeJson(dest,manifest);return {manifest:dest,fileCount:files.length,bytes:files.reduce((n,x)=>n+x.bytes,0),sha256:sha(dest),note:'Copy the complete project directory and this manifest to your chosen worker. Do not include secrets in the project; verify hashes on worker before rendering.'};
}
export function workerVerify(a){const root=path.resolve(a.dir||'.'),m=readJson(path.resolve(a.manifest||'render-job.json'));
 if(m?.version!==1||!Array.isArray(m.files)||!m.files.length)die('invalid render-job manifest');
 const failures=[];for(const f of m.files){const absolute=path.resolve(root,f.path);if(typeof f.path!=='string'||!absolute.startsWith(root+path.sep)||!fs.existsSync(absolute)||fs.lstatSync(absolute).isSymbolicLink()||sha(absolute)!==f.sha256)failures.push(f.path)}
 return {pass:failures.length===0,checked:m.files.length,failures,composition:m.composition,gl:m.gl};
}
