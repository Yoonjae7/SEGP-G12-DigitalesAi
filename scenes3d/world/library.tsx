'use client';

import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Blk, canvasTexture, Cyl, Flat, Sph } from '../kit';

/**
 * The library steps, two days later. A stone front with columns, four wide steps down to a path, a bench, two trees and a lamp post.
 * `mood` is the light: warm (low sun, the good ending) or grey (flat, the other one). Metres, the path at z = 1, the doors at z = -3.
 */
const STONE = '#D9CFBB';
const STONE_DK = '#B7AD97';

function skyTexture(mood: 'warm' | 'grey') {
  return canvasTexture(16, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    if (mood === 'warm') { s.addColorStop(0, '#9CC7D8'); s.addColorStop(0.7, '#F6D9B8'); s.addColorStop(1, '#F0C75E'); }
    else { s.addColorStop(0, '#B9C6CC'); s.addColorStop(1, '#DCE4E7'); }
    g.fillStyle = s; g.fillRect(0, 0, 16, 256);
  });
}
function signTexture() {
  return canvasTexture(512, 96, (g) => {
    g.fillStyle = '#10242B'; g.fillRect(0, 0, 512, 96);
    g.fillStyle = '#F4EEE3'; g.font = '700 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('L I B R A R Y', 256, 50);
  });
}

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl r={0.14} h={1.5} r2={0.1} pos={[0, 0.75, 0]} color="#6E5A44" />
      <Sph r={0.9} pos={[0, 2.1, 0]} color="#5E8A68" scale={[1, 1.15, 1]} />
      <Sph r={0.6} pos={[0.55, 1.7, 0.2]} color="#6F9C78" />
    </group>
  );
}

export function LibrarySet({ mood }: { mood: 'warm' | 'grey' }) {
  const { scene } = useThree();
  const sky = useMemo(() => skyTexture(mood), [mood]);
  const sign = useMemo(signTexture, []);
  useEffect(() => { scene.background = new THREE.Color(mood === 'warm' ? '#F6D9B8' : '#C7D3D9'); scene.fog = new THREE.Fog(mood === 'warm' ? '#F6D9B8' : '#C7D3D9', 12, 26); return () => { scene.fog = null; }; }, [scene, mood]);
  const warm = mood === 'warm';
  return (
    <group>
      <ambientLight color={warm ? '#FFE9C0' : '#C7D3D9'} intensity={warm ? 0.85 : 1.25} />
      <directionalLight color={warm ? '#FFC980' : '#DFE8EC'} intensity={warm ? 1.5 : 0.75} position={warm ? [-5, 2.2, 3] : [-2, 6, 4]} />
      <Flat size={[40, 18]} pos={[0, 6, -12]} map={sky} />
      {/* ground, the path and the grass */}
      <Blk size={[30, 0.1, 16]} pos={[0, -0.05, 0]} color={warm ? '#8FA669' : '#8A9E88'} />
      <Blk size={[7.4, 0.02, 9]} pos={[0, 0.005, 2.5]} color="#CBBFA6" line={0.01} />
      {/* the front of the library */}
      <Blk size={[8.6, 4.2, 0.8]} pos={[0, 2.1, -3.7]} color={STONE} />
      <Blk size={[9.0, 0.35, 1.1]} pos={[0, 4.3, -3.55]} color={STONE_DK} />
      <Blk size={[3.4, 0.5, 0.9]} pos={[0, 4.75, -3.5]} color={STONE_DK} />
      <Flat size={[3.0, 0.56]} pos={[0, 4.3, -2.98]} map={sign} />
      <Blk size={[1.5, 2.3, 0.14]} pos={[0, 1.15, -3.25]} color="#3B2D22" />
      <Blk size={[1.7, 0.12, 0.2]} pos={[0, 2.35, -3.2]} color={STONE_DK} />
      {[-3.4, -2.3, -1.2, 1.2, 2.3, 3.4].map((x) => <Cyl key={x} r={0.22} h={3.6} pos={[x, 1.9, -2.9]} color={STONE} segs={16} />)}
      {[-3.4, -2.3, -1.2, 1.2, 2.3, 3.4].map((x) => <Blk key={`b${x}`} size={[0.6, 0.18, 0.6]} pos={[x, 0.09, -2.9]} color={STONE_DK} line={0.015} />)}
      {[-2.9, 2.9].map((x) => <Blk key={`w${x}`} size={[0.9, 1.7, 0.08]} pos={[x, 2.2, -3.25]} color="#2B4A56" />)}
      {/* four wide steps, the top one nearest the doors */}
      {[0, 1, 2, 3].map((i) => <Blk key={i} size={[7.6, 0.17 * (4 - i), 0.7]} pos={[0, 0.085 * (4 - i), -2.4 + i * 0.7]} color={i % 2 ? STONE : '#E4DAC6'} line={0.02} />)}
      {/* a bench, two trees and a lamp post */}
      <group position={[3.0, 0, 0.9]}>
        <Blk size={[1.3, 0.07, 0.45]} pos={[0, 0.2, 0]} color="#7A5F45" />
        <Blk size={[1.3, 0.4, 0.06]} pos={[0, 0.5, 0.22]} color="#7A5F45" />
        {[-0.55, 0.55].map((x) => <Blk key={x} size={[0.06, 0.2, 0.4]} pos={[x, 0.1, 0]} color="#2A2C2B" line={0.01} />)}
      </group>
      <Tree x={-5.0} z={-0.5} />
      <Tree x={5.4} z={-1.6} />
      <group position={[-3.2, 0, 1.2]}>
        <Cyl r={0.05} h={2.6} pos={[0, 1.3, 0]} color="#2A2C2B" />
        <Sph r={0.2} pos={[0, 2.7, 0]} color="#F0C75E" glow="#FFD58A" glowI={warm ? 0.5 : 0.9} />
      </group>
    </group>
  );
}

export const LibraryWarm = () => <LibrarySet mood="warm" />;
export const LibraryGrey = () => <LibrarySet mood="grey" />;
