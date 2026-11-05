import type { z } from 'zod';
import { readLab } from '../log/lab';
import { EmotionResponseSchema, MatchResponseSchema, ScoreResponseSchema } from './types';
import type { EmotionResponse, MatchResponse, ScoreRequest, ScoreResponse } from './types';

/** Browser side of the three routes. The browser never knows which provider answers. */
export class AiError extends Error {}
const TIMEOUT_MS = 10_000;

/** ?fail=1 on any page turns on the demo error path for this tab. ?fail=0 turns it off. The Lab switch does the same. */
function failFlag(): boolean {
  try {
    const q = new URLSearchParams(location.search).get('fail');
    if (q === '1') sessionStorage.setItem('dt_fail', '1');
    if (q === '0') sessionStorage.removeItem('dt_fail');
    return sessionStorage.getItem('dt_fail') === '1' || readLab().forceFail;
  } catch {
    return false;
  }
}

async function post<S extends z.ZodTypeAny>(path: string, body: unknown, schema: S): Promise<z.infer<S>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path + (failFlag() ? '?fail=1' : ''), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new AiError(`status ${res.status}`);
    return schema.parse(await res.json());
  } catch (e) {
    throw e instanceof AiError ? e : new AiError('request failed');
  } finally {
    clearTimeout(timer);
  }
}

export const scoreAnswer = (req: ScoreRequest): Promise<ScoreResponse> => post('/api/score', req, ScoreResponseSchema);
export const guessEmotion = (text: string): Promise<EmotionResponse> => post('/api/emotion', { text }, EmotionResponseSchema);
export const matchStory = (input: { text?: string; theme?: string }): Promise<MatchResponse> => post('/api/match', input, MatchResponseSchema);
