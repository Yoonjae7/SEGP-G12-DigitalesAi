'use client';

import { useEffect, useRef, useState } from 'react';
import { copy, fill } from '@/lib/copy';
import { anySkipped } from '@/lib/engine/state';
import { buildFeedback } from '@/lib/engine/endings';
import { story } from '@/lib/story';
import { Footer, TopBar } from './Brand';
import { Mark } from './Marks';
import { useSession } from './SessionProvider';

const F = copy.feedback;

/** Feedback asks first, then explains. The tap is logged and not graded. The banner is on both steps. */
export function Feedback() {
  const { state, dispatch } = useSession();
  const ending = state.ending ?? 'B';
  const fb = buildFeedback(story, ending, state.choices, anySkipped(state));
  const e = story.endings[ending];
  const explain = state.feedback.phase === 'explain';
  const head = useRef<HTMLHeadingElement>(null);
  const [sel, setSel] = useState<string | null>(state.feedback.tap);
  useEffect(() => head.current?.focus({ preventScroll: true }), [explain]);

  return (
    <div className="p-ending">
      <TopBar />
      <main className="fb grid">
        <div className="main">
          <p className="banner">{F.banner}</p>
          <span className="eyebrow">{e.title}</span>
          {!explain ? (
            <>
              <h1 ref={head} tabIndex={-1} style={{ outline: 'none' }}>{fb.question}</h1>
              <div className="opt-list" role="radiogroup" aria-label={fb.question}>
                {fb.taps.map((t) => (
                  <button key={t} role="radio" aria-checked={sel === t} className={`opt${sel === t ? ' on' : ''}`}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--hairline-strong)' }}
                    onClick={() => { setSel(t); dispatch({ t: 'feedbackTap', value: t, ts: Date.now() }); }}>
                    <span className="mark" />{t}
                  </button>
                ))}
              </div>
              <p className="helper">{F.notGraded}</p>
              <div className="actions"><button className="btn" onClick={() => dispatch({ t: 'feedbackExplain' })}>{F.show}</button></div>
            </>
          ) : (
            <>
              <h1 ref={head} tabIndex={-1} style={{ outline: 'none' }}>{F.happened}</h1>
              {fb.paragraphs.map((p, i) => <p className="para n" data-n={i + 1} key={i}>{p}</p>)}
              <div className="choices">
                <h2>{F.choices}</h2>
                <ul>
                  {fb.choices.map((c) => (
                    <li key={c.n}><span className="k">{fill(F.decision, { n: c.n })}</span><span>{c.line}</span></li>
                  ))}
                </ul>
              </div>
              <p className="closing">{fb.closing}</p>
              <div className="actions"><button className="btn" onClick={() => dispatch({ t: 'feedbackDone', ts: Date.now() })}>{F.continue}</button></div>
            </>
          )}
        </div>
        <div className="side"><Mark id="mk-see" size={150} /></div>
      </main>
      <Footer />
    </div>
  );
}
