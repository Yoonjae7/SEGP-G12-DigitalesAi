'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLabFlags } from '@/lib/useLabFlags';
import type { ChatShot } from '@/scenes3d/chat';
import type { Tag } from '@/scenes3d/Cinema';
import { CINEMA_SETS } from '@/scenes3d/direction';
import { copy } from '@/lib/copy';
import { PhotoTile } from './Marks';
import { SceneArt } from './SceneArt';
import { useSession } from './SessionProvider';

/** The 3D layer is loaded only when it is wanted, never in the first page bundle. */
const Cinema = dynamic(() => import('@/scenes3d/Cinema'), { ssr: false });

const FLAG_3D = process.env.NEXT_PUBLIC_3D !== '0';

export interface LineOverride { speaker: string; pose?: string; expression?: string; talking?: boolean }
export type Acts = Partial<Record<'sarah' | 'lisa' | 'marco' | 'dev' | 'you', { pose?: string; expression?: string; to?: string }>>;

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(m.matches);
    const f = () => setR(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return r;
}

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() { return { bad: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.bad ? null : this.props.children; }
}

/**
 * What fills the stage: the 3D scene when it is allowed and can start, otherwise the 2D cut-paper scene.
 * Either one off (the flag, the "Simple visuals" setting, the Lab switch) gives 2D. If WebGL cannot start,
 * or anything in 3D fails, it falls back to 2D without a word and logs fallback_2d. The story never depends on it.
 */
export function Visuals({ art, nextArt, override, lineId, acts, chat, photo, tags, deciding }: { art: string; nextArt?: string | null; override?: LineOverride | null; lineId?: string | null; acts?: Acts; chat?: ChatShot | null; photo?: boolean; tags?: Tag[]; deciding?: boolean }) {
  const { state, dispatch } = useSession();
  const lab = useLabFlags();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [gl, setGl] = useState(false);
  const [ready, setReady] = useState<string | null>(null);
  const logged = useRef(false);

  const wanted = FLAG_3D && lab.threeD && !state.settings.simple && !failed;
  useEffect(() => setGl(webglAvailable()), []);

  const fail = useCallback((why: string) => {
    setFailed(true);
    if (!logged.current) { logged.current = true; dispatch({ t: 'log', event: 'fallback_2d', payload: { why }, ts: Date.now() }); }
  }, [dispatch]);
  // no WebGL at all: say so once, then stay in 2D
  useEffect(() => { if (wanted && typeof window !== 'undefined' && !webglAvailable()) fail('no webgl'); }, [wanted, fail]);

  const use3D = wanted && gl && CINEMA_SETS.has(art); // a scene without a 3D set stays in 2D
  const show3D = use3D && ready === art;

  // The photo shows as a small print in the corner, unless the phone in the 3D scene is already showing it.
  const phoneShowsPhoto = show3D && !!chat?.items.some((i) => i.photo);

  return (
    <>
      <div style={{ display: show3D ? 'none' : undefined }}><ArtStack id={art} /></div>
      {use3D ? (
        <Boundary onError={() => fail('error')}>
          <div className={`stage3d-wrap${show3D ? ' on' : ''}`}>
            <Cinema art={art} lineId={lineId ?? null} override={override ?? null} acts={acts ?? {}} chat={chat ?? null} tags={tags ?? []} deciding={!!deciding} reduced={reduced} onReady={() => setReady(art)} onFail={fail} />
          </div>
        </Boundary>
      ) : null}
      {photo && !phoneShowsPhoto ? <aside className="chat tile-only" aria-label={copy.player.photo}><div className="ch-body"><div className="b"><PhotoTile /></div></div></aside> : null}
    </>
  );
}

/** Keeps the old scene underneath for the 420 ms paper-slide, so the stage is never empty. */
function ArtStack({ id }: { id: string }) {
  const [stack, setStack] = useState<{ cur: string; prev: string | null }>({ cur: id, prev: null });
  useEffect(() => {
    if (id === stack.cur) return;
    setStack({ cur: id, prev: stack.cur });
    const t = setTimeout(() => setStack((s) => ({ ...s, prev: null })), 480);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return (
    <>
      {stack.prev ? <SceneArt key={`p-${stack.prev}`} id={stack.prev} className="art leaving" /> : null}
      <SceneArt key={stack.cur} id={stack.cur} className={`art${stack.prev ? ' enter' : ''}`} parallax />
    </>
  );
}
