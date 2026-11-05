'use client';

import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Blk, Cyl, Flat, Sph } from '../kit';
import { cityTexture } from './bus';

/**
 * Your dorm room, late at night. The window looks at a city with lit windows and a moon, a lamp glows on the desk,
 * and the phone throws a cold light. You sit on the foot of the bed, facing the wall. Metres, floor at y = 0.
 */
const WALL = '#1D3B46';
const WOOD = '#7A5F45';
const BOOKS = ['#6F8F72', '#B8864F', '#4F7080', '#CDBB84', '#8F5A48', '#E7DFCE', '#7C9A8F', '#C9A15B'];

function Window({ x }: { x: number }) {
  const city = useMemo(() => cityTexture(7, false), []);
  return (
    <group position={[x, 1.55, -2.78]}>
      <Flat size={[1.5, 1.5]} pos={[0, 0, 0.0]} map={city} />
      <Sph r={0.12} pos={[0.36, 0.42, 0.01]} scale={[1, 1, 0.1]} color="#CFE8EF" glow="#CFE8EF" glowI={1.4} line={false} />
      {/* frame and the cross */}
      <Blk size={[1.62, 0.07, 0.14]} pos={[0, 0.78, 0]} color="#2B4A56" />
      <Blk size={[1.62, 0.07, 0.14]} pos={[0, -0.78, 0]} color="#2B4A56" />
      <Blk size={[0.07, 1.6, 0.14]} pos={[-0.78, 0, 0]} color="#2B4A56" />
      <Blk size={[0.07, 1.6, 0.14]} pos={[0.78, 0, 0]} color="#2B4A56" />
      <Blk size={[0.05, 1.5, 0.1]} pos={[0, 0, 0]} color="#2B4A56" />
      <Blk size={[1.5, 0.05, 0.1]} pos={[0, 0.1, 0]} color="#2B4A56" />
      {/* curtains */}
      <Blk size={[0.42, 1.95, 0.14]} pos={[-1.08, -0.05, 0.12]} color="#17333D" />
      <Blk size={[0.42, 1.95, 0.14]} pos={[1.08, -0.05, 0.12]} color="#17333D" />
      <Blk size={[2.7, 0.05, 0.1]} pos={[0, 1.05, 0.12]} color="#4A4741" />
    </group>
  );
}

function Desk() {
  return (
    <group position={[1.45, 0, -2.3]}>
      <Blk size={[1.8, 0.06, 0.75]} pos={[0, 0.76, 0]} color={WOOD} />
      {[[-0.82, -0.3], [0.82, -0.3], [-0.82, 0.3], [0.82, 0.3]].map(([x, z]) => <Blk key={`${x}${z}`} size={[0.06, 0.74, 0.06]} pos={[x, 0.37, z]} color="#3B2D22" />)}
      {/* laptop, a mug, and the lamp */}
      <Blk size={[0.42, 0.02, 0.3]} pos={[-0.2, 0.8, 0.05]} color="#2A2C2B" />
      <Blk size={[0.42, 0.28, 0.02]} pos={[-0.2, 0.95, -0.1]} rot={[-0.18, 0, 0]} color="#2A2C2B" />
      <Cyl r={0.045} h={0.1} pos={[0.2, 0.84, 0.15]} color="#F4EEE3" />
      <Cyl r={0.1} h={0.03} pos={[0.65, 0.8, -0.1]} color="#2A2C2B" />
      <Cyl r={0.012} h={0.45} pos={[0.65, 1.02, -0.1]} rot={[0, 0, -0.35]} color="#2A2C2B" line={false} />
      <Cyl r={0.012} h={0.4} pos={[0.5, 1.28, -0.1]} rot={[0, 0, 1.1]} color="#2A2C2B" line={false} />
      <Blk size={[0.2, 0.08, 0.16]} pos={[0.34, 1.38, -0.1]} rot={[0, 0, -0.5]} color="#F0C75E" glow="#F0C75E" glowI={1.2} />
      <pointLight position={[0.3, 1.25, -0.05]} color="#FFD58A" intensity={2.4} distance={4} decay={1.6} />
      {/* the shelf above, with books, and two posters */}
      <Blk size={[1.7, 0.05, 0.28]} pos={[0, 1.7, -0.3]} color={WOOD} />
      {BOOKS.map((c, i) => <Blk key={i} size={[0.07, 0.2 + (i % 3) * 0.04, 0.2]} pos={[-0.7 + i * 0.1, 1.83 + (i % 3) * 0.02, -0.3]} color={c} line={0.012} />)}
      <Cyl r={0.07} h={0.1} pos={[0.76, 1.77, -0.3]} color="#B8864F" />
      <Sph r={0.1} pos={[0.76, 1.9, -0.3]} color="#4F7F5E" scale={[1, 1.2, 1]} />
      <Blk size={[0.5, 0.7, 0.03]} pos={[-0.35, 2.1, -0.4]} color="#E7DFCE" />
      <Sph r={0.13} pos={[-0.35, 2.18, -0.37]} color="#F0C75E" scale={[1, 1, 0.2]} line={false} />
      <Blk size={[0.4, 0.4, 0.03]} pos={[0.35, 2.05, -0.4]} color="#CDBB84" />
    </group>
  );
}

function Bed() {
  return (
    <group>
      <Blk size={[1.8, 0.14, 2.4]} pos={[-0.55, 0.07, 0.9]} color="#2A2F33" />
      <Blk size={[1.7, 0.2, 2.3]} pos={[-0.55, 0.24, 0.9]} color="#3E5B67" />
      <Blk size={[1.72, 0.07, 1.15]} pos={[-0.55, 0.38, 0.2]} color="#4F7080" />
      <Blk size={[0.9, 0.14, 0.4]} pos={[-0.55, 0.4, 1.85]} color="#8FA6AB" />
      <Blk size={[1.8, 0.7, 0.1]} pos={[-0.55, 0.4, 2.1]} color="#2A2F33" />
    </group>
  );
}

export function RoomSet() {
  const { scene } = useThree();
  useEffect(() => { scene.background = new THREE.Color('#0F2229'); scene.fog = new THREE.Fog('#0F2229', 6, 14); return () => { scene.fog = null; }; }, [scene]);
  return (
    <group>
      <ambientLight color="#8FB2C4" intensity={0.5} />
      <directionalLight color="#CFE8EF" intensity={0.35} position={[2, 4, 3]} />
      {/* the cold light of the phone, which the room gets from your hands */}
      <pointLight position={[-0.75, 0.9, -0.75]} color="#A8DDF0" intensity={0.7} distance={2.6} decay={1.8} />
      <Blk size={[4.9, 0.08, 5.4]} pos={[0, -0.04, -0.1]} color="#17333D" />
      <Blk size={[4.9, 2.7, 0.1]} pos={[0, 1.35, -2.85]} color={WALL} />
      <Blk size={[0.1, 2.7, 5.4]} pos={[-2.45, 1.35, -0.1]} color="#21424E" />
      <Blk size={[0.1, 2.7, 5.4]} pos={[2.45, 1.35, -0.1]} color="#21424E" />
      <Blk size={[4.9, 0.08, 5.4]} pos={[0, 2.7, -0.1]} color="#1A353F" />
      <Blk size={[4.8, 0.12, 0.05]} pos={[0, 0.06, -2.78]} color="#10242B" line={0.01} />
      <Window x={-1.2} />
      <Desk />
      <Bed />
      {/* a rug */}
      <Blk size={[1.8, 0.015, 1.2]} pos={[0.5, 0.01, -0.9]} color="#4F7080" line={0.01} />
    </group>
  );
}
