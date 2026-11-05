import type { z } from 'zod';
import { failFlag } from './failFlag';
import { ScoreResponseSchema } from './types';
import type { ScoreRequest, ScoreResponse } from './types';

/** Browser side of the scoring route. The browser never knows which provider answers. */
export class AiError extends Error {}
const TIMEOUT_MS = 10_000;

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

