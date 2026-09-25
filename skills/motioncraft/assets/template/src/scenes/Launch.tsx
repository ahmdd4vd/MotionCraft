import React from 'react';
import {AbsoluteFill,Audio,staticFile} from 'remotion';
import {Background,Scene,Zone} from '../components/Stage';
import {Headline,words} from '../components/Headline';
import {Card,Callout,CheckItem,Frames} from '../components/UI';
import {S,C,FONT} from '../lib/tokens';
import {FormatCtx, Format, Platform} from '../lib/format-context';
import {geometry} from '../lib/format.mjs';
import {DebugCtx} from '../lib/debug';
import {sec} from '../lib/anim';

export type LaunchProps={handle:string; product:string; problem:string; feature1:string; feature2:string; cta:string; demoDir?:string; demoCount?:number; demoCredit?:string; duration?:number; audio?:string; mcDebug?:boolean;format?:Format;platform?:Platform};
export const Launch:React.FC<LaunchProps>=({handle,product,problem,feature1,feature2,cta,demoDir,demoCount=0,demoCredit,duration=45,audio,mcDebug=false,format='16:9',platform='wide'})=>{
 const g=geometry(format,platform);const cardW=Math.min(g.safe.width-24,format==='9:16'?860:650);const cardH=Math.min(g.safe.height*.46,format==='9:16'?600:390);
 const realDemo=!!demoDir&&demoCount>0&&!!demoCredit;
 const cut=(s:number)=>sec(s*duration/45);
 return <FormatCtx.Provider value={{format,platform}}><DebugCtx.Provider value={mcDebug}><AbsoluteFill>
 {!mcDebug?<Background/>:<AbsoluteFill style={{background:'#fff'}}/>}
 <Scene from={0} to={cut(8)} noIn><Zone name="top"><Headline level="h1" items={words(problem,cut(0.6))}/></Zone><Zone name="center"><div style={{fontFamily:FONT,color:C.muted,fontSize:42}}>A problem worth solving</div></Zone></Scene>
 <Scene from={cut(8)} to={cut(27)}><Zone name="top"><Headline level="h1" items={words(`${product} in action`,cut(8.2))}/></Zone><Zone name="center"><Card at={cut(8.5)} w={cardW} h={cardH} title={product}>
 {realDemo?<Frames dir={demoDir!} count={demoCount} at={cut(9)} fps={30*45/duration} w={cardW} h={cardH-48}/>:<div style={{height:'100%',display:'grid',placeItems:'center',fontFamily:FONT,color:C.danger,fontSize:40,textAlign:'center',padding:40}}>REPLACE WITH REAL DEMO FRAMES<br/>Add demoDir, demoCount and demoCredit</div>}
 </Card></Zone><div style={{position:'absolute',left:g.safe.x,bottom:g.insets.bottom+10,fontFamily:FONT,fontSize:24,color:C.muted}}>{realDemo?`Demo source: ${demoCredit}`:'DEMO NOT VERIFIED - DO NOT PUBLISH'}</div></Scene>
 <Scene from={cut(27)} to={cut(39)}><Zone name="top"><Headline level="h1" items={words('What changes',cut(27.2))}/></Zone><Zone name="center" style={{flexDirection:'column',gap:24}}><CheckItem at={cut(28)} text={feature1} size={36}/><CheckItem at={cut(30)} text={feature2} size={36}/></Zone></Scene>
 <Scene from={cut(39)} to={cut(45)} noOut><Zone name="top"><Headline level="h1" items={words('Try it yourself',cut(39.2))}/></Zone><Zone name="center"><Callout at={cut(40)} label="Next step" big={cta}/></Zone><div style={{position:'absolute',bottom:g.insets.bottom+10,right:g.insets.right+12,fontFamily:FONT,fontSize:25,color:C.muted}}>{handle}</div></Scene>
 {audio&&!mcDebug&&<Audio src={staticFile(audio)}/>}</AbsoluteFill></DebugCtx.Provider></FormatCtx.Provider>;
};
