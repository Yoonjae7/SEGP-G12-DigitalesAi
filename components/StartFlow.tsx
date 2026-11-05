'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { copy, fill } from '@/lib/copy';
import { Footer, TopBar } from './Brand';
import { WellbeingEmail } from './Contact';
import { Mark } from './Marks';
import { SceneArt } from './SceneArt';
import { ComingSoon } from './Stories';
import { useSession, useStepGuard } from './SessionProvider';

const c = copy.start;

/** Moves focus to the new question when the step changes, so screen readers hear it. */
function Heading({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return <h1 ref={ref} tabIndex={-1} style={{ outline: 'none' }}>{children}</h1>;
}

function Frame({ step, deco, children }: { step: number; deco?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="s grid">
      <div className="meta">
        <span className="eyebrow">{fill(c.step, { n: step })}</span>
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
    case 'ready': return <Ready />;
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
      <p className="lead">{c.note.sound}</p>
      <p className="callout"><WellbeingEmail /></p>
      <div className="actions"><button className="btn" onClick={() => dispatch({ t: 'noteOk' })}>{c.note.ok}</button></div>
    </Frame>
  );
}

function Ready() {
  const { dispatch } = useSession();
  return (
    <Frame step={3}>
      <Heading>{c.ready.title}</Heading>
      <p className="callout">{c.ready.reminder} <WellbeingEmail /></p>
      <div className="prog">
        <div className="in">
          <div className="thumb"><SceneArt id="s1" mode="home" /></div>
          <h2>{c.ready.story}</h2>
          <p className="story-title">{copy.stories.one.title}</p>
          <p>{c.ready.meta}</p>
          <button className="btn" onClick={() => dispatch({ t: 'begin', ts: Date.now() })}>{c.ready.begin}</button>
        </div>
      </div>
      <ul className="shelf-mini" aria-label={copy.stories.label}><ComingSoon /></ul>
    </Frame>
  );
}
