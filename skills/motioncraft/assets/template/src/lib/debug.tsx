// Layout debug mode. When the composition gets inputProps {mcDebug: true}, every registered box is painted
// as a translucent block (text = red, block = green). `motioncraft qa overlap` renders this mode at low
// resolution and flags pixels where two text boxes (or two blocks) stack, or where text leaves the safe area.
import React, {createContext, useContext} from 'react';
export const DebugCtx = createContext(false);
export const useDebug = () => useContext(DebugCtx);
type Kind = 'text' | 'block';
export const McBox: React.FC<{kind: Kind; allowOverlap?: boolean; style?: React.CSSProperties; children: React.ReactNode}> = ({kind, allowOverlap, style, children}) => {
  const dbg = useDebug();
  const paint: React.CSSProperties = dbg && !allowOverlap ? {background: kind === 'text' ? 'rgba(255,0,0,0.5)' : 'rgba(0,255,0,0.35)', boxShadow: 'none'} : {};
  return <div data-mc={kind} data-mc-allow={allowOverlap ? '1' : undefined} style={{...style, ...paint}}>{dbg && !allowOverlap ? <div style={{display: 'contents', visibility: 'hidden'}}>{children}</div> : children}</div>;
};
