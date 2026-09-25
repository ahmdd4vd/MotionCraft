import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import {SKILL_DIR} from './util.mjs';

const API = 'https://api.github.com/repos/ahmdd4vd/MotionCraft';
const RELEASES = 'https://github.com/ahmdd4vd/MotionCraft/releases';
export function installedVersion(skillDir = SKILL_DIR) {
  const file = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
  const match = file.match(/^metadata:\s*\n(?:^[ \t]+.*\n)*?^[ \t]+version:\s*["']?([^\s"']+)/m);
  if (!match) throw Error('Installed SKILL.md has no metadata.version; cannot compare versions');
  return match[1];
}
export function parseVersion(value) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(value);
  if (!m) throw Error(`Unsupported version: ${value}`);
  return {parts: m.slice(1,4).map(Number), pre: m[4] || null};
}
export function compareVersions(a,b) {
  const x=parseVersion(a),y=parseVersion(b);
  for(let i=0;i<3;i++) if(x.parts[i]!==y.parts[i]) return Math.sign(x.parts[i]-y.parts[i]);
  if(x.pre===y.pre)return 0;
  if(!x.pre)return 1;if(!y.pre)return -1;
  const xa=x.pre.split('.'),ya=y.pre.split('.');
  for(let i=0;i<Math.max(xa.length,ya.length);i++){
    if(xa[i]===undefined)return -1;if(ya[i]===undefined)return 1;
    if(xa[i]===ya[i])continue;
    const xn=/^\d+$/.test(xa[i]),yn=/^\d+$/.test(ya[i]);
    if(xn&&yn)return Math.sign(Number(xa[i])-Number(ya[i]));
    if(xn!==yn)return xn?-1:1;
    return xa[i]<ya[i]?-1:1;
  }
  return 0;
}
export function getJson(url) {
  return new Promise((resolve,reject)=>{
    const req=https.get(url,{headers:{'User-Agent':'MotionCraft-update-check','Accept':'application/vnd.github+json'},timeout:8000},res=>{
      let data='';res.setEncoding('utf8');
      res.on('data',part=>{data+=part;if(data.length>1024*1024)res.destroy(Error('GitHub response too large'));});
      res.on('end',()=>{
        if(res.statusCode!==200)return reject(Error(`GitHub API returned HTTP ${res.statusCode}`));
        try{resolve(JSON.parse(data));}catch{reject(Error('Invalid GitHub response'));}
      });
    });req.on('timeout',()=>req.destroy(Error('GitHub request timed out')));req.on('error',reject);
  });
}
export async function checkUpdate({skillDir=SKILL_DIR,fetchJson=getJson}={}){
  const installed=installedVersion(skillDir);
  parseVersion(installed);
  let tag,source;
  try {
    const release=await fetchJson(`${API}/releases/latest`);
    if(!release.tag_name||release.draft||release.prerelease)throw Error('No stable release');
    tag=release.tag_name;source='release';
  } catch(err){
    if(!/HTTP 404|No stable release/.test(err.message))throw err;
    // No published release: use the newest stable semantic tag, not API creation order.
    const tags=await fetchJson(`${API}/tags?per_page=100`);
    const stable=tags.map(t=>t.name).filter(t=>/^v?\d+\.\d+\.\d+$/.test(t));
    if(!stable.length)throw Error('No stable release or tag found');
    stable.sort(compareVersions);tag=stable.at(-1);source='tag';
  }
  parseVersion(tag);
  const updateAvailable=compareVersions(installed,tag)<0;
  return {installed,latest:tag,source,updateAvailable,latestUrl:`${RELEASES}/tag/${encodeURIComponent(tag)}`,instruction:updateAvailable?'From your agent environment, run: npx skills add ahmdd4vd/motioncraft (then re-run check-update).':'Already up to date. The version in SKILL.md is the installed version; unreleased changes on main are not counted.'};
}
