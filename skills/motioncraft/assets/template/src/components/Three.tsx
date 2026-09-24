// Real WebGL 3D (never CSS fake 3D). Lighting + materials come from tokens.
import React, {useEffect, useMemo} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {S} from '../lib/tokens';
import {cl, spr} from '../lib/anim';
const L = S.three;

const Env: React.FC = () => { const {gl, scene} = useThree(); useEffect(() => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.NoToneMapping; const pm = new THREE.PMREMGenerator(gl); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; }, [gl, scene]); return null; };
export const Lights: React.FC = () => <><Env /><ambientLight intensity={L.ambient} /><directionalLight position={L.key.pos as [number, number, number]} intensity={L.key.intensity} /><directionalLight position={L.fill.pos as [number, number, number]} intensity={L.fill.intensity} color="#cfe0ff" /></>;
export const Mat: React.FC<{color: string}> = ({color}) => <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={L.material.emissive} roughness={L.material.roughness[0] + 0.08} clearcoat={L.material.clearcoat} />;

// Extruded logo from an SVG path string (use the brand's REAL logo path).
export const Logo3D: React.FC<{svg: string; at: number; size?: number; depth?: number; color?: string; spin?: number}> = ({svg, at, size = 520, depth = 100, color = S.color.object3d[0], spin = 1}) => {
  const f = useCurrentFrame(); const s = spr(f, at, S.motion.logo3d.spring);
  const geo = useMemo(() => {
    const data = new SVGLoader().parse(svg); const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
    const g = new THREE.ExtrudeGeometry(shapes, {depth, bevelEnabled: true, bevelThickness: 16, bevelSize: 14, bevelSegments: 9, curveSegments: 24});
    g.center(); g.computeBoundingBox(); const bb = g.boundingBox!; const k = 900 / Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y); g.scale(k, -k, k); return g;
  }, [svg, depth]);
  const ry = (1 - s) * Math.PI * 1.2 * spin + Math.sin((f - at) / 40) * 0.12; const fl = Math.sin((f - at) / 26) * 14;
  return <div style={{width: size, height: size, opacity: Math.min(1, s * 2)}}>
    <ThreeCanvas width={size} height={size} gl={{alpha: true, antialias: true}} camera={{position: [0, 0, 2200], fov: 26, near: 10, far: 6000}}>
      <Lights /><group scale={0.6 + 0.4 * s} position={[0, fl, 0]} rotation={[0.18 * (1 - s) + 0.08, ry, 0]}><mesh geometry={geo}><Mat color={color} /></mesh></group>
    </ThreeCanvas>
  </div>;
};

// Mochi mascot: soft white body, glossy eyes, blush. Bounces + blinks. happy = smiling eyes (end card).
const MochiMesh: React.FC<{blink: number; squash: number; happy?: boolean}> = ({blink, squash, happy}) => {
  const body = useMemo(() => { const g = new THREE.SphereGeometry(200, 96, 64); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); let y = p.getY(i); const z = p.getZ(i); if (y < -110) y = -110 - (y + 110) * 0.35; p.setXYZ(i, x * 1.1, y * 0.92 + 20, z * 0.95); }
    g.computeVertexNormals(); return g; }, []);
  return <group scale={[1 + squash * 0.06, 1 - squash * 0.08, 1]}>
    <mesh geometry={body}><meshPhysicalMaterial color="#fffaf3" emissive="#fff4ea" emissiveIntensity={0.28} roughness={0.7} sheen={1} sheenRoughness={0.5} sheenColor="#ffffff" clearcoat={0.15} /></mesh>
    {[-1, 1].map((sd) => <group key={sd}>
      {happy ? <mesh position={[sd * 70, 40, 184]}><torusGeometry args={[19, 6.5, 16, 32, Math.PI]} /><meshPhysicalMaterial color="#1a1a1f" roughness={0.3} clearcoat={1} /></mesh>
        : <mesh position={[sd * 70, 40, 180]} scale={[1, 1.25 * (1 - blink * 0.9), 0.6]}><sphereGeometry args={[22, 32, 32]} /><meshPhysicalMaterial color="#141418" roughness={0.15} clearcoat={1} /></mesh>}
      <mesh position={[sd * 118, 0, 165]} scale={[1.5, 0.8, 0.3]} rotation={[0, sd * 0.5, 0]}><sphereGeometry args={[20, 32, 32]} /><meshStandardMaterial color="#ff9f9f" roughness={0.9} transparent opacity={0.55} /></mesh>
    </group>)}
    <mesh position={[0, 12, 194]} rotation={[0, 0, Math.PI]}><torusGeometry args={[12, 3.6, 12, 24, Math.PI]} /><meshStandardMaterial color="#1a1a1f" roughness={0.5} /></mesh>
  </group>;
};
export const Mascot: React.FC<{at: number; size?: number; happy?: boolean}> = ({at, size = 260, happy}) => {
  const f = useCurrentFrame(); const s = spr(f, at, {damping: 9, stiffness: 150, mass: 0.8});
  const bounce = Math.abs(Math.sin((f - at) / 11)) * 0.5; const blink = interpolate((f - at) % 75, [60, 63, 66], [0, 1, 0], cl);
  return <div style={{width: size, height: size * 0.8, transform: `scale(${s})`, opacity: Math.min(1, s * 2)}}>
    <ThreeCanvas width={size} height={size * 0.8} gl={{alpha: true, antialias: true}} camera={{position: [0, 40, 1500], fov: 17, near: 10, far: 6000}}>
      <Lights /><group rotation={[0.12, -0.22 + Math.sin((f - at) / 30) * 0.12, 0]} position={[0, -20 + bounce * 20, 0]}><MochiMesh happy={happy} blink={blink} squash={bounce * 0.6} /></group>
    </ThreeCanvas>
  </div>;
};

// Field of soft pastel objects floating in (hook/opening). Deterministic positions.
export const FloatingShapes: React.FC<{at: number; count?: number; w?: number; h?: number; clearX?: number; clearY?: number}> = ({at, count = 14, w = 1920, h = 1080, clearX = 950, clearY = 430}) => {
  const f = useCurrentFrame(); const cols = S.color.object3d;
  // Objects stay OUT of the central text area (ellipse clearX x clearY) so they never sit on the headline.
  const items = useMemo(() => Array.from({length: count}, (_, i) => { const a = (i * 137.5) * Math.PI / 180, r = 1 + (i % 4) * 0.28;
    const x = Math.cos(a) * clearX * r, y = Math.sin(a) * clearY * r; return {x, y, z: -200 - (i % 5) * 120, kind: i % 4, c: cols[i % 4], d: i * 2}; }), [count, cols, clearX, clearY]);
  const rb = useMemo(() => new RoundedBoxGeometry(150, 150, 150, 6, 26), []);
  return <ThreeCanvas width={w} height={h} gl={{alpha: true, antialias: true}} camera={{position: [0, 0, 1800], fov: 40, near: 10, far: 8000}}>
    <Lights />
    {items.map((it, i) => { const s = spr(f, at + it.d, {damping: 12, stiffness: 90, mass: 1}); const t = (f - at) / 30;
      return <group key={i} position={[it.x, it.y + Math.sin(t + i) * 18, it.z]} rotation={[t * 0.3 + i, t * 0.4 + i * 0.5, 0]} scale={s}>
        {it.kind === 0 && <mesh geometry={rb}><Mat color={it.c} /></mesh>}
        {it.kind === 1 && <mesh><torusGeometry args={[70, 30, 32, 64]} /><Mat color={it.c} /></mesh>}
        {it.kind === 2 && <mesh><capsuleGeometry args={[40, 90, 12, 24]} /><Mat color={it.c} /></mesh>}
        {it.kind === 3 && <mesh><sphereGeometry args={[70, 48, 48]} /><Mat color={it.c} /></mesh>}
      </group>; })}
  </ThreeCanvas>;
};
