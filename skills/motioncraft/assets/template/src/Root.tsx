import React from 'react';
import {Composition} from 'remotion';
import {Main, MainProps} from './scenes/Example';
import {W, H, FPS} from './lib/tokens';
import {Launch,LaunchProps} from './scenes/Launch';
import {Tutorial,TutorialProps} from './scenes/Tutorial';

export const Root: React.FC = () => <>
  <Composition id="ProductLaunch" component={Launch} durationInFrames={FPS*45} calculateMetadata={({props})=>({durationInFrames:Math.round((props.duration||45)*FPS)})} fps={FPS} width={1920} height={1080}
    defaultProps={{handle:'@yourhandle',product:'Your product',problem:'A real problem',feature1:'Verified feature one',feature2:'Verified feature two',cta:'Your CTA',mcDebug:false} satisfies LaunchProps}/>
  <Composition id="ScreenTutorial" component={Tutorial} durationInFrames={FPS*60} calculateMetadata={({props})=>({durationInFrames:Math.round((props.duration||60)*FPS)})} fps={FPS} width={1080} height={1920}
    defaultProps={{handle:'@yourhandle',title:'A clear tutorial',steps:[{title:'Open',caption:'Show the first step',from:0,to:20,x:.5,y:.3},{title:'Choose',caption:'Point at the right control',from:20,to:40,x:.7,y:.5},{title:'Finish',caption:'Show the result',from:40,to:60,x:.5,y:.7}],mcDebug:false} satisfies TutorialProps}/>
  <Composition id="Main" component={Main} durationInFrames={FPS * 20} fps={FPS} width={W} height={H}
    defaultProps={{handle: '@yourhandle', audio: undefined, mcDebug: false} satisfies MainProps} />
  {/* 9:16 version: same scenes, the Zone/safe tokens handle layout. */}
  <Composition id="MainVertical" component={Main} durationInFrames={FPS * 20} fps={FPS} width={1080} height={1920}
    defaultProps={{handle: '@yourhandle', audio: undefined, mcDebug: false} satisfies MainProps} />
</>;
