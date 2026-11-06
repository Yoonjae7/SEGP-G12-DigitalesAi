'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Line, Speaker } from './story/types';
import { audioSrc } from './voice/manifest';

/** While a line has no recording yet, the browser's own voice reads it, so no line is ever silent. A recording always wins. */
const FALLBACK = process.env.NEXT_PUBLIC_VOICE_FALLBACK !== '0';

const FEMALE = /female|zira|aria|jenny|samantha|susan|hazel|libby|sonia|serena|karen|moira|fiona|victoria|google uk english female/i;
const MALE = /\bmale\b|david|mark|guy|ryan|george|daniel|thomas|oliver|james|alex|eric|arthur|google uk english male/i;

function pickVoice(speaker: Speaker): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  if (!all.length) return null;
  const female = speaker === 'lisa' || speaker === 'sarah';
  const want = female ? FEMALE : MALE;
  const gb = all.filter((v) => /en[-_]GB/i.test(v.lang));
  const pool = speaker === 'narrator' && gb.length ? gb : all;
  // Prefer the natural (online) voices when the browser has them, then a voice of the right sound, then anything English.
  const natural = pool.filter((v) => /natural|online/i.test(v.name));
  return (
    natural.find((v) => want.test(v.name)) ??
    pool.find((v) => want.test(v.name)) ??
    natural[0] ??
    pool[0] ??
    all[0]
  );
}

/** Reads a line with the browser's voice. Returns a function that stops it, or null if this browser has no voice to offer. */
function speakFallback(line: Line, onStart: () => void, onEnd: (ok: boolean) => void): (() => void) | null {
  try {
    if (!FALLBACK || typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const speaker = line.voice ?? line.speaker;
    const voice = pickVoice(speaker);
    if (!voice) return null;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(line.text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = speaker === 'narrator' ? 0.92 : 1;
    u.pitch = speaker === 'narrator' ? 0.8 : speaker === 'lisa' || speaker === 'sarah' ? 1.1 : 0.95;
    let finished = false;
    const finish = (ok: boolean) => { if (finished) return; finished = true; clearTimeout(watchdog); onEnd(ok); };
    u.onstart = onStart;
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    // some browsers never report the end: do not let the story wait for it
    const watchdog = setTimeout(() => { synth.cancel(); finish(true); }, 3500 + line.text.length * 85);
    synth.speak(u);
    return () => { finished = true; clearTimeout(watchdog); synth.cancel(); };
  } catch {
    return null;
  }
}

/**
 * Plays the recorded line. Audio is generated ahead of time and sits in /public/audio, named by line ID.
 * Sound is on by default. If a file is missing, the browser's own voice reads the line. If that fails too, or the browser
 * blocks sound, captions carry on alone. Audio never blocks the story.
 *
 * `onSettle(lineId, ok)` is called once the line has finished playing (ok = true), or could not play (ok = false).
 * Auto-play uses it to move on after the voice ends, or after a reading time when there is no voice.
 * `speaking` is true while the voice is playing, so the speaker's portrait can move its mouth.
 */
export function useVoice(line: Line | null, on: boolean, ahead: Line[], onSettle?: (lineId: string, ok: boolean) => void) {
  const cur = useRef<HTMLAudioElement | null>(null);
  const stopSynth = useRef<(() => void) | null>(null);
  const warm = useRef<Map<string, HTMLAudioElement>>(new Map());
  const settle = useRef(onSettle);
  settle.current = onSettle;
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    const a = cur.current;
    if (a) { a.onended = null; a.onerror = null; a.pause(); cur.current = null; }
    if (stopSynth.current) { stopSynth.current(); stopSynth.current = null; }
    setSpeaking(false);
  }, []);

  // browsers load their voice list late: ask for it early so it is ready when a line needs it
  useEffect(() => {
    try { if (FALLBACK && 'speechSynthesis' in window) window.speechSynthesis.getVoices(); } catch { /* no voices here */ }
  }, []);

  const play = useCallback(() => {
    stop();
    if (!line) return;
    const src = audioSrc(line);
    if (!src) return;
    const id = line.id;
    // no recording: the browser's voice, or nothing
    const fallback = (a: HTMLAudioElement | null) => {
      if (a && cur.current !== a) return; // a newer line has taken over
      cur.current = null;
      setSpeaking(false);
      const stopFn = speakFallback(line, () => setSpeaking(true), (ok) => { stopSynth.current = null; setSpeaking(false); settle.current?.(id, ok); });
      if (stopFn) stopSynth.current = stopFn; else settle.current?.(id, false);
    };
    try {
      const a = warm.current.get(src) ?? new Audio(src);
      a.currentTime = 0;
      a.onended = () => { setSpeaking(false); settle.current?.(id, true); };
      a.onerror = () => fallback(a);
      cur.current = a;
      void a.play()
        .then(() => { if (cur.current === a) setSpeaking(true); })
        .catch(() => { if (cur.current === a) fallback(a); }); // blocked or missing
    } catch {
      fallback(null); // no audio in this browser
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
