import {FPS, S} from './tokens';


// Beats are seconds in the existing music beatgrid/timeline. Never invent a beat
// when none was supplied. The per-style window keeps VO-led words from drifting.
export const nearestBeatFrame = (frame: number, beats: number[], maxMs = S.motion.beat.snapMs) => {
  if (!beats?.length) return frame;
  const maxFrames = maxMs * FPS / 1000;
  let best = frame, distance = Infinity;
  for (const second of beats) {
    const candidate = Math.round(second * FPS);
    const delta = Math.abs(candidate - frame);
    if (delta < distance) {best = candidate; distance = delta;}
  }
  return distance <= maxFrames ? best : frame;
};
export const beatAccent = (frame: number, beats: number[], strength = S.motion.beat.pulse) => {
  if (!beats?.length) return 1;
  const past = beats.map((t) => Math.round(t * FPS)).filter((b) => b <= frame);
  const last = past[past.length - 1];
  if (last === undefined) return 1;
  const elapsed = frame - last, length = S.motion.beat.pulseFrames;
  return elapsed < length ? 1 + strength * (Math.pow(1 - elapsed / length, 2)) : 1;
};
