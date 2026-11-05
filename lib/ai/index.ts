import { llmProvider } from './providers/llm';
import { mockProvider } from './providers/mock';
import { EmotionResponseSchema, MatchResponseSchema, ScoreResponseSchema } from './types';
import type { AiProvider, CallOptions, EmotionResponse, MatchResponse, ScoreRequest, ScoreResponse } from './types';

/**
 * The only place that knows which provider answers. The browser never does.
 * AI_PROVIDER=mock (default) or llm. A real provider is validated, retried once, then falls back to the mock.
 */
export function getProvider(): AiProvider {
  return process.env.AI_PROVIDER === 'llm' ? llmProvider : mockProvider;
}

async function withFallback<T>(call: (p: AiProvider) => Promise<T>, validate: (v: unknown) => T, markFallback: (v: T) => T): Promise<T> {
  const p = getProvider();
  if (p === mockProvider) return call(mockProvider);
  for (let i = 0; i < 2; i++) {
    try {
      return validate(await call(p));
    } catch {
      /* retry once */
    }
  }
  return markFallback(await call(mockProvider)); // fallback_to_mock
}

export function score(req: ScoreRequest, opts?: CallOptions): Promise<ScoreResponse> {
  return withFallback(
    (p) => p.score(req, opts),
    (v) => ScoreResponseSchema.parse(v),
    (v) => ({ ...v, flags: { ...v.flags, fallback_to_mock: true } }),
  );
}
export function emotion(text: string, opts?: CallOptions): Promise<EmotionResponse> {
  return withFallback((p) => p.emotion(text, opts), (v) => EmotionResponseSchema.parse(v), (v) => v);
}
export function match(input: { text?: string; theme?: string }, opts?: CallOptions): Promise<MatchResponse> {
  return withFallback((p) => p.match(input, opts), (v) => MatchResponseSchema.parse(v), (v) => v);
}
