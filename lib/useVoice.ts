'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Line } from './story/types';
import { audioSrc } from './voice/manifest';

/**
 * Plays the recorded line. Audio is generated ahead of time and sits in /public/audio, named by line ID.
 * Sound is on by default. If a file is missing, fails, or the browser blocks it, captions carry on alone.
 * Audio never blocks the story.
 *
 * `onSettle(lineId, ok)` is called once the line has finished playing (ok = true), or could not play (ok = false).
 * Auto-play uses it to move on after the voice ends, or after a reading time when there is no voice.
 * `speaking` is true while the voice is playing, so the speaker's portrait can move its mouth.
 */
export function useVoice(line: Line | null, on: boolean, ahead: Line[], onSettle?: (lineId: string, ok: boolean) => void) {
  const cur = useRef<HTMLAudioElement | null>(null);
  const warm = useRef<Map<string, HTMLAudioElement>>(new Map());
  const settle = useRef(onSettle);
  settle.current = onSettle;
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    const a = cur.current;
    if (a) { a.onended = null; a.onerror = null; a.pause(); cur.current = null; }
    setSpeaking(false);
  }, []);

  const play = useCallback(() => {
    stop();
    if (!line) return;
    const src = audioSrc(line);
    if (!src) return;
    const id = line.id;
    try {
      const a = warm.current.get(src) ?? new Audio(src);
      a.currentTime = 0;
      a.onended = () => { setSpeaking(false); settle.current?.(id, true); };
      a.onerror = () => { setSpeaking(false); settle.current?.(id, false); };
      cur.current = a;
      void a.play()
        .then(() => { if (cur.current === a) setSpeaking(true); })
        .catch(() => { if (cur.current === a) { setSpeaking(false); settle.current?.(id, false); } }); // blocked or missing: carry on silently
    } catch {
      settle.current?.(id, false); // no audio in this browser
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

  return { replay: play, speaking };
}
