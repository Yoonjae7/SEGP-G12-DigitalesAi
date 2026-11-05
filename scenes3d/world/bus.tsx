'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Blk, canvasTexture, Cyl, Flat, rng } from '../kit';

/**
 * The last bus home, at night. Passengers face the front (-z). The camera mostly sits near the front and looks back,
 * so the faces are toward us. Windows show a city sliding by, and street lamps sweep light across the faces.
 * Metres. Floor at y = 0. Seat cushions are low because the clay people have short legs.
 */
const W = 1.6; // half width of the bus
const LEN = 9; // length
const SEAT = '#2F6F86';
const SEAT_DK = '#1D4757';
const WALL = '#CFC5AE';
const YELLOW = '#E8B93C';

/** A night city drawn once and slid sideways: dark blocks, lit windows, soft street-lamp glows. */
function cityTexture(seed: number, far: boolean) {
  const r = rng(seed);
  return canvasTexture(1024, 256, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, far ? '#0B1B26' : '#0A1822');
    sky.addColorStop(1, far ? '#1D3B46' : '#16303B');
    g.fillStyle = sky; g.fillRect(0, 0, 1024, 256);
    let x = 0;
    while (x < 1024) {
      const w = 40 + r() * 90, h = (far ? 60 : 90) + r() * (far ? 80 : 120);
      g.fillStyle = far ? '#14303B' : '#0F242D';
      g.fillRect(x, 256 - h, w, h);
      for (let wy = 256 - h + 12; wy < 244; wy += 20) for (let wx = x + 8; wx < x + w - 10; wx += 17) {
        if (r() < 0.38) { g.fillStyle = r() < 0.8 ? '#F0C75E' : '#CFE8EF'; g.globalAlpha = 0.75; g.fillRect(wx, wy, 8, 11); g.globalAlpha = 1; }
      }
      x += w + 6 + r() * 20;
    }
    // street lamps: soft glows
    for (let i = 0; i < 9; i++) {
      const gx = r() * 1024, gy = 150 + r() * 80;
      const gr = g.createRadialGradient(gx, gy, 0, gx, gy, 22 + r() * 18);
      gr.addColorStop(0, 'rgba(255,214,140,.95)'); gr.addColorStop(1, 'rgba(255,214,140,0)');
      g.fillStyle = gr; g.fillRect(gx - 50, gy - 50, 100, 100);
    }
  }, true);
}

function Window({ side }: { side: -1 | 1 }) {
  const x = side * W;
  const far = useMemo(() => cityTexture(side === -1 ? 11 : 23, true), [side]);
  const near = useMemo(() => cityTexture(side === -1 ? 41 : 57, false), [side]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const dir = side === -1 ? 1 : -1;
    far.offset.x = (t * 0.012 * dir) % 1;
    near.offset.x = (t * 0.034 * dir) % 1;
  });
  const faceY = side === -1 ? Math.PI / 2 : -Math.PI / 2; // planes face into the bus
  return (
    <group>
      {/* the scenery outside: a far layer and a nearer, faster one */}
      <Flat size={[14, 3.4]} pos={[x * 2.5, 1.45, 0]} rot={[0, faceY, 0]} map={far} />
      <Flat size={[11, 2.2]} pos={[x * 1.75, 1.05, 0]} rot={[0, faceY, 0]} map={near} opacity={0.92} />
      {/* wall below the windows, the strip above, and pillars between */}
      <Blk size={[0.12, 0.78, LEN]} pos={[x, 0.39, 0]} color={WALL} />
      <Blk size={[0.14, 0.46, LEN]} pos={[x, 1.92, 0]} color="#B7AD97" />
      {Array.from({ length: 10 }, (_, i) => -4.5 + i * 1.0).map((z) => (
        <Blk key={z} size={[0.14, 1.02, 0.09]} pos={[x, 1.28, z]} color="#B7AD97" />
      ))}
      {/* window sill and a little ad strip */}
      <Blk size={[0.2, 0.05, LEN]} pos={[x - side * 0.04, 0.8, 0]} color="#8E8670" />
      <Blk size={[0.04, 0.2, 2.6]} pos={[x - side * 0.08, 2.0, -1.6]} color="#E5502B" line={0.012} />
      <Blk size={[0.04, 0.2, 2.6]} pos={[x - side * 0.08, 2.0, 1.8]} color="#F0C75E" line={0.012} />
      <Flat size={[LEN, 1.0]} pos={[x - side * 0.02, 1.28, 0]} rot={[0, faceY, 0]} color="#9CC7D8" opacity={0.07} />
    </group>
  );
}

/** A block of two seats, facing the front. */
function Seats({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Blk size={[1.18, 0.14, 0.52]} pos={[0, 0.07, 0]} color={SEAT_DK} />
      <Blk size={[1.18, 0.1, 0.58]} pos={[0, 0.17, -0.02]} color={SEAT} />
      <Blk size={[1.18, 0.74, 0.1]} pos={[0, 0.54, 0.31]} rot={[-0.07, 0, 0]} color={SEAT} />
      <Blk size={[1.04, 0.2, 0.08]} pos={[0, 0.98, 0.33]} rot={[-0.07, 0, 0]} color="#E5502B" />
      <Blk size={[0.02, 0.5, 0.12]} pos={[0, 0.5, 0.31]} color={SEAT_DK} line={false} />
    </group>
  );
}

function Pole({ x, z }: { x: number; z: number }) {
  return <Cyl r={0.025} h={2.15} pos={[x, 1.07, z]} color={YELLOW} line={0.012} segs={10} />;
}

/** Street lamps outside sweep warm light through the windows, and across the faces. */
function Lamps() {
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = (t * 0.22) % 1; // one lamp every four and a half seconds
    const z = 5 - p * 10;
    if (a.current) { a.current.position.set(-3.2, 1.8, z); a.current.intensity = 3.6 * Math.sin(p * Math.PI); }
    const q = (t * 0.22 + 0.5) % 1;
    if (b.current) { b.current.position.set(3.2, 1.8, 5 - q * 10); b.current.intensity = 2.4 * Math.sin(q * Math.PI); }
  });
  return (
    <>
      <pointLight ref={a} color="#FFC77A" distance={6} decay={1.6} />
      <pointLight ref={b} color="#FFB45E" distance={6} decay={1.6} />
    </>
  );
}

export function BusSet() {
  const rows = [0, 1, 2, 3]; // the front of the bus is open floor, so the camera has a clear view back at the people
  const sway = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // the bus rocks very slightly: a slow roll and a tiny bump
    if (sway.current) { sway.current.rotation.z = Math.sin(t * 0.9) * 0.004; sway.current.position.y = Math.sin(t * 2.3) * 0.004; }
  });
  const { scene } = useThree();
  useEffect(() => { scene.background = new THREE.Color('#0A1822'); scene.fog = new THREE.Fog('#0A1822', 7, 15); return () => { scene.fog = null; }; }, [scene]);
  return (
    <group ref={sway}>
      <ambientLight color="#9FB6C4" intensity={0.55} />
      <directionalLight color="#FFE9C2" intensity={0.55} position={[1.5, 3, 2]} />
      {[-2.6, 0, 2.6].map((z) => <pointLight key={z} position={[0, 1.95, z]} color="#FFE7B0" intensity={1.5} distance={5} decay={1.5} />)}
      <Lamps />

      {/* floor, ceiling and the far end */}
      <Blk size={[W * 2, 0.08, LEN]} pos={[0, -0.04, 0]} color="#3D434A" />
      <Blk size={[0.55, 0.012, LEN]} pos={[0, 0.002, 0]} color="#565D65" line={false} />
      <Blk size={[0.04, 0.012, LEN]} pos={[-0.32, 0.01, 0]} color={YELLOW} line={false} />
      <Blk size={[0.04, 0.012, LEN]} pos={[0.32, 0.01, 0]} color={YELLOW} line={false} />
      <Blk size={[W * 2, 0.08, LEN]} pos={[0, 2.19, 0]} color="#D9D1BE" />
      <Blk size={[W * 2, 2.2, 0.1]} pos={[0, 1.1, LEN / 2]} color="#B7AD97" />
      <Blk size={[1.4, 0.7, 0.04]} pos={[0, 1.4, LEN / 2 - 0.08]} color="#16303B" line={0.012} />
      {/* ceiling lights and rails */}
      {[-0.85, 0.85].map((x) => <Blk key={x} size={[0.2, 0.03, LEN - 1]} pos={[x, 2.13, 0]} color="#FFF3C8" glow="#FFF3C8" glowI={1.6} line={false} />)}
      {[-0.32, 0.32].map((x) => <Cyl key={x} r={0.022} h={LEN - 0.4} pos={[x, 1.95, 0]} rot={[Math.PI / 2, 0, 0]} color={YELLOW} line={0.01} segs={10} />)}

      <Window side={-1} />
      <Window side={1} />

      {rows.map((z) => (
        <group key={z}>
          <Seats x={-0.9} z={z} />
          <Seats x={0.9} z={z} />
        </group>
      ))}
      {/* poles at the aisle end of every second seat, behind the people */}
      {[1, 3].map((z) => (
        <group key={z}>
          <Pole x={-0.32} z={z + 0.5} />
          <Pole x={0.32} z={z + 0.5} />
        </group>
      ))}
      {/* a stop button and a small sign near the back */}
      <Blk size={[0.06, 0.1, 0.04]} pos={[0.32, 1.35, 3.5]} color="#E5502B" glow="#E5502B" glowI={0.8} line={0.01} />
    </group>
  );
}
