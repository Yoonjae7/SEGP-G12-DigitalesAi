import { z } from 'zod';

/** The shapes every provider must speak. Demo mode and a real model use exactly these. */
export const CriterionSchema = z.enum(['analysis', 'evaluation', 'inference']);
export type Criterion = z.infer<typeof CriterionSchema>;

export const ScoreRequestSchema = z.object({
  sessionId: z.string().min(1).max(100),
  promptId: z.string().min(1).max(60),
  criterion: CriterionSchema,
  answer: z.string().max(4000),
  attempt: z.union([z.literal(1), z.literal(2)]),
  context: z.object({ d1: z.string().optional(), d2: z.string().optional(), d3: z.string().optional() }).default({}),
});
export type ScoreRequest = z.infer<typeof ScoreRequestSchema>;

export const ScoreResponseSchema = z.object({
  requestId: z.string(),
  criterion: CriterionSchema,
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]), // internal only. Never shown to the learner.
  flags: z.record(z.string(), z.unknown()), // parties, responsibility, consequence, reason, counterview, vague
  evidence: z.array(z.string()).max(2), // up to 2 snippets, 8 words each
  rule: z.string(), // e.g. "A-THIN-NO-CONSEQUENCE"
  next: z.object({
    type: z.enum(['followup', 'harder', 'nudge', 'continue']),
    textId: z.string().optional(),
  }),
  safety: z.boolean(), // true if the answer suggests real harm
  model: z.object({ provider: z.string(), version: z.string() }),
  latencyMs: z.number(),
});
export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;

export interface CallOptions {
  /** Demo only: force this call to fail so the error state can be shown. */
  forceFail?: boolean;
}

export interface AiProvider {
  name: string;
  version: string;
  score(req: ScoreRequest, opts?: CallOptions): Promise<ScoreResponse>;
}
