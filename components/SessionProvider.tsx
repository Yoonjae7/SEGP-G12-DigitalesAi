'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { initialState, reducer, rehydrate, STEP_ROUTE, STORAGE_KEY, type Action } from '@/lib/engine/state';
import type { SessionState } from '@/lib/engine/types';
import { LAB_KEY } from '@/lib/log/lab';

interface Ctx {
  state: SessionState;
  dispatch: (a: Action) => void;
  /** False until the saved session has been read from this browser. */
  ready: boolean;
  /** Delete everything this app keeps in this browser. */
  deleteData: () => void;
}
const SessionCtx = createContext<Ctx | null>(null);

/** One anonymous session, kept in this browser only (localStorage "dt_session_v1"). A refresh resumes at the same step. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const s = raw ? rehydrate(JSON.parse(raw)) : null;
      if (s) dispatch({ t: 'hydrate', state: s });
    } catch {
      /* private window or blocked storage: start fresh */
    }
    setReady(true);
  }, []);

  // Save after every step. No session yet means nothing is stored.
  useEffect(() => {
    if (!ready) return;
    try {
      if (state.sessionId) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* the story still plays without saving */
    }
  }, [state, ready]);

  useEffect(() => {
    document.documentElement.dataset.text = String(state.settings.text);
  }, [state.settings.text]);

  const deleteData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAB_KEY);
      sessionStorage.clear();
    } catch {
      /* nothing to clear */
    }
    dispatch({ t: 'wipe' });
  }, []);

  const value = useMemo(() => ({ state, dispatch, ready, deleteData }), [state, ready, deleteData]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): Ctx {
  const c = useContext(SessionCtx);
  if (!c) throw new Error('useSession must be used inside SessionProvider');
  return c;
}

/** Sends the learner to the screen that matches their saved step. Used on /start and /play. */
export function useStepGuard(route: '/start' | '/play') {
  const { state, ready } = useSession();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (!ready) return;
    const want = STEP_ROUTE[state.step];
    if (want !== route && path === route) router.replace(want);
  }, [ready, state.step, route, router, path]);
  return ready && STEP_ROUTE[state.step] === route;
}
