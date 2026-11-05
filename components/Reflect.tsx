'use client';

import { useEffect, useRef } from 'react';
import { copy } from '@/lib/copy';
import { story } from '@/lib/story';
import { AnswerEditor } from './AnswerEditor';
import { Footer, TopBar } from './Brand';
import { Mark } from './Marks';
import { useSession } from './SessionProvider';

const R = copy.reflect;

/** Optional. One more short, similar moment, with the same kind of written answer. Skippable. */
export function Reflect() {
  const { state, dispatch } = useSession();
  const a = state.reflect;
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => head.current?.focus({ preventScroll: true }), [a.phase]);

  return (
    <div className="p-reflect">
      <TopBar />
      <main>
        {a.phase === 'offer' ? (
          <section className="s grid">
            <div className="meta"><span className="eyebrow">{R.optional}</span></div>
            <div className="content">
              <h1 ref={head} tabIndex={-1} style={{ outline: 'none' }}>{story.reflect.offer}</h1>
              <p className="lead">{R.offerNote}</p>
              <div className="actions">
                <button className="btn" onClick={() => dispatch({ t: 'reflectAccept', ts: Date.now() })}>{R.yes}</button>
                <button className="btn paper" onClick={() => dispatch({ t: 'reflectDecline', ts: Date.now() })}>{R.no}</button>
              </div>
            </div>
            <div className="deco"><Mark id="mk-choice" size={170} /></div>
          </section>
        ) : (
          <section className="s grid">
            <div className="meta"><span className="eyebrow">{R.oneMore}</span></div>
            <div className="content">
              <h1 ref={head} tabIndex={-1} style={{ outline: 'none', position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{R.oneMore}</h1>
              <div className="scenario"><p>{story.reflect.scenario}</p></div>
              <p className="q">{story.reflect.question}</p>
              <AnswerEditor k="reflect" helper={R.helper} />
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
