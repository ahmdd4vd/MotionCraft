import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';

// Place in the SAME bounds as the isolated 3D composition. No WebGL runs after caching.
// Cache must cover the original absolute frame range; the image sequence is 0-based within it.
export const CachedFrames: React.FC<{dir: string; start: number; count: number; width?: number; height?: number}> = ({dir,start,count,width,height}) => {
  const f=useCurrentFrame();
  if(f<start || f>=start+count) return null;
  const n=String(f-start).padStart(6,'0');
  return <Img src={staticFile(`${dir}/${n}.png`)} style={{width:width||'100%',height:height||'100%',objectFit:'contain'}} />;
};
