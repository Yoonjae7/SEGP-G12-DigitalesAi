'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { faceTexture, FACE_SIZE } from '../face';
import { POSES, SPEC } from '../spec';
import type { CharacterModelProps } from '../types';

/**
 * A matte clay person built from primitives: capsule limbs, squashed sphere head, small sphere hands.
 * Toon shading in three steps. A thin ink outline from an inverted hull (the same shape, scaled up, drawn inside out).
 * Poses are joint tables from the shared pose table. Faces are textures. No external rig and no model files.
 * Units: 1u = 1/96 of a standard figure, y up, feet at 0. The parent scales it to the scene.
 */
const INK = '#1C1B19';
const OUTLINE = 0.7; // outline thickness in u

const toon = (() => {
  const t = new THREE.DataTexture(new Uint8Array([85, 160, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

type Kind = 'sphere' | 'capsule' | 'box' | 'cyl' | 'torus' | 'cone';
function Geo({ kind, args }: { kind: Kind; args: number[] }) {
  switch (kind) {
    case 'sphere': return <sphereGeometry args={[1, 28, 20]} />;
    case 'capsule': return <capsuleGeometry args={[args[0], args[1], 5, 14]} />;
    case 'box': return <boxGeometry args={args as [number, number, number]} />;
    case 'cyl': return <cylinderGeometry args={[args[0], args[1], args[2], 18]} />;
    case 'torus': return <torusGeometry args={[args[0], args[1], 8, 28]} />;
    default: return <coneGeometry args={[args[0], args[1], 10]} />;
  }
}

interface PartProps { kind: Kind; args?: number[]; color: string; pos?: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; hull?: boolean }
function Part({ kind, args = [1], color, pos, scale = 1, rot, hull = true }: PartProps) {
  const s: [number, number, number] = typeof scale === 'number' ? [scale, scale, scale] : scale;
  // thickness stays about the same on big and small parts
  const out: [number, number, number] =
    kind === 'sphere' ? (s.map((v) => 1 + OUTLINE / v) as [number, number, number]) : (() => { const r = kind === 'box' ? Math.min(...args) / 2 : args[0] || 1; const k = 1 + OUTLINE / r; return [k, k, k] as [number, number, number]; })();
  return (
    <group position={pos} rotation={rot} scale={s}>
      <mesh><Geo kind={kind} args={args} /><meshToonMaterial color={color} gradientMap={toon} /></mesh>
      {hull ? <mesh scale={out} material={inkMat}><Geo kind={kind} args={args} /></mesh> : null}
    </group>
  );
}

const rad = (d: number) => (d * Math.PI) / 180;
type Joints = { L: [number, number]; R: [number, number]; lean: number; tilt: number; pitch: number; rise: number; drop: number; stance: number; yaw: number };
const toJoints = (name: string, yaw?: number): Joints => {
  const base = POSES['idle-breathe'];
  const p = { ...base, ...(POSES[name] ?? {}) };
  return { L: p.L, R: p.R, lean: p.lean, tilt: p.tilt, pitch: p.pitch, rise: p.rise, drop: p.drop, stance: p.stance, yaw: yaw ?? p.yaw };
};

export function ClayCharacter({ id, pose, expression, view, yaw }: CharacterModelProps) {
  const C = SPEC[id];
  const wf = C.wf, hf = C.hf;
  const target = useMemo(() => toJoints(pose, yaw), [pose, yaw]);
  const cur = useRef<Joints>(JSON.parse(JSON.stringify(target)));
  const root = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const headG = useRef<THREE.Group>(null);
  const shL = useRef<THREE.Group>(null), elL = useRef<THREE.Group>(null), shR = useRef<THREE.Group>(null), elR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null), legR = useRef<THREE.Group>(null);
  const face = useMemo(() => faceTexture(id, expression), [id, expression]);

  // Joints ease toward the pose in about half a second (400 to 600 ms).
  useFrame((st, dt) => {
    const k = 1 - Math.exp(-dt * 6.5);
    const c = cur.current, t = target;
    const mv = (a: number, b: number) => a + (b - a) * k;
    c.L = [mv(c.L[0], t.L[0]), mv(c.L[1], t.L[1])]; c.R = [mv(c.R[0], t.R[0]), mv(c.R[1], t.R[1])];
    (['lean', 'tilt', 'pitch', 'rise', 'drop', 'stance', 'yaw'] as const).forEach((n) => { c[n] = mv(c[n], t[n]); });
    if (shL.current) shL.current.rotation.z = -rad(c.L[0]);
    if (elL.current) elL.current.rotation.z = -rad(c.L[1]);
    if (shR.current) shR.current.rotation.z = rad(c.R[0]);
    if (elR.current) elR.current.rotation.z = rad(c.R[1]);
    if (shL.current) shL.current.position.y = 64 - 30 + c.rise - 3; // shoulders
    if (shR.current) shR.current.position.y = 64 - 30 + c.rise - 3;
    if (upper.current) { upper.current.rotation.z = -rad(c.lean); upper.current.position.y = 30 - c.drop; }
    if (headG.current) { headG.current.rotation.z = -rad(c.tilt); headG.current.rotation.x = c.pitch * 0.2; }
    if (legL.current) legL.current.position.x = -(5.2 * Math.min(1.25, wf) + c.stance);
    if (legR.current) legR.current.position.x = 5.2 * Math.min(1.25, wf) + c.stance;
    if (root.current) {
      const turn = view === 'back' ? Math.PI : view === 'side' ? Math.PI / 2 : 0;
      root.current.rotation.y = turn + c.yaw * 0.9;
      const breathe = pose === 'idle-breathe' ? 1 + 0.012 * Math.sin(st.clock.elapsedTime * 2.6) : 1;
      root.current.scale.set(1, breathe, 1);
    }
  });

  const tw = 14.2 * wf, bw = (C.coat ? 19.5 : 15.2) * wf;
  const sleeve = C.top;
  const arm = (side: 1 | -1, shRef: typeof shL, elRef: typeof elL) => (
    <group ref={shRef} position={[side * (tw - 1.1), 31, 0]}>
      <Part kind="capsule" args={[3.7, 7.6]} color={sleeve} pos={[0, -7.5, 0]} />
      <group ref={elRef} position={[0, -15, 0]}>
        <Part kind="capsule" args={[3.7, 6.6]} color={sleeve} pos={[0, -7, 0]} />
        <Part kind="sphere" color={C.skin} pos={[0, -14, 0]} scale={3.7} />
      </group>
    </group>
  );
  const rx = 16 * hf;
  const hairY = C.style === 'beanie' ? 0 : 0;

  return (
    <group ref={root}>
      {/* baked contact blob instead of a real shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={[15 * Math.min(1.3, wf), 3.4, 1]}>
        <circleGeometry args={[1, 28]} />
        <meshBasicMaterial color="#10242B" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* legs and shoes */}
      <group ref={legL} position={[-5.2 * wf, 0, 0]}>
        <Part kind="capsule" args={[4.8, 13.5]} color={C.bottom} pos={[0, 18, 0]} />
        {C.socks ? <Part kind="capsule" args={[3.6, 2]} color="#F4EEE3" pos={[0, 8.5, 0]} /> : null}
        <Part kind="sphere" color={C.shoe} pos={[0, 3.4, 1.4]} scale={[6.2, 3.7, 7.4]} />
      </group>
      <group ref={legR} position={[5.2 * wf, 0, 0]}>
        <Part kind="capsule" args={[4.8, 13.5]} color={C.bottom} pos={[0, 18, 0]} />
        {C.socks ? <Part kind="capsule" args={[3.6, 2]} color="#F4EEE3" pos={[0, 8.5, 0]} /> : null}
        <Part kind="sphere" color={C.shoe} pos={[0, 3.4, 1.4]} scale={[6.2, 3.7, 7.4]} />
      </group>

      {/* everything above the hips leans and sinks together */}
      <group ref={upper} position={[0, 30, 0]}>
        {C.coat
          ? <Part kind="cyl" args={[tw * 0.92, bw * 0.95, 43]} color={C.top} pos={[0, 13, 0]} scale={[1, 1, 0.62]} />
          : <Part kind="sphere" color={C.top} pos={[0, 16, 0]} scale={[tw * 1.02, 18.5, 9.5 * Math.min(1.3, wf)]} />}
        {id === 'sarah' ? (
          <>
            <Part kind="torus" args={[9.5, 2.6]} color={C.scarf!} pos={[0, 33, 0]} rot={[Math.PI / 2, 0, 0]} />
            <Part kind="box" args={[24, 24, 7]} color={C.pack!} pos={[0, 14, -10]} />
          </>
        ) : null}
        {C.hoodie ? (
          <>
            <Part kind="torus" args={[9.6, 2.4]} color={C.phones!} pos={[0, 31, 0.5]} rot={[Math.PI / 2.2, 0, 0]} />
            <Part kind="capsule" args={[2.6, 4.5]} color={C.phones!} pos={[-7.5, 25, 6]} />
            <Part kind="capsule" args={[2.6, 4.5]} color={C.phones!} pos={[7.5, 25, 6]} />
          </>
        ) : null}
        {arm(-1, shL, elL)}
        {arm(1, shR, elR)}

        {/* head, pivoting at the neck */}
        <group ref={headG} position={[0, 34, 0]}>
          <group position={[0, 15, 0]}>
            <Part kind="sphere" color={C.skin} scale={[rx, 14, 13.5]} />
            {/* the face, as a texture, just in front of the head */}
            <mesh position={[0, hairY, 13.4]} renderOrder={2}>
              <planeGeometry args={[FACE_SIZE.w * 0.78, FACE_SIZE.h * 0.78]} />
              <meshBasicMaterial map={face} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
            {C.glasses ? (
              <>
                <Part kind="torus" args={[4.4, 0.35]} color="#1C1B19" pos={[-6.2, 0.8, 13.7]} hull={false} />
                <Part kind="torus" args={[4.4, 0.35]} color="#1C1B19" pos={[6.2, 0.8, 13.7]} hull={false} />
              </>
            ) : null}
            {/* hair, hat and things on the head */}
            {C.style === 'beanie' ? (
              <>
                <mesh position={[0, 4.5, 0]} rotation={[-0.15, 0, 0]}>
                  <sphereGeometry args={[1, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                  <meshToonMaterial color={C.beanie} gradientMap={toon} side={THREE.DoubleSide} />
                </mesh>
                <Part kind="torus" args={[rx * 0.98, 2.4]} color="#3F7A52" pos={[0, 3.2, 0]} rot={[Math.PI / 2, 0, 0]} />
                <Part kind="sphere" color={C.beanie!} pos={[0, 18.5, 0]} scale={2.8} />
              </>
            ) : (
              <>
                <mesh position={[0, 1.2, -1.2]} rotation={[-0.38, 0, 0]} scale={[rx + 0.9, 14.9, 14.4]}>
                  <sphereGeometry args={[1, 28, 16, 0, Math.PI * 2, 0, Math.PI * (C.style === 'braid' ? 0.66 : 0.6)]} />
                  <meshToonMaterial color={C.hair} gradientMap={toon} />
                </mesh>
                {C.style === 'ponytail' ? (
                  <>
                    <Part kind="capsule" args={[3.4, 8]} color={C.hair} pos={[4, 17, -4]} rot={[0.2, 0, -0.5]} />
                    <Part kind="capsule" args={[2.6, 8]} color={C.hair} pos={[11, 12, -8]} rot={[0.3, 0, -1.1]} />
                  </>
                ) : null}
                {C.style === 'messy' ? [-6, 0, 6].map((x) => <Part key={x} kind="cone" args={[2.2, 5]} color={C.hair} pos={[x, 15.4, -1]} rot={[0, 0, -x * 0.05]} hull={false} />) : null}
                {C.style === 'braid' ? [0, 1, 2, 3, 4].map((i) => <Part key={i} kind="sphere" color={C.hair} pos={[0, -6 - i * 4.6, -12]} scale={[2.9, 3.3, 2.9]} />) : null}
              </>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}
