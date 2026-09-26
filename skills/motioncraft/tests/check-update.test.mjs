import assert from 'node:assert/strict';
import {test} from 'node:test';
import {checkUpdate,compareVersions,installedVersion} from '../scripts/lib/check-update.mjs';
test('installed release metadata is current and semantic comparisons work',()=>{
 assert.equal(installedVersion(),'0.5.0');
 assert.equal(compareVersions('v0.3.0','0.3.0'),0);
 assert.equal(compareVersions('0.4.0-beta.2','0.4.0-beta.10'),-1);
 assert.equal(compareVersions('0.4.0-beta.10','0.4.0'),-1);
 assert.equal(compareVersions('0.4.0','0.3.9'),1);
});
test('latest published release is checked',async()=>{
 const r=await checkUpdate({fetchJson:async()=>({tag_name:'v0.5.0'})});
 assert.equal(r.updateAvailable,false);assert.match(r.instruction,/Already up to date/);
});
test('404 falls back to highest stable tag, rejects other API failures',async()=>{
 const r=await checkUpdate({fetchJson:async url=>{if(url.endsWith('/latest'))throw Error('GitHub API returned HTTP 404');return [{name:'v0.2.0'},{name:'v0.5.0-beta.1'},{name:'v0.4.0'},{name:'v0.3.0'}]}});
 assert.equal(r.latest,'v0.4.0');assert.equal(r.source,'tag');
 await assert.rejects(checkUpdate({fetchJson:async()=>{throw Error('GitHub API returned HTTP 403')}}),/403/);
});
