import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseFrameRate } from '../scripts/lib/qa.mjs';

test('ffprobe rational frame rates are parsed as numbers', () => {
  assert.equal(parseFrameRate('30000/1001'), 30000 / 1001);
  assert.equal(parseFrameRate('24'), 24);
  assert.equal(parseFrameRate('24000/1001'), 24000 / 1001);
});

test('malformed ffprobe metadata is rejected instead of evaluated', () => {
  for (const value of ['0/1', '30/0', 'N/A', '30 / 1', '1e3/1', '30;process.exit(1)', '1/1+1', '999999999999999999999/1', '', null]) {
    assert.throws(() => parseFrameRate(value), /invalid ffprobe frame rate/);
  }
});
