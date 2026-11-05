import type { ScoreResponse } from '../ai/types';
import type { EventName } from '../log/events';
import type { Story } from '../story/types';
import type { AnswerKey, AnswerState } from './types';

/** Resolve a team-written text by its id. The AI only ever picks the id. */
export function resolveText(story: Story, key: AnswerKey, textId?: string): string | null {
  if (!textId) return null;
  if (key === 'reflect') return (story.reflect as Record<string, string>)[textId] ?? null;
  const w = story.whys[key];
  if (textId === `${key}_nudge`) return w.nudge;
  if (textId === `${key}_harder`) return w.harder;
  if (textId === `${key}_ack_followup`) return w.ackFollowup;
  if (textId === `${key}_ack_harder`) return w.ackHarder;
  return w.followups[textId] ?? null;
}

export function questionFor(story: Story, key: AnswerKey): string {
  return key === 'reflect' ? story.reflect.question : story.whys[key].question;
}

export function freshAnswer(story: Story, key: AnswerKey, offer = false): AnswerState {
  return {
    phase: offer ? 'offer' : 'ask',
    attempt: 1,
    prompt: { kind: 'question', text: questionFor(story, key) },
    draft: '',
    text1: null, text2: null, level1: null, level2: null,
    final: 0, skipped: false, unscored: false, failures: 0, ack: null, support: false,
  };
}

type LogItem = [EventName, Record<string, unknown>];
const REFLECT = (e: string): EventName => `reflect_${e}`;

/**
 * Apply one score response to one written answer.
 * The learner answers once more at most. The higher of the two levels is kept. A second answer never lowers the first.
 * There is no second follow-up.
 */
export function applyScore(story: Story, key: AnswerKey, a: AnswerState, text: string, resp: ScoreResponse): { a: AnswerState; log: LogItem[] } {
  const log: LogItem[] = [['score_response', { promptId: key, attempt: a.attempt, answer: text, response: resp }]];
  if (resp.flags?.fallback_to_mock) log.push(['fallback_to_mock', { promptId: key }]);
  const next: AnswerState = { ...a, draft: '', failures: 0 };
  const isReflect = key === 'reflect';

  if (resp.safety) {
    // Do not score. Show the support card, log it, let the learner continue or exit.
    if (a.attempt === 1) { next.text1 = text; next.level1 = 0; } else { next.text2 = text; next.level2 = 0; }
    next.phase = 'support';
    next.support = true;
    next.final = Math.max(next.final, 0);
    log.push(['support_shown', { promptId: key }]);
    return { a: next, log };
  }

  if (a.attempt === 1) {
    next.text1 = text;
    next.level1 = resp.level;
    next.final = resp.level;
    const t = resolveText(story, key, resp.next.textId);
    if (resp.next.type === 'nudge' && t) {
      next.attempt = 2;
      next.phase = 'ask';
      next.prompt = { kind: 'nudge', text: t };
      log.push(['nudge_shown', { promptId: key, textId: resp.next.textId }]);
    } else if ((resp.next.type === 'followup' || resp.next.type === 'harder') && t) {
      next.attempt = 2;
      next.phase = 'ask';
      next.prompt = { kind: resp.next.type, text: t };
      log.push([isReflect ? REFLECT(`${resp.next.type}_shown`) : resp.next.type === 'harder' ? 'harder_shown' : 'followup_shown', { promptId: key, textId: resp.next.textId }]);
    } else {
      next.phase = 'done';
    }
    return { a: next, log };
  }

  // attempt 2
  next.text2 = text;
  next.level2 = resp.level;
  next.final = Math.max(a.level1 ?? 0, resp.level);
  const kind = a.prompt.kind;
  if (isReflect) next.ack = story.reflect.ref_ack;
  else if (kind === 'harder') next.ack = story.whys[key].ackHarder;
  else if (kind === 'followup') next.ack = story.whys[key].ackFollowup;
  else next.ack = resp.level > 0 ? story.whys[key].ackFollowup : null; // still empty after a nudge: just continue
  next.phase = next.ack ? 'ack' : 'done';
  return { a: next, log };
}

/** "I would rather not answer": logged, a short text, counts as level 0 for the ending. */
export function skipPrimary(story: Story, key: AnswerKey, a: AnswerState): { a: AnswerState; log: LogItem[] } {
  const ack = key === 'reflect' ? null : story.whys[key].skipped;
  return {
    a: { ...a, skipped: true, final: 0, level1: 0, draft: '', phase: ack ? 'ack' : 'done', ack },
    log: [[key === 'reflect' ? REFLECT('skipped') : 'skipped', { promptId: key, kind: 'primary' }]],
  };
}

/** Skip on a follow-up or a harder question. No penalty. The first answer's level stands. */
export function skipFollowup(key: AnswerKey, a: AnswerState): { a: AnswerState; log: LogItem[] } {
  return {
    a: { ...a, draft: '', phase: 'done', final: Math.max(a.final, a.level1 ?? 0) },
    log: [[key === 'reflect' ? REFLECT('skipped') : 'skipped', { promptId: key, kind: a.prompt.kind }]],
  };
}

/** After two failures the learner may go on without a follow-up. The answer stays unscored. */
export function continueUnscored(key: AnswerKey, a: AnswerState): { a: AnswerState; log: LogItem[] } {
  return {
    a: { ...a, phase: 'done', unscored: true, failures: 0, final: Math.max(a.final, a.level1 ?? 0) },
    log: [['score_unavailable', { promptId: key, attempt: a.attempt }]],
  };
}
