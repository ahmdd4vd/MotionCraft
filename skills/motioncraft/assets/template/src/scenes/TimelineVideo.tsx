import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Background,Zone} from '../components/Stage';
import {Headline,words} from '../components/Headline';
import {Card,Callout,CheckItem,Frames} from '../components/UI';
import {C,FONT} from '../lib/tokens';
import {FormatCtx,Format,Platform} from '../lib/format-context';
import {geometry} from '../lib/format.mjs';
import {DebugCtx} from '../lib/debug';
import {beatAccent, nearestBeatFrame} from '../lib/beat';

export type TimelineScene={id:string;role:string;headline?:string;fromFrame:number;toFrame:number;start:number;end:number};
export type TimelineBoard={fps:number;duration:number;scenes:TimelineScene[]};
export type TimelineProps={timeline?:TimelineBoard;beats?:number[];format?:Format;platform?:Platform;audio?:string;mcDebug?:boolean;handle?:string;product?:string;problem?:string;feature1?:string;feature2?:string;cta?:string;demoDir?:string;demoCount?:number;demoCredit?:string;title?:string;captureDir?:string;captureCount?:number;sourceCredit?:string};
const defaultLaunch:TimelineBoard={fps:30,duration:45,scenes:[
 {id:'problem',role:'problem',headline:'A real problem',fromFrame:0,toFrame:240,start:0,end:8},
 {id:'demo',role:'demo',headline:'Product in action',fromFrame:240,toFrame:810,start:8,end:27},
 {id:'features',role:'features',headline:'What changes',fromFrame:810,toFrame:1170,start:27,end:39},
 {id:'cta',role:'cta',headline:'Try it yourself',fromFrame:1170,toFrame:1350,start:39,end:45}]};
const defaultTutorial:TimelineBoard={fps:30,duration:30,scenes:[
 {id:'intro',role:'intro',headline:'A clear tutorial',fromFrame:0,toFrame:150,start:0,end:5},
 {id:'step-1',role:'step',headline:'Open',fromFrame:150,toFrame:450,start:5,end:15},
 {id:'step-2',role:'step',headline:'Choose',fromFrame:450,toFrame:750,start:15,end:25},
 {id:'outro',role:'outro',headline:'Review',fromFrame:750,toFrame:900,start:25,end:30}]};
export const timelineDefaults={launch:defaultLaunch,tutorial:defaultTutorial};
const Beat:React.FC<{beats:number[];start:number;fps:number}>=({beats,start,fps})=>{const f=useCurrentFrame();const hit=beats.some(b=>{const d=f-Math.round((b-start)*fps);return d>=0&&d<5});return <div data-beat="marker" style={{position:'absolute',right:30,top:30,width:16,height:16,borderRadius:16,background:C.accent,opacity:hit?1:.12,transform:`scale(${beatAccent(f+Math.round(start*fps),beats) * (hit?1.5:1)})`}}/>};
const SceneBody:React.FC<{s:TimelineScene;p:TimelineProps;kind:'launch'|'tutorial';beats:number[];fps:number}>=({s,p,kind,beats,fps})=>{
 const f=useCurrentFrame(),g=geometry(p.format,p.platform),duration=s.toFrame-s.fromFrame;
 const name=s.headline || (s.role==='problem'?p.problem:s.role==='demo'?`${p.product||'Product'} in action`:s.role==='intro'?p.title:s.role==='cta'?p.cta:s.role);
 const demo=kind==='launch'?p.demoDir:p.captureDir,count=kind==='launch'?p.demoCount:p.captureCount,credit=kind==='launch'?p.demoCredit:p.sourceCredit;
 const ready=!!demo&&!!count&&!!credit;
 return <AbsoluteFill data-scene={s.id} style={{fontFamily:FONT}}>
 <Zone name="top"><Headline level="h1" items={words(name||s.role,nearestBeatFrame(s.fromFrame+Math.min(8,Math.round(duration*.06)),beats)-s.fromFrame)}/></Zone>
 <Zone name="center">
 {(s.role==='demo'||s.role==='step')?<Card at={nearestBeatFrame(s.fromFrame+6,beats)-s.fromFrame} w={Math.min(g.safe.width*.86,820)} h={Math.min(g.safe.height*.47,540)} title={kind==='launch'?(p.product||'Demo'):'Screen capture'}>
 {ready?<Frames dir={demo!} count={count!} at={0} fps={30} w={Math.min(g.safe.width*.86,820)} h={Math.min(g.safe.height*.47,540)-48}/>:<div style={{padding:30,fontSize:30,color:C.danger}}>REAL FOOTAGE REQUIRED - DO NOT PUBLISH</div>}
 </Card>:s.role==='features'?<div style={{display:'flex',flexDirection:'column',gap:25}}><CheckItem at={8} text={p.feature1||'Verified feature one'} size={32}/><CheckItem at={25} text={p.feature2||'Verified feature two'} size={32}/></div>:s.role==='cta'||s.role==='outro'?<Callout at={nearestBeatFrame(s.fromFrame+8,beats)-s.fromFrame} label="Next step" big={p.cta||'Try it'} />:<div style={{fontSize:36,color:C.muted,textAlign:'center'}}>{kind==='tutorial'?'Watch the steps':'A problem worth solving'}</div>}
 </Zone><div style={{position:'absolute',left:g.safe.x,bottom:g.insets.bottom+12,color:C.muted,fontSize:20}}>{ready&&['demo','step'].includes(s.role)?`Source: ${credit}`:p.handle||''}</div><Beat beats={beats} start={s.start} fps={fps}/>
 </AbsoluteFill>;
};
export const TimelineVideo:React.FC<TimelineProps&{kind:'launch'|'tutorial'}>=p=>{
 const {kind,timeline,beats=[],mcDebug=false,format=kind==='launch'?'16:9':'9:16',platform=kind==='launch'?'wide':'tiktok'}=p;
 const board=timeline||timelineDefaults[kind];
 return <FormatCtx.Provider value={{format,platform}}><DebugCtx.Provider value={mcDebug}><AbsoluteFill>
 {!mcDebug?<Background/>:<AbsoluteFill style={{background:'#fff'}}/>}
 {board.scenes.map(s=><Sequence key={s.id} from={s.fromFrame} durationInFrames={s.toFrame-s.fromFrame} layout="none"><SceneBody s={s} p={{...p,format,platform}} kind={kind} beats={beats} fps={board.fps}/></Sequence>)}
 {p.audio&&!mcDebug&&<Audio src={staticFile(p.audio)}/>}
 </AbsoluteFill></DebugCtx.Provider></FormatCtx.Provider>;
};
