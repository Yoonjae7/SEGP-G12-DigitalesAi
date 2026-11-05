import { describe, expect, it } from 'vitest';
import { scoreText } from '@/lib/ai/providers/mock';
import type { ScoreRequest } from '@/lib/ai/types';

const why1 = (answer: string, attempt: 1 | 2 = 1): ScoreRequest => ({ sessionId: 't', promptId: 'why1', criterion: 'analysis', answer, attempt, context: {} });
const why2 = (answer: string, attempt: 1 | 2 = 1): ScoreRequest => ({ sessionId: 't', promptId: 'why2', criterion: 'evaluation', answer, attempt, context: {} });
const refl = (answer: string, attempt: 1 | 2 = 1): ScoreRequest => ({ sessionId: 't', promptId: 'reflect', criterion: 'inference', answer, attempt, context: {} });

describe('mock scoring: Why 1 (analysis)', () => {
  it('5a. one sentence naming one person gives the "who else" follow-up', () => {
    const r = scoreText(why1('Lisa posted it, so it is her fault.'));
    expect(r.level).toBe(1);
    expect(r.rule).toBe('A-THIN-PARTIES');
    expect(r.next).toEqual({ type: 'followup', textId: 'why1_fu_parties' });
  });
  it('5b. a very short answer gives the nudge', () => {
    const r = scoreText(why1('Lisa is wrong'));
    expect(r.level).toBe(0);
    expect(r.rule).toBe('A-NUDGE');
    expect(r.next).toEqual({ type: 'nudge', textId: 'why1_nudge' });
  });
  it('5c. a thorough answer gets the harder question', () => {
    const r = scoreText(why1('Lisa posted it without asking. Marco and Dev forwarded it, which spread it. Sarah could be humiliated, and I should have spoken up sooner.'));
    expect(r.level).toBe(3);
    expect(r.rule).toBe('A-SOLID-HARDER');
    expect(r.next).toEqual({ type: 'harder', textId: 'why1_harder' });
  });
  it('6. Lisa and the forwarders and what each did, with no consequence, asks for a consequence', () => {
    const r = scoreText(why1('Lisa posted the photo. Marco and Dev forwarded it.'));
    expect(r.level).toBe(2);
    expect(r.rule).toBe('A-THIN-NO-CONSEQUENCE');
    expect(r.next.textId).toBe('why1_fu_consequence');
  });
  it('a good first try that misses the consequence gets the consequence follow-up', () => {
    const r = scoreText(why1('Lisa posted the photo and Marco and Dev passed it on. I should have said something sooner.'));
    expect(r.next.textId).toBe('why1_fu_consequence');
  });
  it('vague blame gets the "split it up" follow-up', () => {
    const r = scoreText(why1('It is all her fault and everyone is to blame for this mess.'));
    expect(r.rule).toBe('A-THIN-VAGUE');
    expect(r.next.textId).toBe('why1_fu_split');
  });
  it('names two people but not what each did gets the "split it up" follow-up', () => {
    const r = scoreText(why1('I think Lisa and Sarah are both part of this story somehow.'));
    expect(r.level).toBe(1);
    expect(r.rule).toBe('A-THIN-VAGUE');
  });
  it('is deterministic: the same words always give the same result', () => {
    const t = 'Lisa posted it and the forwarders spread it, which hurt Sarah.';
    expect(scoreText(why1(t))).toEqual(scoreText(why1(t)));
  });
  it('different words give different results', () => {
    expect(scoreText(why1('Lisa posted it, so it is her fault.')).level).not.toBe(scoreText(why1('Lisa is wrong')).level);
  });
  it('mostly repeated characters is level 0', () => {
    expect(scoreText(why1('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).level).toBe(0);
  });
  it('gives up to 2 snippets of 8 words or fewer', () => {
    const r = scoreText(why1('Lisa posted it without asking. Marco and Dev forwarded it, which spread it. Sarah could be humiliated.'));
    expect(r.evidence.length).toBeLessThanOrEqual(2);
    for (const e of r.evidence) expect(e.split(/\s+/).length).toBeLessThanOrEqual(8);
  });
  it('on a second attempt there is no second follow-up', () => {
    const r = scoreText(why1('Lisa posted it. Sarah could be humiliated because of it.', 2));
    expect(r.next.type).toBe('continue');
    expect(r.rule).toBe('A-ATTEMPT2');
  });
});

describe('mock scoring: Why 2 (evaluation)', () => {
  it('a view with no reason asks for a reason', () => {
    const r = scoreText(why2('I do not agree with what Lisa said there.'));
    expect(r.level).toBe(1);
    expect(r.next.textId).toBe('why2_fu_reason');
  });
  it('a view and a reason asks for a consequence', () => {
    const r = scoreText(why2('I do not agree with Lisa. She should have asked first because Sarah did not consent.'));
    expect(r.level).toBe(2);
    expect(r.rule).toBe('E-THIN-NO-CONSEQUENCE');
    expect(r.next.textId).toBe('why2_fu_consequence');
  });
  it('a view, a reason and a consequence gets the harder question', () => {
    const r = scoreText(why2('I disagree with her because Sarah could be humiliated once it spreads, even if Lisa meant it as a joke.'));
    expect(r.level).toBe(3);
    expect(r.next).toEqual({ type: 'harder', textId: 'why2_harder' });
  });
  it('a very short answer gives the nudge', () => {
    expect(scoreText(why2('No')).next).toEqual({ type: 'nudge', textId: 'why2_nudge' });
  });
});

describe('mock scoring: Reflect (inference) and safety', () => {
  it('levels climb with outcome, who, and what happens after', () => {
    expect(scoreText(refl('It would hurt the person a lot.')).level).toBe(1);
    expect(scoreText(refl('It would hurt a classmate in the class group.')).level).toBe(2);
    const r = scoreText(refl('It would hurt a classmate, and then people would pass it on and it spreads.'));
    expect(r.level).toBe(3);
    expect(r.next.textId).toBe('ref_harder');
  });
  it('a safety phrase is never scored and shows support instead', () => {
    const r = scoreText(why1('Honestly I want to hurt myself because of what happened to me.'));
    expect(r.safety).toBe(true);
    expect(r.level).toBe(0);
    expect(r.next.type).toBe('continue');
    expect(r.rule).toBe('A-SAFETY');
  });
});

