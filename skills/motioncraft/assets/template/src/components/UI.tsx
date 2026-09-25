import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {S, C, FONT, MONO} from '../lib/tokens';
import {cl, easeOut, ramp, spr, mix} from '../lib/anim';
import {McBox, useDebug} from '../lib/debug';
import {useFormat} from '../lib/format-context';
import {geometry} from '../lib/format.mjs';
const src = (s: string) => (s.startsWith('http') ? s : staticFile(s));

// Card that rises in with a slight 3D tilt. Optional mac title bar.
export const Card: React.FC<{at: number; w: number; h: number; title?: string; out?: number; children?: React.ReactNode; style?: React.CSSProperties; allowOverlap?: boolean}> = ({at, w, h, title, out, children, style, allowOverlap}) => {
  const f = useCurrentFrame(); const M = S.motion.card; const p = ramp(f, at, M.frames, easeOut);
  const q = out !== undefined ? ramp(f, out, 12) : 0;
  return <div style={{perspective: 1600, ...style}}>
    <McBox kind="block" allowOverlap={allowOverlap} style={{width: w, height: h, borderRadius: S.shape.cardRadius, background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: S.shape.shadow, overflow: 'hidden',
      opacity: p * (1 - q), filter: `blur(${(1 - p) * M.blur + q * 16}px)`, transform: `translateY(${(1 - p) * M.rise}px) rotateX(${(1 - p) * M.rotateX}deg) scale(${(M.scaleFrom + (1 - M.scaleFrom) * p) * (1 - 0.04 * q)})`}}>
      {title !== undefined && <div style={{height: 48, background: C.cardBar, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', borderBottom: `1px solid ${C.cardBorder}`}}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 12, height: 12, borderRadius: 6, background: c}} />)}
        <div style={{flex: 1, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 18, color: C.muted, marginRight: 52}}>{title}</div>
      </div>}
      <div style={{position: 'relative', width: '100%', height: title !== undefined ? h - 48 : h}}>{children}</div>
    </McBox>
  </div>;
};

export const Pill: React.FC<{at: number; children: React.ReactNode; out?: number; style?: React.CSSProperties; size?: number}> = ({at, children, out, style, size = 24}) => {
  const f = useCurrentFrame(); const s = spr(f, at, S.motion.pill.spring); const p = ramp(f, at, 10);
  const q = out !== undefined ? ramp(f, out, 10) : 0;
  return <McBox kind="text" style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: `${size * 0.42}px ${size * 0.85}px`, borderRadius: 999, background: C.card, boxShadow: '0 8px 24px rgba(20,40,80,0.08), 0 0 0 1px rgba(20,40,80,0.05)',
    fontFamily: FONT, fontWeight: 600, fontSize: size, color: C.ink, transform: `scale(${0.85 + 0.15 * s})`, opacity: p * (1 - q), filter: `blur(${(1 - p) * S.motion.pill.blur + q * 8}px)`, ...style}}>{children}</McBox>;
};

export const Keycap: React.FC<{at: number; children: React.ReactNode; size?: number}> = ({at, children, size = 30}) => {
  const f = useCurrentFrame(); const s = spr(f, at, {damping: 12, stiffness: 180, mass: 0.5});
  const press = interpolate(f - at, [8, 11, 16], [0, 1, 0], cl); const p = ramp(f, at, 8);
  return <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: size * 2, minWidth: size * 2, padding: `0 ${size * 0.6}px`, borderRadius: size * 0.45, background: C.card,
    boxShadow: `0 ${4 - press * 3}px 0 #dfe4ec, 0 10px 26px rgba(20,40,80,0.1), 0 0 0 1px rgba(20,40,80,0.06)`, fontFamily: MONO, fontWeight: 500, fontSize: size, color: C.ink,
    transform: `translateY(${press * 3}px) scale(${0.8 + 0.2 * s})`, opacity: p}}>{children}</div>;
};

// Number counting up to a REAL value. Always pair with <Credit> for the source.
export const Counter: React.FC<{at: number; to: number; from?: number; dur?: number; size?: number; suffix?: string; decimals?: number; color?: string}> = ({at, to, from = 0, dur = S.motion.number.duration, size = 140, suffix = '', decimals = 0, color = C.ink}) => {
  const f = useCurrentFrame(); const p = ramp(f, at, dur); const v = (from + (to - from) * p).toFixed(decimals); const dbg = useDebug();
  return <McBox kind="text" style={{fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: size * S.font.tracking, color: dbg ? 'transparent' : color, opacity: ramp(f, at, 8), fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{Number(v).toLocaleString('en-US', {minimumFractionDigits: decimals})}{suffix}</McBox>;
};

// Strike a word, then show its replacement (pattern: "not X. Y.")
export const Strike: React.FC<{at: number; appear?: number; word: string; size?: number; color?: string}> = ({at, appear, word, size = 76, color = C.danger}) => {
  const f = useCurrentFrame(); const p = ramp(f, at, 10); const dbg = useDebug(); const a = ramp(f, appear ?? at - 12, 12);
  return <span style={{position: 'relative', display: 'inline-block', fontFamily: FONT, fontWeight: 600, fontSize: size, color: dbg ? 'transparent' : mix(C.ink, C.muted, p), letterSpacing: size * S.font.tracking, opacity: a, filter: `blur(${(1 - a) * 8}px)`}}>
    {word}<span style={{position: 'absolute', left: -6, right: -6, top: '54%', height: size * 0.07, borderRadius: 4, background: color, transformOrigin: 'left', transform: `scaleX(${p})`}} />
  </span>;
};

export const CheckItem: React.FC<{at: number; text: string; done?: number; size?: number; allowOverlap?: boolean}> = ({at, text, done, size = 22, allowOverlap}) => {
  const f = useCurrentFrame(); const s = spr(f, at, {damping: 12, stiffness: 160, mass: 0.6}); const p = ramp(f, at, 8);
  const d = done !== undefined ? ramp(f, done, 10) : 0; const dbg = useDebug();
  return <McBox kind="text" allowOverlap={allowOverlap} style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 16, background: C.card, boxShadow: '0 10px 30px rgba(20,40,80,0.10)',
    fontFamily: FONT, fontWeight: 500, fontSize: size, color: dbg ? 'transparent' : mix(C.ink, C.muted, d), opacity: p, transform: `scale(${0.8 + 0.2 * s})`, whiteSpace: 'nowrap'}}>
    <div style={{width: size * 1.1, height: size * 1.1, borderRadius: 999, background: d > 0 ? C.success : C.cardBar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.7, transform: `scale(${0.7 + 0.3 * d})`}}>{d > 0.5 ? '✓' : ''}</div>
    <span style={{textDecoration: d > 0.6 ? 'line-through' : 'none'}}>{text}</span>
  </McBox>;
};

export const StepCards: React.FC<{at: number; steps: string[]; gap?: number; step?: number;vertical?:boolean}> = ({at, steps, gap = 48, step = 10,vertical=false}) => (
  <div style={{display:'flex',flexDirection:vertical?'column':'row',alignItems:'center',gap:vertical?14:gap}}>
    {steps.map((s, i) => <React.Fragment key={i}>
      <Card at={at + i * step} w={vertical?540:210} h={vertical?110:170}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
          <div style={{width: 44, height: 44, borderRadius: 12, background: i === steps.length - 1 ? C.accent : C.cardBar, color: i === steps.length - 1 ? '#fff' : C.accent, fontFamily: FONT, fontWeight: 700, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 34, color: C.ink, letterSpacing: -0.7}}>{s}</div>
        </div>
      </Card>
    </React.Fragment>)}
  </div>
);

// Call to action badge, e.g. "Comment MAU"
export const Callout: React.FC<{at: number; label: string; big: string; note?: string}> = ({at, label, big, note}) => {
  const f = useCurrentFrame(); const s = spr(f, at, {damping: 10, stiffness: 150, mass: 0.7}); const p = ramp(f, at, 10);
  const pulse = 1 + Math.max(0, Math.sin((f - at - 20) / 9)) * 0.02 * (f > at + 20 ? 1 : 0);
  return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: p, transform: `scale(${(0.7 + 0.3 * s) * pulse})`}}>
    <McBox kind="text" style={{padding: '14px 34px', borderRadius: 26, background: C.card, border: `2px solid ${C.accentStart}`, boxShadow: '0 20px 50px rgba(43,127,212,0.18)', display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{width: 40, height: 40, borderRadius: 999, background: `radial-gradient(circle at 35% 30%, #cfe3fb, ${C.accent})`}} />
      <div><div style={{fontFamily: FONT, fontWeight: 500, fontSize: 22, color: C.muted}}>{label}</div><div style={{fontFamily: FONT, fontWeight: 700, fontSize: 64, color: C.accent, lineHeight: 1, letterSpacing: -1.3}}>{big}</div></div>
    </McBox>
    {note && <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 22, color: C.muted}}>{note}</div>}
  </div>;
};

// Source credit, bottom-left, small. Required for every real number or third-party example.
export const Credit: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const f = useCurrentFrame(); const p = ramp(f, at, 12);const {format,platform}=useFormat();const g=geometry(format,platform);
  return <McBox kind="text" style={{position: 'absolute', left:g.safe.x,bottom:g.insets.bottom+12, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT, fontWeight: 500, fontSize: 20, color: C.muted, opacity: p}}>
    <div style={{width: 7, height: 7, borderRadius: 4, background: C.highlight}} />{children}
  </McBox>;
};

// Real footage inside a player card. Use a JPG sequence (frames/001.jpg...) for bulletproof renders.
export const Frames: React.FC<{dir: string; count: number; at: number; fps?: number; w: number; h: number}> = ({dir, count, at, fps = 30, w, h}) => {
  const f = useCurrentFrame(); const i = Math.max(0, Math.min(count - 1, Math.floor((f - at) * fps / 30)));
  return <Img src={src(`${dir}/${String(i + 1).padStart(3, '0')}.jpg`)} style={{width: w, height: h, objectFit: 'cover', display: 'block'}} />;
};
