// Example video (~20 s) that shows every core pattern. Copy a scene, change the words, keep the numbers.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Background, Scene, Camera, Center, Zone} from '../components/Stage';
import {Headline, words} from '../components/Headline';
import {Strike, Card, Pill, CheckItem, StepCards, Callout, Credit, Counter} from '../components/UI';
import {FloatingShapes} from '../components/Three';
import {EndCard} from '../components/EndCard';
import {sec} from '../lib/anim';
import {nearestBeatFrame} from '../lib/beat';
import {MorphTransition} from '../components/MorphTransition';
import {FormatCtx, Format, Platform} from '../lib/format-context';
import {geometry} from '../lib/format.mjs';
import {DebugCtx} from '../lib/debug';

export type MainProps = {handle: string; audio?: string; beats?: number[]; mcDebug?: boolean; format?:Format;platform?:Platform};

export const Main: React.FC<MainProps> = ({handle, audio, beats = [], mcDebug = false,format='16:9',platform='wide'}) => {
  const f = useCurrentFrame();
  return <FormatCtx.Provider value={{format,platform}}><DebugCtx.Provider value={mcDebug}>
    <AbsoluteFill>
      {!mcDebug && <Background />}
      {mcDebug && <AbsoluteFill style={{background: '#fff'}} />}
      <Camera keys={[[0, 1.04, 0, 0], [sec(4), 1, 0, 0], [sec(9), 1.03, 0, -6], [sec(12), 1, 0, 0]]}>
        {/* 1. Hook: 3D objects + short line */}
        <Scene from={0} to={sec(3.4)} noIn>
          {!mcDebug && <AbsoluteFill style={{opacity: 0.9}}><FloatingShapes at={nearestBeatFrame(0, beats)} beats={beats} /></AbsoluteFill>}
          <Center><Headline level="h1" items={words('Make videos like *this.*', nearestBeatFrame(8, beats))} /></Center>
        </Scene>
        {/* 2. Reframe: "Not X. Y." */}
        <Scene from={sec(3.4)} to={sec(7.6)}>
          <Center gap={10}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:12}}>
              <Headline level="h2" items={words('The secret is not', sec(3.6))} />
              <Strike at={sec(4.4)} appear={sec(4.0)} word="prompts." size={46} />
            </div>
            <Headline level="h0" items={words('*References.*', sec(4.8))} />
          </Center>
        </Scene>
        {/* 3. Proof: card + checklist, headline in its own zone */}
        <Scene from={sec(7.6)} to={sec(12)}>
          <Zone name="top"><Headline level="h1" size={64} items={words('Give *feedback* until it fits', sec(7.8))} /></Zone>
          <Zone name="center" style={{gap:format==='9:16'?18:12,flexDirection:format==='9:16'?'column':'row'}}>
            <Card at={sec(8.2)} w={format==='9:16'?620:430} h={format==='9:16'?340:250} title="preview">
              <div style={{height:'100%',display:'grid',placeItems:'center'}}><Counter at={nearestBeatFrame(sec(8.6), beats)} to={30} suffix=" fps" size={format==='9:16'?100:70} /></div>
            </Card>
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              <CheckItem at={sec(9)} done={sec(10)} text="font too big" />
              <CheckItem at={sec(9.4)} done={sec(10.4)} text="music too loud" />
              <CheckItem at={sec(9.8)} done={sec(10.8)} text="motion not smooth" />
            </div>
          </Zone>
          <Credit at={sec(8.4)}>Example data</Credit>
        </Scene>
        {/* 4. Formula */}
        <Scene from={sec(12)} to={sec(15.2)}>
          <Zone name="top"><Headline level="h1" size={64} items={words('The formula', sec(12.2))} /></Zone>
          <Zone name="center"><StepCards at={sec(12.6)} steps={['Reference', 'Break down', 'Feedback']} vertical={format!=='9:16'} /></Zone>
        </Scene>
        {/* 5. CTA */}
        <Scene from={sec(15.2)} to={sec(17.6)}>
          <Zone name="top"><Headline level="h1" size={64} items={words('Want the full *style?*', sec(15.4))} /></Zone>
          <Zone name="center"><Callout at={nearestBeatFrame(sec(16), beats)} label="Comment" big="STYLE" note="we send you the file" /></Zone>
        </Scene>
        {/* 6. End card */}
        <Scene from={sec(17.6)} to={sec(30)} noOut>
          <EndCard at={sec(17.8)} handle={handle} line="Follow for more" />
        </Scene>
      </Camera>
      <MorphTransition at={sec(3.4)-11} holdBefore={10} holdAfter={50}
        from={{x:.86,y:.24,size:170,points:[[0,-1],[1,0],[0,1],[-1,0]],color:undefined}}
        to={{x:.76,y:.72,size:110,points:[[-1,-1],[1,-1],[1,1],[-1,1]],color:undefined}} />
      {audio && !mcDebug && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  </DebugCtx.Provider></FormatCtx.Provider>;
};
