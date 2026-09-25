import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {S, C} from '../lib/tokens';
import {useVideoConfig} from 'remotion';
import {geometry} from '../lib/format.mjs';
import {useFormat} from '../lib/format-context';
import {cl, easeInOut} from '../lib/anim';
import {useDebug} from '../lib/debug';

// Background: soft vertical gradient + two slow blue glows. Nothing else.
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const g1 = {x: 72 + Math.sin(f / 150) * 4, y: 92 + Math.cos(f / 170) * 3}, g2 = {x: 22 + Math.cos(f / 140) * 4, y: 96 + Math.sin(f / 160) * 3};
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.bg[0]} 0%, ${C.bg[1]} 55%, ${C.bg[2]} 100%)`}}>
    <AbsoluteFill style={{filter: 'blur(40px)', background: `radial-gradient(40% 34% at ${g1.x}% ${g1.y}%, ${C.glow[0]}, transparent 70%), radial-gradient(38% 30% at ${g2.x}% ${g2.y}%, ${C.glow[1]}, transparent 70%)`}} />
  </AbsoluteFill>;
};

// Scene window with blur-crossfade in/out. Scenes overlap by `overlap` frames; never hard-cut.
export const Scene: React.FC<{from: number; to: number; children: React.ReactNode; noIn?: boolean; noOut?: boolean}> = ({from, to, children, noIn, noOut}) => {
  const f = useCurrentFrame(); const dbg = useDebug(); const M = S.motion.scene; const D = M.overlap;
  if (f < from - D / 2 || f > to + D) return null;
  const pin = noIn ? 1 : interpolate(f, [from - D / 2, from + D / 2], [0, 1], {...cl, easing: easeInOut});
  const pout = noOut ? 0 : interpolate(f, [to, to + D], [0, 1], {...cl, easing: easeInOut});
  const sc = (M.scaleIn - (M.scaleIn - 1) * pin) * (1 - (1 - M.scaleOut) * pout);
  const x = (1 - pin) * M.shiftIn - pout * M.shiftIn * 0.6;
  const bl = (1 - pin) * M.blur + pout * M.blur;
  // Debug mode: hard switch at the crossfade midpoint, so the overlap check only sees real layout collisions
  // (the blurred half-transparent crossfade is intended and never reads as overlapping text).
  if (dbg) return pin >= 0.5 && (noOut || f < to) ? <AbsoluteFill style={{transform: `scale(${sc})`}}>{children}</AbsoluteFill> : null;
  return <AbsoluteFill style={{opacity: pin * (1 - pout), filter: bl > 0.05 ? `blur(${bl}px)` : undefined, transform: `translateX(${x}px) scale(${sc})`}}>{children}</AbsoluteFill>;
};

// Camera: keyframes [frame, scale, x, y] with in-out easing, plus a constant tiny drift so the frame never dies.
export type CamKey = [number, number, number, number];
export const Camera: React.FC<{keys?: CamKey[]; children: React.ReactNode}> = ({keys = [[0, 1, 0, 0]], children}) => {
  const f = useCurrentFrame(); const K = [...keys].sort((a, b) => a[0] - b[0]);
  const at = (i: 1 | 2 | 3) => K.length < 2 ? K[0][i] : interpolate(f, K.map((k) => k[0]), K.map((k) => k[i]), {...cl, easing: easeInOut});
  const maxZ = S.motion.camera.maxZoom; const s = Math.min(maxZ, at(1));
  const d = S.motion.camera.drift; const dx = Math.sin(f / 90) * d, dy = Math.cos(f / 110) * d * 0.6;
  return <AbsoluteFill style={{transform: `translate(${at(2) + dx}px, ${at(3) + dy}px) scale(${s})`, transformOrigin: '50% 50%'}}>{children}</AbsoluteFill>;
};

export const Center: React.FC<{children: React.ReactNode; style?: React.CSSProperties; gap?: number}> = ({children, style, gap = 40}) => {
  const {format, platform} = useFormat(); const {width,height}=useVideoConfig(); const g=geometry(format,platform);
  return <div style={{position:'absolute',left:g.safe.x,top:g.safe.y,width:Math.min(g.safe.width,width),height:Math.min(g.safe.height,height),display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap,...style}}>{children}</div>;
};
// Zones keep headline and hero from ever competing for space.
export const Zone: React.FC<{name: 'top' | 'center' | 'bottom'; children: React.ReactNode; style?: React.CSSProperties}> = ({name, children, style}) => {
  const {format,platform}=useFormat(); const g=geometry(format,platform); const [a,b]=g.zones[name];
  return <div style={{position:'absolute',left:g.safe.x,width:g.safe.width,top:g.safe.y+a*g.safe.height,height:(b-a)*g.safe.height,display:'flex',alignItems:'center',justifyContent:'center',...style}}>{children}</div>;
};
