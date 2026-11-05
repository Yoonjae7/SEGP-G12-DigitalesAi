'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Rig } from '@/lib/art/rig';
import { copy, fill } from '@/lib/copy';
import { story, type DebriefSlide } from '@/lib/story';
import { useLabFlags } from '@/lib/useLabFlags';
import { useVoice } from '@/lib/useVoice';
import { audioSrc, VOICE_ENABLED } from '@/lib/voice/manifest';
import { Icon } from './Marks';
import { SceneArt } from './SceneArt';
import { useSession } from './SessionProvider';

const D = copy.debrief;
const P = copy.player;

type Focus = string[] | undefined;
const lit = (focus: Focus, key: string) => !focus || focus.includes(key);

/**
 * The debrief after the story, like a short narrated video: what happened, who should have seen it coming,
 * how it could have gone, and the moral. It plays by itself (the learner can pause, go back, skip or step ahead),
 * and it stops on the last line until the learner chooses to go on.
 */
export function Debrief() {
  const { state, dispatch } = useSession();
  const lab = useLabFlags();
  const voiceOn = VOICE_ENABLED && lab.voice;
  const soundOn = voiceOn && state.settings.sound;
  const auto = state.settings.auto;
  const slides = story.debrief.slides;

  // every spoken line in order, each knowing which slide it belongs to
  const flat = useMemo(() => slides.flatMap((slide, si) => slide.narration.map((line) => ({ slide, si, line }))), [slides]);
  const [i, setI] = useState(0);
  const cur = flat[i];
  const last = i === flat.length - 1;

  const [settled, setSettled] = useState<{ id: string; ok: boolean } | null>(null);
  const onSettle = useCallback((id: string, ok: boolean) => setSettled({ id, ok }), []);
  const ahead = useMemo(() => flat.slice(i + 1, i + 4).map((f) => f.line), [flat, i]);
  const { replay } = useVoice(cur.line, soundOn, ahead, onSettle);

  const next = useCallback(() => setI((n) => Math.min(n + 1, flat.length - 1)), [flat.length]);
  const back = useCallback(() => setI((n) => Math.max(n - 1, 0)), []);
  const finish = (skipped: boolean) => dispatch({ t: 'debriefDone', ts: Date.now(), skipped });

  // Plays on by itself: a moment after the voice ends, or after a reading time when there is no voice. Stops on the last line.
  useEffect(() => {
    if (!auto || last) return;
    const words = cur.line.text.split(/\s+/).length;
    const reading = Math.max(2800, words * 420 + 1000);
    const voiced = soundOn && !!audioSrc(cur.line);
    const here = settled && settled.id === cur.line.id ? settled : null;
    let delay = reading;
    if (voiced && !here) delay = 40_000; // the voice has not reported back yet: a safety net only
    else if (voiced && here?.ok) delay = 1100; // a short breath after the voice
    const t = setTimeout(next, delay);
    return () => clearTimeout(t);
  }, [auto, last, cur, soundOn, settled, next]);

  // Space or Enter step ahead, unless the learner is on a control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest('button, a, input, textarea, select, [role="switch"]')) return;
      e.preventDefault();
      next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next]);

  const art = state.ending === 'A' ? 's7a' : 's7b';
  const focus = cur.line.focus;

  return (
    <div className="on-night">
      <div className="viewport">
        <main className="stage db" aria-label={D.label}>
          <SceneArt id={art} className="art" />
          <div className="dim strong" />

          <header className="db-head">
            <span className="db-kicker">{D.label}</span>
            <span className="db-part">{fill(D.part, { n: cur.si + 1, total: slides.length })}</span>
            <span className="db-dots" aria-hidden="true">
              {slides.map((s, k) => <i key={s.id} className={k === cur.si ? 'on' : k < cur.si ? 'done' : ''} />)}
            </span>
            <Link className="db-support" href="/support"><Icon id="ic-support" size={18} /><span>{copy.nav.support}</span></Link>
          </header>

          <section className={`db-body ${cur.slide.kind}`} key={cur.slide.id} aria-label={cur.slide.title}>
            <h1 className="db-title">{cur.slide.title}</h1>
            <SlideBody slide={cur.slide} focus={focus} />
          </section>

          <div className="plate db-plate" role="region" aria-label={P.caption} aria-live="polite" key={cur.line.id}>
            <div className="tags"><span className="who narrator">Narrator</span></div>
            <p className="line narr">{cur.line.text}</p>
            <div className="ctl">
              <button className="hbtn" disabled={i === 0} onClick={back}><Icon id="ic-back" size={20} />{P.back}</button>
              {soundOn ? <button className="hbtn" onClick={replay}><Icon id="ic-replay" size={20} />{P.replay}</button> : null}
              <button className="hbtn" onClick={() => dispatch({ t: 'settings', patch: { auto: !auto } })}>{auto ? P.pause : P.autoPlay}</button>
              <button className="hbtn" onClick={() => finish(true)}>{D.skip}</button>
              {last
                ? <button className="hbtn next" onClick={() => finish(false)}>{D.continue}</button>
                : <button className="hbtn next" onClick={next}>{P.next}</button>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SlideBody({ slide, focus }: { slide: DebriefSlide; focus: Focus }) {
  if (slide.kind === 'recap') {
    return (
      <ol className="db-chain">
        {slide.items?.map((it, k) => (
          <li key={it.title} style={{ ['--i' as string]: k }}>
            <b>{it.title}</b>
            <span>{it.text}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (slide.kind === 'people') {
    return (
      <ul className={`db-people${focus ? ' focused' : ''}`}>
        {slide.people?.map((p, k) => (
          <li key={p.id} className={`${p.id}${lit(focus, p.id) ? ' on' : ' off'}`} style={{ ['--i' as string]: k }}>
            <PersonArt id={p.id} />
            <div>
              <span className="role">{p.role}</span>
              <b>{p.name}</b>
              <p>{p.should}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }
  if (slide.kind === 'steps') {
    return (
      <ol className={`db-steps${focus ? ' focused' : ''}`}>
        {slide.items?.map((it, k) => (
          <li key={it.title} className={lit(focus, String(k + 1)) ? 'on' : 'off'} style={{ ['--i' as string]: k }}>
            <span className="num" aria-hidden="true">{k + 1}</span>
            <div><b>{it.title}</b><p>{it.text}</p></div>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <div className="db-moral">
      <p className="big">{slide.moral}</p>
      {slide.note ? <p className="note">{slide.note}</p> : null}
    </div>
  );
}

/** A small cut-paper portrait for a person card. The group has no single face, so it gets three paper heads. */
function PersonArt({ id }: { id: 'lisa' | 'marco' | 'group' | 'you' }) {
  const html = useMemo(() => {
    const draw = (who: 'lisa' | 'marco' | 'dev' | 'you', expr: string) => Rig.portrait(who, { expr, size: 96 });
    if (id === 'marco') return draw('marco', 'embarrassed') + draw('dev', 'uneasy');
    if (id === 'lisa') return draw('lisa', 'sorry');
    return draw('you', 'calm');
  }, [id]);
  if (id === 'group') return <span className="crowd" aria-hidden="true"><i /><i /><i /></span>;
  return <span className="pt" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}
