'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE from 'three';
import { characterModel } from './characters';
import { loadLayers, type Layer } from './layers';
import { SPEC } from './spec';
import { CAMERA, charactersFor, FOCUS, LIGHT, SLOTS } from './sets';
import type { CharId } from './types';

/**
 * The 3D stage. The 2D scene's paper layers hang in space at their depths. Clay people stand between them.
 * The camera moves with the pointer or device tilt, and slowly per scene (push-in, pan, sway).
 * One <Canvas>, dpr capped at 1.5, no real-time shadows (people get baked contact blobs), no post-processing.
 */
const FOV = 30;
const D = 4.5 / Math.tan((FOV / 2) * (Math.PI / 180)); // camera distance so the frame is 9 units tall at z = 0
const Z = 5; // total depth of the stack of layers

export interface Override { speaker: string; pose?: string; expression?: string }
interface Props { art: string; override: Override | null; reduced: boolean; onReady: () => void; onFail: (why: string) => void }

export default function Stage3D(props: Props) {
  return (
    <div className="art stage3d" aria-hidden="true">
      <Canvas flat dpr={[1, 1.5]} shadows={false} frameloop="always" gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: FOV, position: [0, 0, D], near: 1, far: 100 }} style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.domElement.addEventListener('webglcontextlost', () => props.onFail('context lost')); }}>
        <World key={props.art} {...props} />
      </Canvas>
    </div>
  );
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function World({ art, override, reduced, onReady, onFail }: Props) {
  const [layers, setLayers] = useState<Layer[] | null>(null);
  const { size } = useThree();
  const aspect = size.width / size.height;
  const portrait = aspect < 16 / 9 - 0.01;
  const visW = 9 * aspect;
  const cx = portrait ? Math.max(-(8 - visW / 2), Math.min(8 - visW / 2, ((FOCUS[art] ?? 800) - 800) / 100)) : 0; // rest position of the camera
  const light = LIGHT[art] ?? LIGHT.s1;

  useEffect(() => {
    let live = true;
    loadLayers(art).then((l) => { if (live) { setLayers(l); onReady(); } }).catch(() => live && onFail('layers'));
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art]);

  // pointer or tilt
  const ptr = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => { ptr.current.tx = e.clientX / window.innerWidth - 0.5; ptr.current.ty = e.clientY / window.innerHeight - 0.5; };
    const onTilt = (e: DeviceOrientationEvent) => { if (e.gamma == null || e.beta == null) return; ptr.current.tx = Math.max(-0.5, Math.min(0.5, e.gamma / 60)); ptr.current.ty = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 90)); };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('deviceorientation', onTilt); };
  }, [reduced]);

  const slides = useRef<(THREE.Object3D | null)[]>([]);
  const t0 = useRef<number | null>(null);
  const mode = CAMERA[art] ?? 'hold';

  useFrame(({ camera, clock }, dt) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = clock.elapsedTime - t0.current;
    const p = ptr.current;
    const k = 1 - Math.exp(-dt * 5);
    p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
    let x = cx, z = D, rz = 0;
    if (!reduced) {
      x += p.x * 0.7;
      if (mode === 'push') z = D * (1 - 0.06 * ease(t / 12));
      if (mode === 'pan' && !portrait) x += -3.2 + 6.4 * ease(t / 9);
      if (mode === 'sway') rz = Math.sin((t * Math.PI * 2) / 5) * 0.01;
    }
    camera.position.set(x, -p.y * 0.35 * (reduced ? 0 : 1), z);
    camera.rotation.z = rz;
    // the paper-slide: far layers move least, near layers most, over 420 ms
    const e = reduced ? 1 : ease(t / 0.42);
    slides.current.forEach((o, i) => { if (o && layers) o.position.x = layers[i].depth * 1.4 * (1 - e) + 0.18 * (1 - e); });
  });

  const place = (depth: number, xpx: number, ypx: number) => {
    const z = (depth - 0.5) * Z;
    const sf = (D - z) / D;
    return { z, sf, pos: [((xpx - 800) / 100) * sf + cx * (1 - sf), ((450 - ypx) / 100) * sf, z] as [number, number, number] };
  };

  const slots = SLOTS[art] ?? {};
  const people = charactersFor(art);

  return (
    <>
      <ambientLight color={light.ambient} intensity={0.55 * (light.ambI / 1.5)} />
      <directionalLight color={light.key} intensity={0.8 * (light.keyI / 1.5)} position={[-5, 7, 9]} />
      {layers?.map((l, i) => {
        const z = (l.depth - 0.5) * Z, sf = (D - z) / D;
        return (
          <group key={i} ref={(o) => { slides.current[i] = o; }}>
            <mesh position={[cx * (1 - sf), 0, z]} scale={[sf, sf, 1]} renderOrder={i}>
              <planeGeometry args={[16, 9]} />
              <meshBasicMaterial map={l.tex} transparent toneMapped={false} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
      {layers
        ? people.map((c) => {
            const slot = SLOTS[art]?.[c.id as CharId] ?? slots[c.id as CharId];
            if (!slot) return null;
            const C = SPEC[c.id];
            const { pos, sf } = place(slot.depth, slot.x, slot.y);
            const Model = characterModel(c.id as CharId);
            const speaking = override && override.speaker === c.id;
            const s = ((slot.scale * C.ht) / 100) * sf;
            return (
              <group key={c.id} position={pos} scale={[s, s, s]}>
                <Model id={c.id as CharId} pose={(speaking && override!.pose) || c.pose} expression={(speaking && override!.expression) || c.expression || 'calm'} view={c.view} yaw={slot.yaw} />
              </group>
            );
          })
        : null}
    </>
  );
}
