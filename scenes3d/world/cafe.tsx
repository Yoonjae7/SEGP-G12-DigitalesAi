'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Blk, canvasTexture, Cyl, Flat, Sph } from '../kit';

/**
 * The campus café, on Wednesday morning. A counter and a menu board at the back, tall windows with the morning behind them,
 * a doorway on the left wall, a few tables, and pastel paper people in the queue. Metres, floor at y = 0, the counter at z = -3.
 * `mood` changes the light: morning (bright), soft (warmer, softer) and flat (grey, even).
 */
const CREAM = '#F6D9B8';
const WOOD = '#A9764E';
const TAN = '#C9A877';

function skyTexture() {
  return canvasTexture(256, 512, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 512);
    s.addColorStop(0, '#CFE8EF'); s.addColorStop(1, '#F1ECDA');
    g.fillStyle = s; g.fillRect(0, 0, 256, 512);
    // trees outside
    g.fillStyle = '#7C9A8F';
    [[40, 430, 90], [150, 450, 110], [230, 420, 70]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.45)';
    [[60, 90, 50], [190, 150, 36]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.6, 0, 0, Math.PI * 2); g.fill(); });
  });
}
function menuTexture() {
  return canvasTexture(512, 160, (g) => {
    g.fillStyle = '#10242B'; g.fillRect(0, 0, 512, 160);
    g.fillStyle = '#F4EEE3'; g.font = '700 54px Georgia, serif'; g.textBaseline = 'middle';
    g.fillText('Coffee', 24, 62); g.fillText('Tea', 218, 62); g.fillText('Toast', 340, 62);
    g.fillStyle = '#F0C75E'; g.fillRect(24, 106, 464, 4);
  });
}

function Window({ x, sky }: { x: number; sky: THREE.Texture }) {
  return (
    <group position={[x, 1.95, -3.58]}>
      <Flat size={[1.15, 1.9]} pos={[0, 0, 0.0]} map={sky} />
      <Blk size={[1.3, 0.09, 0.14]} pos={[0, 1.0, 0]} color={TAN} />
      <Blk size={[1.3, 0.09, 0.14]} pos={[0, -1.0, 0]} color={TAN} />
      <Blk size={[0.09, 2.0, 0.14]} pos={[-0.6, 0, 0]} color={TAN} />
      <Blk size={[0.09, 2.0, 0.14]} pos={[0.6, 0, 0]} color={TAN} />
      <Blk size={[0.06, 1.9, 0.1]} pos={[0, 0, 0]} color={TAN} />
      <Blk size={[1.15, 0.06, 0.1]} pos={[0, 0.1, 0]} color={TAN} />
    </group>
  );
}

function Table({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl r={0.55} h={0.06} pos={[0, 0.76, 0]} color="#3F6B4F" segs={28} />
      <Cyl r={0.05} h={0.72} pos={[0, 0.38, 0]} color="#2A2C2B" />
      <Cyl r={0.26} h={0.04} pos={[0, 0.02, 0]} color="#2A2C2B" />
      <Cyl r={0.07} h={0.1} pos={[0.1, 0.84, 0.05]} color="#F4EEE3" />
    </group>
  );
}
function Chair({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Blk size={[0.42, 0.06, 0.42]} pos={[0, 0.22, 0]} color="#B8864F" />
      <Blk size={[0.42, 0.5, 0.05]} pos={[0, 0.5, 0.2]} color="#B8864F" />
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([a, b]) => <Blk key={`${a}${b}`} size={[0.04, 0.2, 0.04]} pos={[a, 0.1, b]} color="#2A2C2B" line={0.01} />)}
    </group>
  );
}

/** A faceless pastel paper person waiting in the queue. */
function Extra({ x, z, color, h = 1.5 }: { x: number; z: number; color: string; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl r={0.2} h={h * 0.6} r2={0.17} pos={[0, h * 0.3, 0]} color={color} line={0.02} />
      <Sph r={0.17} pos={[0, h * 0.72, 0]} color={color} line={0.02} />
    </group>
  );
}

function Pendant({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl r={0.01} h={0.8} pos={[0, 2.9, 0]} color="#2A2C2B" line={false} />
      <Sph r={0.12} pos={[0, 2.5, 0]} scale={[1, 0.8, 1]} color="#F0C75E" glow="#FFD58A" glowI={1.1} />
      <pointLight position={[0, 2.35, 0]} color="#FFD9A0" intensity={1.0} distance={4.5} decay={1.6} />
    </group>
  );
}

export function CafeSet({ mood }: { mood: 'morning' | 'soft' | 'flat' }) {
  const { scene } = useThree();
  const sky = useMemo(skyTexture, []);
  const menu = useMemo(menuTexture, []);
  const steam = useRef<THREE.Group>(null);
  useEffect(() => { scene.background = new THREE.Color(mood === 'flat' ? '#D6DEE0' : '#F6D9B8'); scene.fog = null; }, [scene, mood]);
  useFrame(({ clock }) => { if (steam.current) steam.current.position.y = 1.55 + ((clock.elapsedTime * 0.12) % 0.3); });
  const amb = mood === 'morning' ? ['#FFF1DA', 0.95] as const : mood === 'soft' ? ['#FFF4E4', 1.05] as const : ['#E6EEF0', 1.1] as const;
  const key = mood === 'morning' ? ['#FFE2B0', 0.9] as const : mood === 'soft' ? ['#FFE8C4', 0.7] as const : ['#F1F6F7', 0.55] as const;
  return (
    <group>
      <ambientLight color={amb[0]} intensity={amb[1]} />
      <directionalLight color={key[0]} intensity={key[1]} position={[-3, 5, 3]} />
      {/* floor, with planks */}
      <Blk size={[9.4, 0.08, 7.6]} pos={[0, -0.04, -0.2]} color={mood === 'flat' ? '#CDBB9A' : '#D9B98C'} />
      {Array.from({ length: 15 }, (_, i) => -3.4 + i * 0.5).map((z) => <Blk key={z} size={[9.2, 0.006, 0.02]} pos={[0, 0.003, z]} color="#B99A6C" line={false} />)}
      {/* walls: the back wall, and the left wall with a doorway between z = -1.5 and z = -0.1 */}
      <Blk size={[9.4, 3.3, 0.12]} pos={[0, 1.65, -3.66]} color={CREAM} />
      <Blk size={[0.12, 3.3, 2.2]} pos={[-4.7, 1.65, -2.6]} color={CREAM} />
      <Blk size={[0.12, 3.3, 3.2]} pos={[-4.7, 1.65, 1.5]} color={CREAM} />
      <Blk size={[0.12, 1.2, 1.4]} pos={[-4.7, 2.7, -0.8]} color={CREAM} />
      <Blk size={[0.2, 2.1, 0.12]} pos={[-4.7, 1.05, -1.5]} color={TAN} />
      <Blk size={[0.2, 2.1, 0.12]} pos={[-4.7, 1.05, -0.1]} color={TAN} />
      <Flat size={[10, 4]} pos={[-5.6, 1.6, -0.8]} rot={[0, Math.PI / 2, 0]} color="#E8F1F2" />
      <Blk size={[1.3, 0.04, 1.4]} pos={[-4.65, 0.02, -0.8]} color="#B99A6C" line={0.01} />
      <Blk size={[9.4, 0.1, 7.6]} pos={[0, 3.3, -0.2]} color="#EADBC4" />
      {[-3.4, -1.4, 0.6].map((x) => <Window key={x} x={x} sky={sky} />)}
      {/* the counter, the machine, cups and the menu board */}
      <Blk size={[3.2, 1.0, 0.8]} pos={[2.6, 0.5, -3.1]} color={WOOD} />
      <Blk size={[3.3, 0.07, 0.95]} pos={[2.6, 1.03, -3.08]} color="#C99A66" />
      {[-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2].map((dx) => <Blk key={dx} size={[0.03, 0.8, 0.02]} pos={[2.6 + dx, 0.5, -2.69]} color="#8A5F3C" line={false} />)}
      <Blk size={[0.85, 0.5, 0.5]} pos={[3.3, 1.32, -3.25]} color="#8C9AA3" />
      <Blk size={[0.45, 0.14, 0.4]} pos={[3.3, 1.64, -3.25]} color="#5E6A72" />
      <Cyl r={0.1} h={0.05} pos={[3.3, 1.35, -2.98]} rot={[Math.PI / 2, 0, 0]} color="#2A2C2B" />
      {[1.7, 1.95, 2.2].map((x) => <Cyl key={x} r={0.06} h={0.11} pos={[x, 1.12, -3.0]} color="#F4EEE3" />)}
      <group ref={steam}><Sph r={0.05} pos={[1.95, 0, -3.0]} color="#FFFFFF" line={false} scale={[1, 1.5, 1]} /></group>
      <Blk size={[2.4, 0.8, 0.07]} pos={[2.6, 2.4, -3.56]} color="#10242B" />
      <Flat size={[2.3, 0.72]} pos={[2.6, 2.4, -3.51]} map={menu} />
      {/* the queue, the tables and the plants */}
      <Extra x={0.6} z={-2.35} color="#A9B7C2" />
      <Extra x={2.0} z={-2.35} color="#C9B8A6" h={1.6} />
      <Extra x={-0.1} z={-2.6} color="#8FA796" h={1.45} />
      <Table x={-2.0} z={-1.6} />
      <Chair x={-2.0} z={-2.2} rot={Math.PI} />
      <Chair x={-2.0} z={-1.0} />
      <Table x={-3.5} z={1.0} />
      <Chair x={-3.5} z={0.4} rot={Math.PI} />
      <Chair x={-3.5} z={1.6} />
      <Table x={3.2} z={0.6} />
      <Chair x={2.6} z={0.6} rot={-Math.PI / 2} />
      <Chair x={3.8} z={0.6} rot={Math.PI / 2} />
      {[[-4.2, -3.2], [4.2, -3.2], [4.2, 2.2]].map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Cyl r={0.2} h={0.35} r2={0.26} pos={[x, 0.18, z]} color="#B8864F" />
          <Sph r={0.38} pos={[x, 0.75, z]} color="#4F7F5E" scale={[1, 1.3, 1]} />
        </group>
      ))}
      {/* a rope barrier at the start of the queue */}
      {[-0.9, 0.5].map((x) => <Cyl key={x} r={0.03} h={0.9} pos={[x, 0.45, -0.3]} color="#2A2C2B" line={0.01} />)}
      {[-0.9, 0.5].map((x) => <Sph key={`b${x}`} r={0.06} pos={[x, 0.93, -0.3]} color="#F0C75E" line={0.01} />)}
      <Cyl r={0.012} h={1.4} pos={[-0.2, 0.82, -0.3]} rot={[0, 0, Math.PI / 2]} color="#3F6B4F" line={false} />
      <Pendant x={1.6} z={-2.4} />
      <Pendant x={3.4} z={-2.4} />
      <Pendant x={-2.0} z={-1.6} />
    </group>
  );
}

export const CafeMorning = () => <CafeSet mood="morning" />;
export const CafeSoft = () => <CafeSet mood="soft" />;
export const CafeFlat = () => <CafeSet mood="flat" />;
