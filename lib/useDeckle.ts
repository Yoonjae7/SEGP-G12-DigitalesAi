'use client';

import { useEffect, type RefObject } from 'react';

/** A torn-paper edge, made with a jittered clip-path. Used on three hero elements at most. */
export function useDeckle(ref: RefObject<HTMLElement | null>, opt: { amp?: number; step?: number; edges?: string; seed?: number } = {}) {
  const { amp = 6, step = 14, edges = 'tblr', seed = 7 } = opt;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const build = () => {
      let s = seed;
      const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      const w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !h) return;
      const j = () => (rnd() - 0.5) * 2 * amp * 0.6 + amp * 0.6;
      const t = edges.includes('t'), b = edges.includes('b'), l = edges.includes('l'), r = edges.includes('r');
      const pts: [number, number][] = [];
      for (let x = 0; x <= w; x += step) pts.push([x, t ? j() : 0]);
      for (let y = 0; y <= h; y += step) pts.push([w - (r ? j() : 0), y]);
      for (let x = w; x >= 0; x -= step) pts.push([x, h - (b ? j() : 0)]);
      for (let y = h; y >= 0; y -= step) pts.push([l ? j() : 0, y]);
      el.style.clipPath = 'polygon(' + pts.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',') + ')';
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, amp, step, edges, seed]);
}
