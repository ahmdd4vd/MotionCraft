import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, S} from '../lib/tokens';
import {cl, easeInOut} from '../lib/anim';
import {useDebug} from '../lib/debug';

// Corresponding vertices describe one continuous shape, not a dissolve between
// two pictures. The source/target are normalized center, size, points and color.
export type MorphShape = {x:number;y:number;size:number;points:[number,number][];color?:string};
export const morphShapeAt=(a:MorphShape,b:MorphShape,t:number):MorphShape=>{
  if(a.points.length!==b.points.length||a.points.length<3)throw new Error('Morph endpoints require the same number of vertices (>=3)');
  const lerp=(u:number,v:number)=>u+(v-u)*t;
  return {x:lerp(a.x,b.x),y:lerp(a.y,b.y),size:lerp(a.size,b.size),points:a.points.map(([x,y],i)=>[lerp(x,b.points[i][0]),lerp(y,b.points[i][1])]),color:t<.5?a.color:b.color};
};
export const MorphTransition:React.FC<{at:number;from:MorphShape;to:MorphShape;duration?:number;holdBefore?:number;holdAfter?:number}>=({at,from,to,duration=S.motion.morph.frames,holdBefore=0,holdAfter=0})=>{
  const f=useCurrentFrame(),dbg=useDebug(),{width,height}=useVideoConfig();
  if(dbg||f<at-holdBefore||f>at+duration+holdAfter)return null;
  const p=interpolate(f,[at,at+duration],[0,1],{...cl,easing:easeInOut});
  const shape=morphShapeAt(from,to,p);const radius=shape.size*0.5;
  const pts=shape.points.map(([x,y])=>`${(shape.x*width+x*radius).toFixed(1)},${(shape.y*height+y*radius).toFixed(1)}`).join(' ');
  // Overlay is decorative and pointer-free. Its vertices are real interpolated
  // geometry; avoid covering text by choosing positions outside safe zones.
  return <svg aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',overflow:'visible'}} viewBox={`0 0 ${width} ${height}`}>
    <polygon points={pts} fill={shape.color??C.accent} opacity={(holdBefore||holdAfter ? S.motion.morph.opacity : Math.sin(Math.PI*p)*S.motion.morph.opacity)}/>
  </svg>;
};
