import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
test('beat alignment is opt-in and bounded for all five styles', () => {
  for (const id of fs.readdirSync(new URL('../styles/', import.meta.url))) {
    const t=JSON.parse(fs.readFileSync(new URL(`../styles/${id}/tokens.json`, import.meta.url)));
    assert.ok(t.motion.beat.snapMs <= 100 && t.motion.beat.snapMs > 0);
    assert.ok(t.motion.beat.pulse <= 0.05);
  }
  const beat=fs.readFileSync(new URL('../assets/template/src/lib/beat.ts', import.meta.url),'utf8');
  assert.match(beat,/if \(!beats\?\.length\) return frame/);
  assert.match(beat,/distance <= maxFrames \? best : frame/);
});
