'use client';

import { useRef } from 'react';
import { useDeckle } from '@/lib/useDeckle';
import { SceneArt } from './SceneArt';

/** The room from scene 1. The phone pings every 6 seconds. Layers move with the pointer or tilt. Torn edge (hero element 1 of 3). */
export function HomeDiorama() {
  const ref = useRef<HTMLDivElement>(null);
  useDeckle(ref, { amp: 7, step: 15, seed: 11 });
  return (
    <div className="deckle-wrap">
      <div className="tilt">
        <div className="diorama" ref={ref}>
          <SceneArt id="s1" mode="home" parallax />
        </div>
      </div>
    </div>
  );
}
