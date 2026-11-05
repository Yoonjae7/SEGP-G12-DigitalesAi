'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Line } from './story/types';
import { audioSrc } from './voice/manifest';

/**
 * Plays the recorded line. Audio is generated ahead of time and sits in /public/audio, named by line ID.
 * It starts muted. If a file is missing or fails, captions carry on alone. Audio never blocks the story.
 */
export function useVoice(line: Line | null, on: boolean, ahead: Line[]) {
  const cur = useRef<HTMLAudioElement | null>(null);
  const warm = useRef<Map<string, HTMLAudioElement>>(new Map());

  const stop = useCallback(() => {
    if (cur.current) { cur.current.pause(); cur.current = null; }
  }, []);

  const play = useCallback(() => {
    stop();
    if (!line) return;
    const src = audioSrc(line);
    if (!src) return;
    try {
      const a = warm.current.get(src) ?? new Audio(src);
      a.currentTime = 0;
      cur.current = a;
      void a.play().catch(() => { /* blocked or missing: carry on silently */ });
    } catch {
      /* no audio in this browser */
    }
  }, [line, stop]);

  useEffect(() => {
    if (on) play(); else stop();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, line?.id]);

  // Fetch the next scene's files early, one scene ahead.
  const aheadKey = ahead.map((l) => l.id).join(',');
  useEffect(() => {
    if (!on) return;
    for (const l of ahead) {
      const src = audioSrc(l);
      if (!src || warm.current.has(src)) continue;
      try {
        const a = new Audio();
        a.preload = 'auto';
        a.src = src;
        a.onerror = () => warm.current.delete(src);
        warm.current.set(src, a);
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, aheadKey]);

  return { replay: play };
}
