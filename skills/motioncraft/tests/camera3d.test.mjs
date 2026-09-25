import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
const base = new URL('../', import.meta.url);
test('all styles expose bounded per-shot perspective moves', () => {
  for (const name of fs.readdirSync(new URL('../styles/', import.meta.url))) {
    const t = JSON.parse(fs.readFileSync(new URL(`../styles/${name}/tokens.json`, import.meta.url)));
    const keys = t.three.camera.moves;
    assert.ok(keys.length >= 2, name);
    for (const [frame, dolly, orbit, x, y] of keys) {
      assert.ok(Number.isFinite(frame) && dolly >= 0.85 && dolly <= 1.15 && Math.abs(orbit) < 0.2 && Math.abs(x) < 200 && Math.abs(y) < 200, name);
    }
    assert.ok(keys.every((key, i) => !i || key[0] > keys[i - 1][0]), name);
  }
});
test('the 3D components accept per-shot camera moves', () => {
  const source = fs.readFileSync(new URL('../assets/template/src/components/Three.tsx', import.meta.url), 'utf8');
  for (const name of ['Logo3D', 'Mascot', 'FloatingShapes']) assert.match(source, new RegExp(`export const ${name}:[^\\n]+cameraMove`));
  assert.match(source, /camera\.position\.set\(/);
});
