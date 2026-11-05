'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import * as THREE from 'three';
import { PhoneScreenContext, useChatTexture, type ChatShot } from './chat';
import { characterModel } from './characters';
import { PLACE, SPOTS, shotFor, type Place } from './direction';
import { charactersFor } from './sets';
import { SPEC } from './spec';
import type { CharId } from './types';
import { BusSet } from './world/bus';
import { CafeFlat, CafeMorning, CafeSoft } from './world/cafe';
import { LibraryGrey, LibraryWarm } from './world/library';
import { PhonesSet } from './world/phones';
import { RoomSet } from './world/room';

/**
 * The 3D scenes: real sets with clay people in them, filmed by a camera that glides from shot to shot.
 * One <Canvas>, dpr capped at 1.5, no real-time shadows and no post-processing.
 */
export interface Act { pose?: string; expression?: string; to?: string }
export interface Override { speaker: string; pose?: string; expression?: string; talking?: boolean }
export interface CinemaProps {
  art: string;
  lineId: string | null;
  override: Override | null;
  acts: Partial<Record<CharId, Act>>;
  chat: ChatShot | null;
  reduced: boolean;
  onReady: () => void;
  onFail: (why: string) => void;
}

const SETS: Record<string, ComponentType> = { s0: BusSet, s1: RoomSet, s2: RoomSet, s3: PhonesSet, s4: CafeMorning, s5: CafeSoft, s6: CafeFlat, s7a: LibraryWarm, s7b: LibraryGrey };
const PERSON = 0.0177; // metres per figure unit: a standard figure is about 1.7 m

export default function Cinema(props: CinemaProps) {
  return (
    <div className="art stage3d" aria-hidden="true">
      <Canvas flat dpr={[1, 1.5]} shadows={false} frameloop="always" gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ fov: 40, position: [0, 1.5, -3.4], near: 0.05, far: 60 }} style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => { gl.setClearColor(0x0a1822, 1); gl.domElement.addEventListener('webglcontextlost', () => props.onFail('context lost')); }}>
        <Director key={props.art} {...props} />
      </Canvas>
    </div>
  );
}

const lerpAngle = (a: number, b: number, k: number) => {
  let d = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return a + d * k;
};

/** One person on stage. They stay where they are put, and walk to a named spot when a line says so. */
function Actor({ id, place, spot, pose, expression, talking }: { id: CharId; place: Place; spot?: { x: number; z: number; rotY: number }; pose: string; expression: string; talking: boolean }) {
  const g = useRef<THREE.Group>(null);
  const cur = useRef({ x: place.pos[0], z: place.pos[2], ry: place.rotY });
  const movingRef = useRef(false);
  const [moving, setMoving] = useState(false);
  useFrame((_, dt) => {
    const t = spot ?? { x: place.pos[0], z: place.pos[2], rotY: place.rotY };
    const dx = t.x - cur.current.x, dz = t.z - cur.current.z;
    const d = Math.hypot(dx, dz);
    let ry = cur.current.ry;
    if (d > 0.04) {
      const step = Math.min(d, 1.1 * dt);
      cur.current.x += (dx / d) * step; cur.current.z += (dz / d) * step;
      ry = lerpAngle(ry, Math.atan2(dx, dz), 1 - Math.exp(-dt * 8));
      if (!movingRef.current) { movingRef.current = true; setMoving(true); }
    } else {
      if (movingRef.current) { movingRef.current = false; setMoving(false); }
      ry = lerpAngle(ry, t.rotY, 1 - Math.exp(-dt * 6));
    }
    cur.current.ry = ry;
    if (g.current) { g.current.position.set(cur.current.x, place.pos[1], cur.current.z); g.current.rotation.y = ry; }
  });
  const C = SPEC[id];
  const Model = characterModel(id);
  const s = PERSON * C.ht;
  return (
    <group ref={g} position={place.pos} rotation={[0, place.rotY, 0]} scale={[s, s, s]}>
      <Model id={id} pose={moving ? 'walk' : pose} expression={expression} view="front" talking={talking && !moving} />
    </group>
  );
}

function Director({ art, lineId, override, acts, chat, reduced, onReady }: CinemaProps) {
  const Set = SETS[art];
  const shot = shotFor(art, lineId);
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const started = useRef(false);
  const shotKey = useRef('');
  const since = useRef(0);
  const ptr = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const screen = useChatTexture(chat);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => { ptr.current.tx = e.clientX / window.innerWidth - 0.5; ptr.current.ty = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  useFrame((_, dt) => {
    if (!shot) return;
    const cam = camera as THREE.PerspectiveCamera;
    const key = `${art}:${shot.pos.join(',')}`;
    if (key !== shotKey.current) { shotKey.current = key; since.current = 0; }
    since.current += dt;
    const d = reduced ? [0, 0, 0] : (shot.drift ?? [0, 0, 0]);
    const p = ptr.current;
    p.x += (p.tx - p.x) * (1 - Math.exp(-dt * 4)); p.y += (p.ty - p.y) * (1 - Math.exp(-dt * 4));
    const want = new THREE.Vector3(shot.pos[0] + d[0] * since.current + p.x * 0.18, shot.pos[1] + d[1] * since.current - p.y * 0.08, shot.pos[2] + d[2] * since.current);
    const wantLook = new THREE.Vector3(shot.look[0], shot.look[1], shot.look[2]);
    if (!started.current) { started.current = true; cam.position.copy(want); look.current.copy(wantLook); cam.fov = shot.fov; }
    const k = 1 - Math.exp(-dt * (reduced ? 40 : 2.6));
    cam.position.lerp(want, k);
    look.current.lerp(wantLook, k);
    cam.fov += (shot.fov - cam.fov) * k;
    cam.updateProjectionMatrix();
    cam.lookAt(look.current);
  });

  const cast = charactersFor(art);
  const place = PLACE[art] ?? {};
  return (
    <PhoneScreenContext.Provider value={screen}>
      {Set ? <Set /> : null}
      {cast.map((c) => {
        const at = place[c.id as CharId];
        if (!at) return null;
        const speaking = !!override && override.speaker === c.id;
        const act = acts[c.id as CharId];
        const pose = (speaking && override!.pose) || act?.pose || c.pose;
        const expression = (speaking && override!.expression) || act?.expression || c.expression || 'calm';
        const spot = act?.to ? SPOTS[art]?.[act.to] : undefined;
        return <Actor key={c.id} id={c.id as CharId} place={at} spot={spot} pose={pose} expression={expression} talking={speaking && !!override!.talking} />;
      })}
    </PhoneScreenContext.Provider>
  );
}
