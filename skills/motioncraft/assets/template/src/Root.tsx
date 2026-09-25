import React from 'react';
import {Composition} from 'remotion';
import {Main, MainProps} from './scenes/Example';
import {FPS} from './lib/tokens';
import {Launch, LaunchProps} from './scenes/Launch';
import {Tutorial, TutorialProps} from './scenes/Tutorial';
import {geometry} from './lib/format.mjs';

// Each composition accepts format/platform props; metadata sets real dimensions, not a crop.
const meta = ({props}: {props: {format?: string; platform?: string; duration?: number}}) => {
  const g = geometry(props.format, props.platform);
  return {width:g.width,height:g.height,...(props.duration ? {durationInFrames:Math.round(props.duration*FPS)} : {})};
};
const main = {handle:'@yourhandle',format:'16:9',platform:'wide',audio:undefined,mcDebug:false} satisfies MainProps;
const launch = {handle:'@yourhandle',product:'Your product',problem:'A real problem',feature1:'Verified feature one',feature2:'Verified feature two',cta:'Your CTA',format:'16:9',platform:'wide',mcDebug:false} satisfies LaunchProps;
const tutorial = {handle:'@yourhandle',title:'A clear tutorial',steps:[{title:'Open',caption:'Show the first step',from:0,to:20,x:.5,y:.3},{title:'Choose',caption:'Point at the right control',from:20,to:40,x:.7,y:.5},{title:'Finish',caption:'Show the result',from:40,to:60,x:.5,y:.7}],format:'9:16',platform:'tiktok',mcDebug:false} satisfies TutorialProps;
export const Root: React.FC = () => <>
  <Composition id="Main" component={Main} durationInFrames={FPS*20} fps={FPS} width={1920} height={1080} defaultProps={main} calculateMetadata={meta}/>
  <Composition id="MainVertical" component={Main} durationInFrames={FPS*20} fps={FPS} width={1080} height={1920} defaultProps={{...main,format:'9:16',platform:'tiktok'}} calculateMetadata={meta}/>
  <Composition id="ProductLaunch" component={Launch} durationInFrames={FPS*45} fps={FPS} width={1920} height={1080} defaultProps={launch} calculateMetadata={meta}/>
  <Composition id="ScreenTutorial" component={Tutorial} durationInFrames={FPS*60} fps={FPS} width={1080} height={1920} defaultProps={tutorial} calculateMetadata={meta}/>
</>;
