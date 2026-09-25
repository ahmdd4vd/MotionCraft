import React from 'react';
import {AbsoluteFill,Audio,staticFile} from 'remotion';
import {Background,Scene,Zone} from '../components/Stage';
import {Headline,words} from '../components/Headline';
import {Card,Callout,CheckItem,Frames} from '../components/UI';
import {S,C,FONT} from '../lib/tokens';
import {DebugCtx} from '../lib/debug';
import {sec} from '../lib/anim';

export type LaunchProps={handle:string; product:string; problem:string; feature1:string; feature2:string; cta:string; demoDir?:string; demoCount?:number; demoCredit?:string; duration?:number; audio?:string; mcDebug?:boolean};
export const Launch:React.FC<LaunchProps>=({handle,product,problem,feature1,feature2,cta,demoDir,demoCount=0,demoCredit,duration=45,audio,mcDebug=false})=>{
 const realDemo=!!demoDir&&demoCount>0&&!!demoCredit;
 const cut=(s:number)=>sec(s*duration/45);
 return <DebugCtx.Provider value={mcDebug}><AbsoluteFill>
 {!mcDebug?<Background/>:<AbsoluteFill style={{background:'#fff'}}/>}
 <Scene from={0} to={cut(8)} noIn><Zone name="top"><Headline level="h1" items={words(problem,cut(0.6))}/></Zone><Zone name="center"><div style={{fontFamily:FONT,color:C.muted,fontSize:42}}>A problem worth solving</div></Zone></Scene>
 <Scene from={cut(8)} to={cut(27)}><Zone name="top"><Headline level="h1" items={words(`${product} in action`,cut(8.2))}/></Zone><Zone name="center"><Card at={cut(8.5)} w={1120} h={600} title={product}>
 {realDemo?<Frames dir={demoDir!} count={demoCount} at={cut(9)} fps={30*45/duration} w={1120} h={552}/>:<div style={{height:'100%',display:'grid',placeItems:'center',fontFamily:FONT,color:C.danger,fontSize:40,textAlign:'center',padding:40}}>REPLACE WITH REAL DEMO FRAMES<br/>Add demoDir, demoCount and demoCredit</div>}
 </Card></Zone><div style={{position:'absolute',left:S.layout.safe.x,bottom:50,fontFamily:FONT,fontSize:24,color:C.muted}}>{realDemo?`Demo source: ${demoCredit}`:'DEMO NOT VERIFIED - DO NOT PUBLISH'}</div></Scene>
 <Scene from={cut(27)} to={cut(39)}><Zone name="top"><Headline level="h1" items={words('What changes',cut(27.2))}/></Zone><Zone name="center" style={{flexDirection:'column',gap:24}}><CheckItem at={cut(28)} text={feature1} size={36}/><CheckItem at={cut(30)} text={feature2} size={36}/></Zone></Scene>
 <Scene from={cut(39)} to={cut(45)} noOut><Zone name="top"><Headline level="h1" items={words('Try it yourself',cut(39.2))}/></Zone><Zone name="center"><Callout at={cut(40)} label="Next step" big={cta}/></Zone><div style={{position:'absolute',bottom:55,right:90,fontFamily:FONT,fontSize:25,color:C.muted}}>{handle}</div></Scene>
 {audio&&!mcDebug&&<Audio src={staticFile(audio)}/>}</AbsoluteFill></DebugCtx.Provider>;
};
