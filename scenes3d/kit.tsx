'use client';

import type { ReactNode } from 'react';
import * as THREE from 'three';

/**
 * The building blocks for the 3D sets. Everything is a toon-shaded primitive with a thin ink outline
 * (the same inverted-hull trick the clay people use), so sets and people look like one world.
 * Units are metres. The people are about 1.7 m tall.
 */
export const INK = '#1C1B19';
export type V3 = [number, number, number];

export const toonMap = (() => {
  const t = new THREE.DataTexture(new Uint8Array([78, 158, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
export const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

const LINE = 0.028; // outline thickness, metres

interface Common { pos?: V3; rot?: V3; color: string; line?: number | false; glow?: string; glowI?: number; opacity?: number; children?: ReactNode }

function Mat({ color, glow, glowI = 1, opacity }: Pick<Common, 'color' | 'glow' | 'glowI' | 'opacity'>) {
  return <meshToonMaterial color={color} gradientMap={toonMap} emissive={glow ?? '#000000'} emissiveIntensity={glow ? glowI : 0} transparent={opacity !== undefined} opacity={opacity ?? 1} />;
}

/** A box with an ink outline. */
export function Blk({ size, pos, rot, color, line = LINE, glow, glowI, opacity, children }: Common & { size: V3 }) {
  const hull: V3 = [1 + (2 * (line || 0)) / size[0], 1 + (2 * (line || 0)) / size[1], 1 + (2 * (line || 0)) / size[2]];
  return (
    <group position={pos} rotation={rot}>
      <mesh><boxGeometry args={size} /><Mat color={color} glow={glow} glowI={glowI} opacity={opacity} /></mesh>
      {line ? <mesh scale={hull} material={inkMat}><boxGeometry args={size} /></mesh> : null}
      {children}
    </group>
  );
}

/** An upright cylinder (poles, lamp bases, tree trunks). */
export function Cyl({ r, h, r2, pos, rot, color, line = LINE, glow, glowI, segs = 20, children }: Common & { r: number; h: number; r2?: number; segs?: number }) {
  const k = 1 + (line || 0) / Math.max(0.02, r);
  return (
    <group position={pos} rotation={rot}>
      <mesh><cylinderGeometry args={[r2 ?? r, r, h, segs]} /><Mat color={color} glow={glow} glowI={glowI} /></mesh>
      {line ? <mesh scale={[k, 1 + (2 * line) / h, k]} material={inkMat}><cylinderGeometry args={[r2 ?? r, r, h, segs]} /></mesh> : null}
      {children}
    </group>
  );
}

/** A sphere or ellipsoid. */
export function Sph({ r = 1, scale = 1, pos, rot, color, line = LINE, glow, glowI, children }: Common & { r?: number; scale?: number | V3 }) {
  const s: V3 = typeof scale === 'number' ? [scale, scale, scale] : scale;
  const k: V3 = [1 + (line || 0) / (r * s[0]), 1 + (line || 0) / (r * s[1]), 1 + (line || 0) / (r * s[2])];
  return (
    <group position={pos} rotation={rot} scale={s}>
      <mesh><sphereGeometry args={[r, 26, 18]} /><Mat color={color} glow={glow} glowI={glowI} /></mesh>
      {line ? <mesh scale={k} material={inkMat}><sphereGeometry args={[r, 26, 18]} /></mesh> : null}
      {children}
    </group>
  );
}

/** A flat, unlit shape: glass, light shafts, screens. */
export function Flat({ size, pos, rot, color, opacity = 1, map, blend, children }: { size: [number, number]; pos?: V3; rot?: V3; color?: string; opacity?: number; map?: THREE.Texture | null; blend?: 'add'; children?: ReactNode }) {
  return (
    <mesh position={pos} rotation={rot} renderOrder={2}>
      <planeGeometry args={size} />
      <meshBasicMaterial color={color ?? '#ffffff'} map={map ?? null} transparent opacity={opacity} depthWrite={false} toneMapped={false}
        blending={blend === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending} side={THREE.DoubleSide} />
      {children}
    </mesh>
  );
}

/** A canvas drawn once, as a texture. */
export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeatX = false): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeatX) t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** A small deterministic random generator, so a set looks the same every time. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
