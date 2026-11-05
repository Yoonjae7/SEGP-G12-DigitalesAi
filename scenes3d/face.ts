import * as THREE from 'three';
import { EXPR, mouthPath, SPEC } from './spec';

/**
 * The face is a texture. Expressions swap by changing it. Two dots, brow lines, a small mouth.
 * Drawn in the same units as the 2D figure (1u = 8 pixels), so the 2D and 3D faces match.
 */
const U = 8;
const W = 288; // 36u wide
const H = 256; // 32u tall

export function faceCanvas(id: string, expression: string, mouth?: string | null): HTMLCanvasElement {
  const C = SPEC[id];
  const E = EXPR[expression] ?? EXPR.calm;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  g.translate(W / 2, H / 2);
  g.scale(U, U);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const ink = '#1C1B19';
  const hf = C.hf;
  const e = 6.2 * hf;
  const cy = 0.8 + (C.fy || 0) - 0; // the head centre is the middle of the texture

  if (E.blush) {
    g.fillStyle = 'rgba(200,90,85,.38)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * (e + 1.8), cy + 3.6, 2.4, 1.3, 0, 0, Math.PI * 2); g.fill(); }
  }
  // eyes
  g.fillStyle = ink;
  for (const sx of [-1, 1]) {
    const x = sx * e;
    if (E.eye === 'closed') {
      g.strokeStyle = ink; g.lineWidth = 0.95;
      g.beginPath(); g.arc(x, cy - 0.6, 1.9, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    } else if (E.eye === 'half') {
      g.beginPath(); g.arc(x, cy, 1.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = C.skin; g.beginPath(); g.arc(x, cy + 0.3, 2.1, Math.PI, 0); g.fill(); g.fillStyle = ink;
      g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - 2.4, cy + 0.3); g.lineTo(x + 2.4, cy + 0.3); g.strokeStyle = ink; g.stroke();
    } else {
      g.beginPath(); g.arc(x, cy + (E.eye === 'down' ? 1.1 : 0), E.eye === 'down' ? 1.4 : 1.6, 0, Math.PI * 2); g.fill();
    }
  }
  // brows: the inner end lifts when t is positive
  g.strokeStyle = ink; g.lineWidth = 1.05;
  const by = cy - 4.4 - (C.glasses ? 1.2 : 0);
  [-1, 1].forEach((sx, i) => {
    const x = sx * e, y = by + E.lift[i];
    g.save(); g.translate(x, y); g.rotate(((sx < 0 ? -E.t : E.t) * Math.PI) / 180);
    g.beginPath(); g.moveTo(-2.4, 0); g.lineTo(2.4, 0); g.stroke(); g.restore();
  });
  // mouth, from the same path table as the 2D figure
  const mp = mouthPath(mouth || E.m, 5.6 * hf);
  g.save(); g.translate(0, cy + 6.1); g.lineWidth = 1;
  const path = new Path2D(mp[0]);
  if (mp[1]) { g.fillStyle = mp[1]; g.fill(path); }
  g.stroke(path); g.restore();
  return cv;
}

const cache = new Map<string, THREE.CanvasTexture>();
export function faceTexture(id: string, expression: string, mouth?: string | null): THREE.CanvasTexture {
  const k = `${id}:${expression}:${mouth ?? ''}`;
  let t = cache.get(k);
  if (!t) {
    t = new THREE.CanvasTexture(faceCanvas(id, expression, mouth));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    cache.set(k, t);
  }
  return t;
}
export const FACE_SIZE = { w: W / U, h: H / U };
