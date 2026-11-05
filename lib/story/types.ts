import { z } from 'zod';

/** Everything the learner reads or hears comes from content/story.json. These are its types. */
export const SpeakerSchema = z.enum(['narrator', 'lisa', 'sarah', 'marco', 'dev', 'you', 'screen']);
export type Speaker = z.infer<typeof SpeakerSchema>;

export const ConditionSchema = z.object({
  d1: z.enum(['private', 'group']).optional(),
  d2: z.enum(['tell', 'delete']).optional(),
  d3: z.enum(['accept', 'hold']).optional(),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const LineSchema = z.object({
  id: z.string(), // "s1_03". Also the audio file name.
  speaker: SpeakerSchema,
  kind: z.enum(['narration', 'dialogue', 'chat', 'screen']),
  text: z.string(),
  voiced: z.boolean(), // false for 'screen' and 'you'
  pose: z.string().optional(),
  expression: z.string().optional(),
  showPhotoTile: z.boolean().optional(),
  when: ConditionSchema.optional(), // show only if earlier choices match
});
export type Line = z.infer<typeof LineSchema>;

export const OptionSchema = z.object({ id: z.string(), label: z.string(), sub: z.string(), beat: z.array(LineSchema) });
export type Option = z.infer<typeof OptionSchema>;

export const DecisionSchema = z.object({
  id: z.enum(['d1', 'd2', 'd3']),
  scene: z.string(),
  prompt: z.string(),
  options: z.tuple([OptionSchema, OptionSchema]),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const WhySchema = z.object({
  id: z.enum(['why1', 'why2']),
  criterion: z.enum(['analysis', 'evaluation']),
  after: z.string(),
  scene: z.string(),
  question: z.string(),
  helper: z.string(),
  followups: z.record(z.string(), z.string()), // keyed by rule, e.g. "why1_fu_consequence"
  harder: z.string(),
  nudge: z.string(),
  ackFollowup: z.string(),
  ackHarder: z.string(),
  skipped: z.string(),
});
export type Why = z.infer<typeof WhySchema>;

export const StageCharacterSchema = z.object({
  id: z.enum(['sarah', 'lisa', 'marco', 'dev', 'you']),
  view: z.enum(['front', 'back', 'side']),
  pose: z.string(),
  expression: z.string().optional(),
});
export type StageCharacter = z.infer<typeof StageCharacterSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  n: z.number(),
  title: z.string(),
  art: z.string(),
  description: z.string(),
  chat: z.string().optional(),
  stage: z.object({ set: z.string(), characters: z.array(StageCharacterSchema) }),
  lines: z.array(LineSchema),
});
export type Scene = z.infer<typeof SceneSchema>;

export const EndingSchema = z.object({
  id: z.enum(['A', 'B']),
  title: z.string(),
  art: z.string(),
  description: z.string(),
  stage: z.object({ set: z.string(), characters: z.array(StageCharacterSchema) }),
  lines: z.array(LineSchema),
  ask: z.object({ question: z.string(), taps: z.array(z.string()) }),
  explain: z.array(z.string()),
  explainIfSkipped: z.string().optional(),
});
export type Ending = z.infer<typeof EndingSchema>;

export const StorySchema = z.object({
  id: z.string(),
  title: z.string(),
  banner: z.string(),
  scenes: z.array(SceneSchema),
  decisions: z.object({ d1: DecisionSchema, d2: DecisionSchema, d3: DecisionSchema }),
  whys: z.object({ why1: WhySchema, why2: WhySchema }),
  endings: z.object({ A: EndingSchema, B: EndingSchema }),
  choiceLines: z.record(z.string(), z.string()),
  closing: z.string(),
  reflect: z.object({
    offer: z.string(),
    scenario: z.string(),
    question: z.string(),
    ref_fu_next: z.string(),
    ref_harder: z.string(),
    ref_ack: z.string(),
  }),
});
export type Story = z.infer<typeof StorySchema>;
