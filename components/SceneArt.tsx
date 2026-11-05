'use client';

import { useEffect, useRef, useState } from 'react';
import { Scenes } from '@/lib/art/scenes';

/**
 * The 2D cut-paper scene. Also the "Simple visuals" version, and the fallback if 3D cannot start.
 * It is decoration: the canvas is aria-hidden and the caption plate carries a text description of every scene.
 */
export function SceneArt({ id, mode, className = '', parallax = false }: { id: string; mode?: 'wide' | 'portrait' | 'home'; className?: string; parallax?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pick = () => {
      let m: 'wide' | 'portrait' | 'home' | undefined = mode;
      if ((!m || m === 'wide') && el.clientHeight > el.clientWidth) m = 'portrait'; // a tall box gets the portrait column
      setHtml(Scenes.render(id, { mode: m }));
    };
    pick();
    if (mode === 'home') return;
    let last = el.clientHeight > el.clientWidth;
    const ro = new ResizeObserver(() => {
      const now = el.clientHeight > el.clientWidth;
      if (now !== last) { last = now; pick(); }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [id, mode]);

  // Each layer knows its depth, for the paper-slide.
  useEffect(() => {
    ref.current?.querySelectorAll<SVGGElement>('.lyr').forEach((l) => l.style.setProperty('--d', l.dataset.depth || '0'));
  }, [html]);

  // Layers move at different speeds with the pointer, or with device tilt where the browser allows it without asking.
  useEffect(() => {
    if (!parallax || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;
    const move = (nx: number, ny: number) => {
      el.querySelectorAll<SVGGElement>('.lyr').forEach((l) => {
        const d = parseFloat(l.dataset.depth || '0');
        l.style.transform = `translate(${(-nx * d * 26).toFixed(1)}px, ${(-ny * d * 12).toFixed(1)}px)`;
      });
    };
    const onPointer = (e: PointerEvent) => move(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      move(Math.max(-0.5, Math.min(0.5, e.gamma / 60)), Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 90)));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
    };
  }, [parallax, html]);

  return <div ref={ref} className={`scene-art cam-${id} ${className}`} aria-hidden="true" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}

