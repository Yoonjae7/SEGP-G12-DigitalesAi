'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { guessEmotion, matchStory } from '@/lib/ai/client';
import { EMOTION_LABELS, type EmotionLabel } from '@/lib/ai/types';
import { copy, fill } from '@/lib/copy';
import { Footer, TopBar } from './Brand';
import { WellbeingEmail } from './Contact';
import { Mark } from './Marks';
import { SceneArt } from './SceneArt';
import { useSession, useStepGuard } from './SessionProvider';

const c = copy.start;

/** Moves focus to the new question when the step changes, so screen readers hear it. */
function Heading({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return <h1 ref={ref} tabIndex={-1} style={{ outline: 'none' }}>{children}</h1>;
}

function Frame({ step, part, deco, children }: { step: number; part?: number; deco?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="s grid">
      <div className="meta">
        <span className="eyebrow">{fill(c.step, { n: step })}</span>
        {part ? <span className="small soft">{fill(c.part, { n: part })}</span> : null}
      </div>
      <div className="content">{children}</div>
      {deco ? <div className="deco">{deco}</div> : null}
    </section>
  );
}

export function StartFlow() {
  const { state, ready } = useSession();
  const ok = useStepGuard('/start');
  return (
    <div className="p-start">
      <TopBar />
      <main id="main">
        {!ready || !ok ? <section className="s grid" aria-busy="true"><div className="content" /></section> : <Step step={state.step} />}
      </main>
      <Footer />
    </div>
  );
}

function Step({ step }: { step: string }) {
  switch (step) {
    case 'age_gate': return <AgeGate />;
    case 'content_note': return <Note />;
    case 'input': return <Input />;
    case 'emotion': return <Emotion />;
    case 'appraisal': return <Appraisal />;
    case 'match': return <Match />;
    default: return null;
  }
}

function AgeGate() {
  const { dispatch } = useSession();
  const [no, setNo] = useState(false);
  if (no)
    return (
      <Frame step={1}>
        <Heading>{c.age.noTitle}</Heading>
        <p className="lead">{c.age.noText}</p>
        <p><Link href="/support">{copy.nav.support}</Link></p>
      </Frame>
    );
  return (
    <Frame step={1} deco={<Mark id="mk-ticket" size={210} />}>
      <Heading>{c.age.q}</Heading>
      <div className="actions">
        <button className="btn" onClick={() => dispatch({ t: 'agePass', id: crypto.randomUUID(), ts: Date.now() })}>{c.age.yes}</button>
        <button className="btn paper" onClick={() => setNo(true)}>{c.age.no}</button>
      </div>
    </Frame>
  );
}

function Note() {
  const { dispatch } = useSession();
  return (
    <Frame step={2} deco={<Mark id="mk-lamp" size={170} />}>
      <Heading>{c.note.title}</Heading>
      <p className="lead">{c.note.text}</p>
      <p className="callout"><WellbeingEmail /></p>
      <div className="actions"><button className="btn" onClick={() => dispatch({ t: 'noteOk' })}>{c.note.ok}</button></div>
    </Frame>
  );
}

function Input() {
  const { state, dispatch } = useSession();
  const [text, setText] = useState(state.input.text);
  const [theme, setTheme] = useState(true);
  const next = (skip: boolean) => dispatch({ t: 'setInput', text: skip ? '' : text.trim(), theme, skipped: skip || !text.trim(), ts: Date.now() });
  const canNext = text.trim().length > 0 || theme;
  return (
    <Frame step={3} deco={<Mark id="mk-why" size={150} />}>
      <Heading>{c.input.q}</Heading>
      <p className="lead">{c.input.lead}</p>
      <label className="sr" htmlFor="moment">{c.input.label}</label>
      <textarea id="moment" className="field tall" rows={6} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
      <p className="or">{c.input.orTheme}</p>
      <div className="chips">
        <button className="chip" aria-pressed={theme} onClick={() => setTheme((t) => !t)}>{c.input.themeActive}</button>
        <button className="chip" disabled>{c.input.themeLater}</button>
      </div>
      <div className="actions">
        <button className="btn" disabled={!canNext} onClick={() => next(false)}>{c.input.next}</button>
        <button className="linkbtn" onClick={() => next(true)}>{c.input.skip}</button>
      </div>
    </Frame>
  );
}

function Emotion() {
  const { state, dispatch } = useSession();
  const skipped = state.input.skipped;
  const [phase, setPhase] = useState<'loading' | 'ready' | 'failed'>(skipped || state.emotion.guess ? 'ready' : 'loading');
  const [sel, setSel] = useState<EmotionLabel | null>(state.emotion.final);

  useEffect(() => {
    if (skipped || state.emotion.guess) return;
    let live = true;
    guessEmotion(state.input.text)
      .then((r) => { if (!live) return; dispatch({ t: 'emotionGuess', label: r.label, ts: Date.now() }); setSel(r.label); setPhase('ready'); })
      .catch(() => { if (!live) return; dispatch({ t: 'emotionGuess', label: 'unsure', ts: Date.now() }); setSel(null); setPhase('failed'); });
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guess = state.emotion.guess;
  return (
    <Frame step={4} part={skipped ? undefined : 1} deco={<Mark id="mk-tell" size={150} />}>
      {skipped ? (
        <Heading>{c.emotion.skippedQ}</Heading>
      ) : phase === 'loading' ? (
        <Heading>{c.emotion.reading}</Heading>
      ) : phase === 'failed' ? (
        <Heading>{c.emotion.failedQ}</Heading>
      ) : (
        <Heading>{c.emotion.guess} <b>{guess}</b>. {c.emotion.isRight}</Heading>
      )}
      {phase === 'loading' ? (
        <p className="lead" role="status">{c.emotion.readingNote}</p>
      ) : (
        <>
          <div className="chips" role="group" aria-label={c.emotion.groupLabel}>
            {EMOTION_LABELS.map((l) => (
              <button key={l} className="chip" aria-pressed={sel === l} onClick={() => setSel(l)}>{l}</button>
            ))}
          </div>
          <p className="helper guess-note">{skipped ? c.emotion.skippedSmall : c.emotion.small}</p>
          <div className="actions">
            <button className="btn" disabled={!sel} onClick={() => sel && dispatch({ t: 'emotionFinal', label: sel, ts: Date.now() })}>{c.emotion.next}</button>
          </div>
        </>
      )}
    </Frame>
  );
}

function Appraisal() {
  const { dispatch } = useSession();
  const [sel, setSel] = useState<string | null>(null);
  return (
    <Frame step={4} part={2}>
      <Heading>{c.appraisal.q}</Heading>
      <div className="opt-list" role="radiogroup" aria-label={c.appraisal.q}>
        {c.appraisal.options.map((o) => (
          <button key={o} role="radio" aria-checked={sel === o} className={`opt${sel === o ? ' on' : ''}`} style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--hairline-strong)' }} onClick={() => setSel(o)}>
            <span className="mark" />{o}
          </button>
        ))}
      </div>
      <p className="helper guess-note">{c.appraisal.small}</p>
      <div className="actions"><button className="btn" disabled={!sel} onClick={() => sel && dispatch({ t: 'appraisal', value: sel, ts: Date.now() })}>{c.appraisal.next}</button></div>
    </Frame>
  );
}

function Match() {
  const { state, dispatch } = useSession();
  useEffect(() => {
    if (state.match) return;
    let live = true;
    const body = state.input.text ? { text: state.input.text, theme: state.input.theme ? 'photo' : undefined } : { theme: 'photo' };
    matchStory(body)
      .then((r) => live && dispatch({ t: 'matchResult', confidence: r.confidence, note: r.note ?? null }))
      .catch(() => live && dispatch({ t: 'matchResult', confidence: 0.3, note: c.match.oneStory }));
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!state.match) return <Frame step={5}><Heading>{c.match.finding}</Heading></Frame>;
  return (
    <Frame step={5}>
      <Heading>{c.match.title}</Heading>
      <p className="callout">{c.match.reminder} <WellbeingEmail /></p>
      <div className="prog">
        <div className="in">
          <div className="thumb"><SceneArt id="s1" mode="home" /></div>
          <h2>{c.match.story}</h2>
          <p>{c.match.meta}</p>
          <button className="btn" onClick={() => dispatch({ t: 'begin', ts: Date.now() })}>{c.match.begin}</button>
        </div>
      </div>
      {state.match.note ? <p className="lead" style={{ marginTop: 28 }}>{c.match.oneStory}</p> : null}
    </Frame>
  );
}
