import {Easing, interpolate, spring} from 'remotion';
import {S, FPS} from './tokens';
export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const b = (a: number[]) => Easing.bezier(a[0], a[1], a[2], a[3]);
export const easeOut = b(S.ease.out);
export const easeInOut = b(S.ease.inOut);
export const easeIn = Easing.in(Easing.quad);
export type Spr = {damping: number; stiffness: number; mass: number};
// springs are evaluated at 60 fps internally so 30 fps renders stay smooth
export const spr = (f: number, at: number, c: Spr) => spring({frame: (f - at) * (60 / FPS), fps: 60, config: c});
export const ramp = (f: number, at: number, len: number, e = easeOut) => interpolate(f, [at, at + len], [0, 1], {...cl, easing: e});
export const mix = (a: string, c: string, t: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = h(a), B = h(c);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
export const sec = (s: number) => Math.round(s * FPS);
