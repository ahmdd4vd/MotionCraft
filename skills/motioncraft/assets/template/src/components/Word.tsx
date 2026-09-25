import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {S, C, FONT} from '../lib/tokens';
import {cl, easeIn, easeInOut, mix, ramp, spr} from '../lib/anim';
import {McBox} from '../lib/debug';
import {useDebug} from '../lib/debug';
const M = S.motion;

// One word: grey + blur -> ink, rising on a soft spring. Optional exit.
export const Word: React.FC<{t: string; at: number; size: number; accent?: boolean; out?: number; weight?: number; color?: string}> = ({t, at, size, accent, out, weight = S.font.weights.h1, color}) => {
  const f = useCurrentFrame(); const dbg = useDebug();
  const p = ramp(f, at, M.word.inFrames);
  const s = spr(f, at, M.word.spring);
  const cp = ramp(f, at, accent ? M.word.accentColorFrames : M.word.colorFrames);
  let o = p, bl = (1 - p) * M.word.blur, y = (1 - s) * size * M.word.rise;
  if (out !== undefined) { const q = interpolate(f, [out, out + M.wordOut.frames], [0, 1], {...cl, easing: easeIn}); o *= 1 - q; bl += q * M.wordOut.blur; y -= q * size * M.wordOut.rise; }
  const col = color ?? (accent ? mix(C.accentStart, C.accent, cp) : mix(C.inkStart, C.ink, cp));
  return <span style={{display: 'inline-block', whiteSpace: 'pre', fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1, letterSpacing: size * S.font.tracking,
    color: dbg ? 'transparent' : col, opacity: o, filter: bl > 0.05 ? `blur(${bl}px)` : undefined, transform: `translateY(${y}px)`}}>{t}</span>;
};

// Icon that slides in between words: the slot opens first (neighbours glide apart), then the icon pops.
export const InlineIcon: React.FC<{src: string; at: number; size: number; out?: number}> = ({src, at, size, out}) => {
  const f = useCurrentFrame(); const I = M.icon;
  const wv = interpolate(f, [at - I.slotFrames / 2, at + I.slotFrames / 2], [0, 1], {...cl, easing: easeInOut});
  const s = spr(f, at, I.spring);
  let o = Math.min(1, s * 2), sc = s;
  if (out !== undefined) { const q = interpolate(f, [out, out + 9], [0, 1], {...cl, easing: easeIn}); o *= 1 - q; sc *= 1 - q * 0.2; }
  const fl = Math.sin((f - at) / 16) * I.float;
  return <span style={{display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: wv * size * I.slotWidth, height: size, verticalAlign: 'middle'}}>
    <Img src={src.startsWith('http') ? src : staticFile(src)} style={{height: size * 1.05, width: 'auto', transform: `translateY(${fl}px) scale(${sc}) rotate(${(1 - s) * I.rotate}deg)`, opacity: o, filter: 'drop-shadow(0 10px 14px rgba(30,60,110,0.16))'}} />
  </span>;
};

// Character-level reveal keeps the full word's layout width from the start,
// so staggering never causes line reflow. Unicode code points stay intact.
export const CharReveal: React.FC<{text: string; at: number; size: number; accent?: boolean; weight?: number; out?: number}> = ({text, at, size, accent, weight = S.font.weights.h1, out}) => {
  const f=useCurrentFrame();const dbg=useDebug();const chars=Array.from(text);
  return <McBox kind="text" style={{display:'inline-block',whiteSpace:'pre',fontFamily:FONT,fontWeight:weight,fontSize:size,lineHeight:1,letterSpacing:size*S.font.tracking}}>
    {chars.map((ch,i)=>{const p=ramp(f,at+i*M.character.stagger,M.character.frames);
      const q=out===undefined?0:ramp(f,out+i*M.wordOut.stagger,M.wordOut.frames);
      return <span key={i} style={{display:'inline-block',color:dbg?'transparent':accent?C.accent:C.ink,opacity:p*(1-q),
        filter:dbg?undefined:`blur(${(1-p)*M.character.blur+q*M.wordOut.blur}px)`,transform:`translateY(${(1-p)*size*M.character.rise}px)`}}>{ch}</span>;
    })}
  </McBox>;
};
