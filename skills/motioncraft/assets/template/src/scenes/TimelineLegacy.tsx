import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame} from 'remotion';
import {Main,MainProps} from './Example';
import {Launch,LaunchProps} from './Launch';
import {Tutorial,TutorialProps} from './Tutorial';

export type LegacyScene={id:string;fromFrame:number;toFrame:number;sourceFromFrame:number;sourceToFrame:number};
export type LegacyBoard={duration:number;fps:number;scenes:LegacyScene[]};
export type LegacyProps={timeline?:LegacyBoard;audio?:string};
const Slice:React.FC<{scene:LegacyScene;kind:'main'|'launch'|'tutorial';props:MainProps&LaunchProps&TutorialProps}>=({scene,kind,props})=>{
 const local=useCurrentFrame(),target=scene.toFrame-scene.fromFrame,source=scene.sourceToFrame-scene.sourceFromFrame;
 const at=scene.sourceFromFrame+Math.min(source-1,Math.floor(local*source/target));
 // Offset the nested sequence so every legacy component sees the mapped source frame.
 // Freeze alone does not override the frame seen through Sequence in all versions.
 const clean={...props,audio:undefined};
 return <Sequence from={local-at} durationInFrames={1800+at} layout="none">{kind==='main'?<Main {...clean}/>:kind==='launch'?<Launch {...clean}/>:<Tutorial {...clean}/>}</Sequence>;
};
export const TimelineLegacy:React.FC<LegacyProps&Record<string,unknown>&{kind:'main'|'launch'|'tutorial'}>=({timeline,kind,...rest})=>{
 if(!timeline)return kind==='main'?<Main {...rest as MainProps}/>:kind==='launch'?<Launch {...rest as LaunchProps}/>:<Tutorial {...rest as TutorialProps}/>;
 // Audio must be re-timed with `timeline audio` and supplied to render separately.
 // Never silently keep the old full-composition audio while shots are reordered.
 const props=rest as MainProps&LaunchProps&TutorialProps;
 return <AbsoluteFill>{timeline.scenes.map(s=><Sequence key={s.id} from={s.fromFrame} durationInFrames={s.toFrame-s.fromFrame} layout="none"><Slice scene={s} kind={kind} props={props}/></Sequence>)}</AbsoluteFill>;
};
