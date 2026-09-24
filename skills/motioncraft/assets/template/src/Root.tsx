import React from 'react';
import {Composition} from 'remotion';
import {Main, MainProps} from './scenes/Example';
import {W, H, FPS} from './lib/tokens';

export const Root: React.FC = () => <>
  <Composition id="Main" component={Main} durationInFrames={FPS * 20} fps={FPS} width={W} height={H}
    defaultProps={{handle: '@yourhandle', audio: undefined, mcDebug: false} satisfies MainProps} />
  {/* 9:16 version: same scenes, the Zone/safe tokens handle layout. */}
  <Composition id="MainVertical" component={Main} durationInFrames={FPS * 20} fps={FPS} width={1080} height={1920}
    defaultProps={{handle: '@yourhandle', audio: undefined, mcDebug: false} satisfies MainProps} />
</>;
