'use client';

import { useCallback } from 'react';
import { useSession } from '@/components/SessionProvider';
import { scoreAnswer } from './ai/client';
import type { Criterion } from './ai/types';
import type { AnswerKey } from './engine/types';

const CRITERION: Record<AnswerKey, Criterion> = { why1: 'analysis', why2: 'evaluation', reflect: 'inference' };

/** Everything a written answer can do: change the draft, send it, retry, skip, go on. */
export function useAnswer(key: AnswerKey) {
  const { state, dispatch } = useSession();
  const a = key === 'reflect' ? state.reflect : state.why[key];

  const send = useCallback(async (text: string) => {
    const attempt = a.attempt;
    dispatch({ t: 'submit', key, text, ts: Date.now() });
    try {
      const resp = await scoreAnswer({
        sessionId: state.sessionId ?? 'no-session',
        promptId: key,
        criterion: CRITERION[key],
        answer: text,
        attempt,
        context: { d1: state.choices.d1, d2: state.choices.d2, d3: state.choices.d3 },
      });
      dispatch({ t: 'scored', key, text, resp, ts: Date.now() });
    } catch {
      dispatch({ t: 'failed', key, ts: Date.now() });
    }
  }, [a.attempt, dispatch, key, state.sessionId, state.choices]);

  return {
    a,
    send,
    draft: (text: string) => dispatch({ t: 'draft', key, text }),
    skipPrimary: () => dispatch({ t: 'skipPrimary', key, ts: Date.now() }),
    skipFollowup: () => dispatch({ t: 'skipFollowup', key, ts: Date.now() }),
    goOn: () => dispatch({ t: 'ackContinue', key, ts: Date.now() }),
    continueUnscored: () => dispatch({ t: 'continueUnscored', key, ts: Date.now() }),
  };
}
