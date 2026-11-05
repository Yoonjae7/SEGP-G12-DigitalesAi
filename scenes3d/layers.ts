import * as THREE from 'three';
import { DEFS_MARKUP } from '@/lib/art/defs';
import { Scenes } from '@/lib/art/scenes';

export interface Layer { depth: number; tex: THREE.Texture }

const W = 1280, H = 720;
const cache = new Map<string, Promise<Layer[]>>();

/**
 * Turns the 2D scene's paper layers into textures. The 3D stage hangs each one in space at its depth,
 * so the layers really do move at different speeds when the camera moves. People are not in these layers.
 * Text inside a layer uses a plain fallback font, because an image cannot reach the page's web fonts.
 */
export function loadLayers(art: string): Promise<Layer[]> {
  let p = cache.get(art);
  if (!p) {
    p = build(art);
    cache.set(art, p);
    p.catch(() => cache.delete(art));
  }
  return p;
}
export const preloadLayers = (art: string) => { void loadLayers(art).catch(() => {}); };

async function build(art: string): Promise<Layer[]> {
  const parts = Scenes.layers(art);
  if (!parts.length) throw new Error('no layers');
  const out = await Promise.all(parts.map(async (p) => {
    const inner = p.inner.replace(/var\(--font-body\)/g, "'Atkinson Hyperlegible Next', Verdana, sans-serif").replace(/var\(--font-display\)/g, 'Georgia, serif');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="${W}" height="${H}"><defs>${DEFS_MARKUP}</defs>${inner}</svg>`;
    const img = new Image();
    await new Promise<void>((ok, bad) => {
      img.onload = () => ok();
      img.onerror = () => bad(new Error('layer image'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.getContext('2d')!.drawImage(img, 0, 0, W, H);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { depth: p.depth, tex };
  }));
  return out.sort((a, b) => a.depth - b.depth);
}

/** WebGL has to start, or the story stays in 2D. */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
