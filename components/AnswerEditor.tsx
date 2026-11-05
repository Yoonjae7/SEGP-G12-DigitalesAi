'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { copy } from '@/lib/copy';
import type { AnswerKey } from '@/lib/engine/types';
import { useAnswer } from '@/lib/useAnswer';
import { WellbeingEmail } from './Contact';
import { useSession } from './SessionProvider';

/**
 * The writing part of a "why" or the Reflect: ask, read, follow-up, error, thank-you, support.
 * The learner never sees a score. The follow-up text is written by the team. The reader only picks which one shows.
 */
export function AnswerEditor({ k, helper }: { k: AnswerKey; helper: string }) {
  const { a, send, draft, skipPrimary, skipFollowup, goOn, continueUnscored } = useAnswer(k);
  const { dispatch } = useSession();
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const w = copy.player.why;
  const text = a.draft.trim();
  const isReflect = k === 'reflect';

  // The box grows with the answer. Three rows to start.
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.max(el.scrollHeight, 88)}px`; }
  }, [a.draft, a.phase, a.attempt]);

  // These are called as plain functions, never used as <Tags>. A component made inside this one is a new type on
  // every render, so React would rebuild the box after each key and the learner could only type one letter.
  const quote = a.attempt === 1 ? a.draft : a.text1 ?? '';
  const yours = () => (quote ? <blockquote className="yours"><span className="eyebrow">{w.yours}</span>{quote}</blockquote> : null);
  const prompt = () => (
    <div className="fu">
      <span className="eyebrow"><i className="dot" aria-hidden="true" />{w.question}</span>
      {a.prompt.kind === 'followup' || a.prompt.kind === 'harder' || a.prompt.kind === 'nudge' ? (
        a.prompt.kind === 'followup' && a.prompt.text.includes('what could happen to Sarah') ? (
          <>{a.prompt.text.split('what could happen to Sarah')[0]}<span className="hl">what could happen to Sarah</span>{a.prompt.text.split('what could happen to Sarah')[1]}</>
        ) : a.prompt.text
      ) : null}
    </div>
  );
  const box = (label: string) => (
    <>
      <label className="sr" htmlFor={`ans-${k}`}>{label}</label>
      <textarea
        id={`ans-${k}`} ref={ref} className="field" rows={3} value={a.draft} maxLength={4000}
        onChange={(e) => draft(e.target.value)}
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && text) void send(text); }}
      />
    </>
  );

  if (a.phase === 'reading')
    return (
      <div aria-live="polite">
        {yours()}
        <p className="reading" role="status">{w.reading}</p>
        <span className="dots" aria-hidden="true"><i /><i /><i /></span>
      </div>
    );

  if (a.phase === 'error')
    return (
      <div>
        {a.attempt === 2 ? prompt() : null}
        {box(w.yourReply)}
        <div className="errbox" role="alert" style={{ marginTop: 20 }}>{copy.player.error.text}</div>
        <div className="actions">
          <button className="btn" onClick={() => void send(text)} disabled={!text}>{copy.player.error.retry}</button>
          {a.failures >= 2 ? <button className="btn paper" onClick={continueUnscored}>{copy.player.error.continue}</button> : null}
        </div>
      </div>
    );

  if (a.phase === 'ack')
    return (
      <div>
        <p className="reading" role="status" style={{ marginBottom: 20 }}>{a.ack}</p>
        <div className="actions"><button className="btn" onClick={goOn}>{w.goOn}</button></div>
      </div>
    );

  if (a.phase === 'support')
    return (
      <div role="status">
        <div className="fu" style={{ borderLeftColor: 'var(--moss)' }}>
          {copy.player.support.text} <WellbeingEmail />
        </div>
        <div className="actions">
          <button className="btn" onClick={goOn}>{copy.player.support.carry}</button>
          <button className="btn paper" onClick={() => { dispatch({ t: 'log', event: 'exit', payload: { from: 'support_card' }, ts: Date.now() }); router.push('/'); }}>{copy.player.support.exit}</button>
        </div>
      </div>
    );

  // ask
  if (a.attempt === 1)
    return (
      <div>
        {box(w.yours)}
        <p className="helper">{helper}</p>
        <div className="actions">
          <button className="btn" disabled={!text} onClick={() => void send(text)}>{w.send}</button>
          <button className="linkbtn" onClick={isReflect ? skipFollowup : skipPrimary}>{isReflect ? w.skip : w.rather}</button>
        </div>
      </div>
    );
  return (
    <div>
      {yours()}
      {prompt()}
      {box(w.yourReply)}
      <div className="actions">
        <button className="btn" disabled={!text} onClick={() => void send(text)}>{w.sendShort}</button>
        <button className="linkbtn" onClick={skipFollowup}>{w.skip}</button>
      </div>
    </div>
  );
}
