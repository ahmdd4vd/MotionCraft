import React from 'react';
import {AbsoluteFill,Audio,Img,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {Background} from '../components/Stage';
import {S,C,FONT} from '../lib/tokens';
import {cl,easeInOut,sec} from '../lib/anim';
import {McBox,DebugCtx} from '../lib/debug';

export type TutorialStep={title:string; caption:string; from:number; to:number; x:number; y:number; zoom?:number};
export type TutorialProps={handle:string; title:string; captureDir?:string; captureCount?:number; captureFps?:number; sourceCredit?:string; steps:TutorialStep[]; duration?:number; audio?:string; mcDebug?:boolean};
export const Tutorial:React.FC<TutorialProps>=({handle,title,captureDir,captureCount=0,captureFps=30,sourceCredit,steps,audio,mcDebug=false})=>{
 const f=useCurrentFrame();
 const active=steps.find(s=>f>=sec(s.from)&&f<sec(s.to))||steps[steps.length-1];
 const ready=!!captureDir&&captureCount>0&&!!sourceCredit;
 const t=active?Math.min(1,Math.max(0,(f-sec(active.from))/12)):0;
 const z=active?1+(Math.min(1.6,Math.max(1,active.zoom||1.24))-1)*interpolate(t,[0,1],[0,1],{...cl,easing:easeInOut}):1;
 const px=active?Math.min(.88,Math.max(.12,active.x)):.5,py=active?Math.min(.85,Math.max(.12,active.y)):.5;
 const panX=active?interpolate(t,[0,1],[.5,px],{...cl,easing:easeInOut}):.5;
 const panY=active?interpolate(t,[0,1],[.5,py],{...cl,easing:easeInOut}):.5;
 const idx=Math.max(0,Math.min(captureCount-1,Math.floor(f*captureFps/30)));
 return <DebugCtx.Provider value={mcDebug}><AbsoluteFill>
 {!mcDebug?<Background/>:<AbsoluteFill style={{background:'#fff'}}/>}
 <div style={{position:'absolute',top:110,left:92,right:92,fontFamily:FONT,fontSize:61,fontWeight:700,color:C.ink,lineHeight:1.1}}><McBox kind="text">{title}</McBox></div>
 <div style={{position:'absolute',top:260,left:80,width:920,height:1060,borderRadius:28,overflow:'hidden',background:C.card,border:`2px solid ${C.cardBorder}`,boxShadow:S.shape.shadow}}>
  <div style={{position:'absolute',inset:0,transform:`scale(${z})`,transformOrigin:`${panX*100}% ${panY*100}%`}}>
   {ready?<Img src={staticFile(`${captureDir}/${String(idx+1).padStart(3,'0')}.jpg`)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<div style={{display:'grid',placeItems:'center',height:'100%',fontFamily:FONT,fontSize:32,color:C.danger,textAlign:'center',padding:70,overflowWrap:'anywhere'}}>SCREEN RECORDING NEEDED<br/>Add recording, frame count and source credit</div>}
  </div>
  {ready&&active&&<div style={{position:'absolute',left:`${(px*z+(1-z)*panX)*100}%`,top:`${(py*z+(1-z)*panY)*100}%`,width:76,height:76,border:`6px solid ${C.accent}`,borderRadius:'50%',boxShadow:'0 0 0 12px rgba(43,127,212,.2)',transform:'translate(-50%,-50%)',pointerEvents:'none'}}/>}
 </div>
 {/* Bottom captions are outside the capture viewport; they never hide UI controls. */}
 <div style={{position:'absolute',top:1390,left:92,right:92,height:310,display:'flex',flexDirection:'column',justifyContent:'center',gap:18}}>
 {active&&<><McBox kind="text" style={{fontFamily:FONT,fontSize:44,fontWeight:700,color:C.accent}}>STEP {steps.indexOf(active)+1}: {active.title}</McBox><McBox kind="text" style={{fontFamily:FONT,fontSize:37,color:C.ink,lineHeight:1.3}}>{active.caption}</McBox></>}
 </div>
 <div style={{position:'absolute',bottom:90,left:92,right:92,fontFamily:FONT,fontSize:22,color:C.muted,display:'flex',justifyContent:'space-between'}}><span>{ready?`Capture: ${sourceCredit}`:'CAPTURE NOT VERIFIED - DO NOT PUBLISH'}</span><span>{handle}</span></div>
 {audio&&!mcDebug&&<Audio src={staticFile(audio)}/>}</AbsoluteFill></DebugCtx.Provider>;
};
