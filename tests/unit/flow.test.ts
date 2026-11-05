import { describe, expect, it } from 'vitest';
import { scoreText } from '@/lib/ai/providers/mock';
import type { ScoreRequest, ScoreResponse } from '@/lib/ai/types';
import { decideEnding, buildFeedback } from '@/lib/engine/endings';
import { buildTimeline, canGoBack, type TItem } from '@/lib/engine/flow';
import { currentItem, initialState, reducer, timeline, type Action } from '@/lib/engine/state';
import type { AnswerKey, Choices, SessionState } from '@/lib/engine/types';
import { story } from '@/lib/story';

const D1 = ['private', 'group'] as const, D2 = ['tell', 'delete'] as const, D3 = ['accept', 'hold'] as const;
const COMBOS: Choices[] = D1.flatMap((d1) => D2.flatMap((d2) => D3.map((d3) => ({ d1, d2, d3 }))));

const THIN = 'Lisa posted it, so it is her fault.';
const SOLID1 = 'Lisa posted it without asking. Marco and Dev forwarded it, which spread it. Sarah could be humiliated, and I should have spoken up sooner.';
const SOLID2 = 'I disagree with her because Sarah could be humiliated once it spreads, even if Lisa meant it as a joke.';
const MID2 = 'I do not agree with Lisa. She should have asked first because Sarah did not consent.';

let t = 1000;
const run = (s: SessionState, ...actions: Action[]) => actions.reduce(reducer, s);
const ts = () => (t += 10);
const resp = (req: ScoreRequest): ScoreResponse => ({ requestId: 'x', ...scoreText(req), model: { provider: 'mock', version: '1.0.0' }, latencyMs: 1 });

function start(): SessionState {
  let s = initialState();
  s = run(s, { t: 'agePass', id: 'test-session', ts: ts() }, { t: 'noteOk' }, { t: 'begin', ts: ts() });
  return s;
}
function toDecision(s: SessionState): SessionState {
  let guard = 0;
  while (['line', 'ending-title'].includes(currentItem(s)?.type ?? '') && guard++ < 200) s = reducer(s, { t: 'advance', ts: ts() });
  return s;
}
function answer(s: SessionState, key: AnswerKey, texts: string[]): SessionState {
  for (const text of texts) {
    const a = key === 'reflect' ? s.reflect : s.why[key];
    s = reducer(s, { t: 'submit', key, text, ts: ts() });
    const req: ScoreRequest = { sessionId: 'test-session', promptId: key, criterion: key === 'why1' ? 'analysis' : key === 'why2' ? 'evaluation' : 'inference', answer: text, attempt: a.attempt, context: {} };
    s = reducer(s, { t: 'scored', key, text, resp: resp(req), ts: ts() });
    const now = key === 'reflect' ? s.reflect : s.why[key];
    if (now.phase === 'ack') s = reducer(s, { t: 'ackContinue', key, ts: ts() });
    if (now.phase === 'done') break;
  }
  return s;
}
/** Plays the whole story with the given choices and written answers. */
function play(c: Choices, why1: string[], why2: string[]): SessionState {
  let s = toDecision(start());
  s = reducer(s, { t: 'choose', id: 'd1', value: c.d1!, ts: ts() });
  s = toDecision(s); // S3 lines, then Why 1
  expect(currentItem(s)?.type).toBe('why');
  s = answer(s, 'why1', why1);
  s = toDecision(s); // S4
  s = reducer(s, { t: 'choose', id: 'd2', value: c.d2!, ts: ts() });
  s = toDecision(s);
  s = reducer(s, { t: 'choose', id: 'd3', value: c.d3!, ts: ts() });
  s = toDecision(s);
  expect(currentItem(s)?.type).toBe('why');
  s = answer(s, 'why2', why2);
  return toDecision(s);
}

describe('flow and branching', () => {
  it('1. all 8 choice combinations reach S7 and an ending', () => {
    for (const c of COMBOS) {
      const s = play(c, [SOLID1, ''], [SOLID2, '']);
      expect(s.ending).not.toBeNull();
      expect(s.step).toBe('feedback');
      const ids = timeline(s).filter((i): i is Extract<TItem, { type: 'line' }> => i.type === 'line').map((i) => i.line.id);
      expect(ids).toContain('s7_01');
    }
  });

  it('2. after every decision the paths merge into the same next scene; only the `when` lines differ', () => {
    const firstAfterBeat = (c: Choices, d: 'd1' | 'd2' | 'd3', nextScene: string) => {
      const items = buildTimeline(story, c, null);
      const first = items.find((i) => i.type !== 'decision' && i.sceneId === nextScene && i.type === 'line');
      return first && first.type === 'line' ? first.line.id : null;
    };
    // merge 1 -> S3 starts s3_01 for both D1 choices
    expect(firstAfterBeat({ d1: 'private' }, 'd1', 's3')).toBe('s3_01');
    expect(firstAfterBeat({ d1: 'group' }, 'd1', 's3')).toBe('s3_01');
    // merge 2 -> S5, merge 3 -> S7: the same scene whichever way
    for (const d2 of D2) expect(buildTimeline(story, { d1: 'private', d2 }, null).some((i) => i.sceneId === 's5')).toBe(true);
    for (const d3 of D3) expect(buildTimeline(story, { d1: 'group', d2: 'tell', d3 }, null).some((i) => i.sceneId === 's7')).toBe(true);
    // only the `when` lines differ in S3 and S5
    const ids = (c: Choices, scene: string) => buildTimeline(story, c, null).filter((i) => i.type === 'line' && i.sceneId === scene && !i.beat).map((i) => (i as Extract<TItem, { type: 'line' }>).line.id);
    const a = ids({ d1: 'private', d2: 'tell', d3: 'accept' }, 's3'), b = ids({ d1: 'group', d2: 'tell', d3: 'accept' }, 's3');
    expect(a.filter((x) => !b.includes(x))).toEqual(['s3_05a']);
    expect(b.filter((x) => !a.includes(x))).toEqual(['s3_05b']);
    const c1 = ids({ d1: 'group', d2: 'tell', d3: 'accept' }, 's5'), c2 = ids({ d1: 'group', d2: 'delete', d3: 'accept' }, 's5');
    expect(c1.filter((x) => !c2.includes(x))).toEqual(['s5_01a']);
    expect(c2.filter((x) => !c1.includes(x))).toEqual(['s5_01b', 's5_01c']);
  });

  it('3. both options at each decision carry the same fields and the same order, with no hint of right or wrong', () => {
    for (const d of Object.values(story.decisions)) {
      const [a, b] = d.options;
      expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort());
      expect(a.label.length).toBeGreaterThan(0);
      expect(b.label.length).toBeGreaterThan(0);
      for (const o of d.options) expect(/recommended|best|right answer|correct/i.test(o.label + o.sub)).toBe(false);
    }
  });

  it('4. Ending A is reachable. Ending B is reachable. The choice combination alone never decides the ending', () => {
    for (const c of COMBOS) {
      expect(play(c, [SOLID1, ''], [SOLID2, '']).ending).toBe('A');
      expect(play(c, [THIN, 'Lisa is wrong'], [MID2, MID2]).ending).toBe('B');
      expect(decideEnding(3, 3).ending).toBe('A');
      expect(decideEnding(0, 0).ending).toBe('B');
    }
    expect(decideEnding(3, 2).ending).toBe('A');
    expect(decideEnding(2, 3).ending).toBe('A');
    expect(decideEnding(2, 2).ending).toBe('B');
    expect(decideEnding(3, 1).ending).toBe('B');
    expect(decideEnding(3, 0).ending).toBe('B');
  });

  it('7. a second answer never lowers the first, and there is no second follow-up', () => {
    let s = toDecision(start());
    s = toDecision(reducer(s, { t: 'choose', id: 'd1', value: 'group', ts: ts() }));
    s = reducer(s, { t: 'submit', key: 'why1', text: SOLID1, ts: ts() });
    s = reducer(s, { t: 'scored', key: 'why1', text: SOLID1, resp: resp({ sessionId: 'x', promptId: 'why1', criterion: 'analysis', answer: SOLID1, attempt: 1, context: {} }), ts: ts() });
    expect(s.why.why1.level1).toBe(3);
    expect(s.why.why1.prompt.kind).toBe('harder');
    const weak = 'I do not know what to write about this at all, really.';
    s = reducer(s, { t: 'submit', key: 'why1', text: weak, ts: ts() });
    s = reducer(s, { t: 'scored', key: 'why1', text: weak, resp: resp({ sessionId: 'x', promptId: 'why1', criterion: 'analysis', answer: weak, attempt: 2, context: {} }), ts: ts() });
    expect(s.why.why1.level2).toBeLessThan(3);
    expect(s.why.why1.final).toBe(3);
    expect(s.why.why1.phase).toBe('ack'); // show the thank-you, then go on. No further question.
    expect(s.why.why1.prompt.kind).toBe('harder');
  });

  it('8. "I would rather not answer" and "Skip" work and are logged; a skipped answer counts as 0 for the ending', () => {
    let s = toDecision(start());
    s = toDecision(reducer(s, { t: 'choose', id: 'd1', value: 'private', ts: ts() }));
    s = reducer(s, { t: 'skipPrimary', key: 'why1', ts: ts() });
    expect(s.why.why1.skipped).toBe(true);
    expect(s.why.why1.final).toBe(0);
    expect(s.why.why1.ack).toBe(story.whys.why1.skipped);
    s = reducer(s, { t: 'ackContinue', key: 'why1', ts: ts() });
    expect(currentItem(s)?.sceneId).toBe('s4');
    expect(s.events.some((e) => e.event === 'skipped' && e.payload.promptId === 'why1')).toBe(true);
    // skipping a follow-up
    let s2 = toDecision(start());
    s2 = toDecision(reducer(s2, { t: 'choose', id: 'd1', value: 'private', ts: ts() }));
    s2 = reducer(s2, { t: 'submit', key: 'why1', text: THIN, ts: ts() });
    s2 = reducer(s2, { t: 'scored', key: 'why1', text: THIN, resp: resp({ sessionId: 'x', promptId: 'why1', criterion: 'analysis', answer: THIN, attempt: 1, context: {} }), ts: ts() });
    expect(s2.why.why1.prompt.kind).toBe('followup');
    s2 = reducer(s2, { t: 'skipFollowup', key: 'why1', ts: ts() });
    expect(s2.events.some((e) => e.event === 'skipped' && e.payload.kind === 'followup')).toBe(true);
    expect(currentItem(s2)?.sceneId).toBe('s4');
    expect(s2.why.why1.final).toBe(1); // the first answer's level stands
  });

  it('skipping either answer with Ending B swaps in the alternate paragraph', () => {
    const fb = buildFeedback(story, 'B', { d1: 'group', d2: 'delete', d3: 'accept' }, true);
    expect(fb.paragraphs[1]).toBe(story.endings.B.explainIfSkipped);
    expect(buildFeedback(story, 'B', { d1: 'group', d2: 'delete', d3: 'accept' }, false).paragraphs[1]).toBe(story.endings.B.explain[1]);
    expect(buildFeedback(story, 'A', { d1: 'group', d2: 'delete', d3: 'accept' }, true).paragraphs[1]).toBe(story.endings.A.explain[1]);
    expect(fb.choices.map((c) => c.n)).toEqual([1, 2, 3]);
  });

  it('a choice is locked once made, and "back one line" never undoes it', () => {
    let s = toDecision(start());
    expect(currentItem(s)?.type).toBe('decision');
    s = reducer(s, { t: 'choose', id: 'd1', value: 'private', ts: ts() });
    expect(s.choices.d1).toBe('private');
    const again = reducer(s, { t: 'choose', id: 'd1', value: 'group', ts: ts() });
    expect(again.choices.d1).toBe('private');
    // we are now on the first beat line; back must not return to the decision
    expect(canGoBack(timeline(s), s.pos)).toBe(false);
    expect(reducer(s, { t: 'back' }).pos).toBe(s.pos);
    // inside a scene, back works
    const s2 = reducer(s, { t: 'advance', ts: ts() });
    expect(reducer(s2, { t: 'back' }).pos).toBe(s2.pos - 1);
  });

  it('cannot move past a decision or an unfinished written answer', () => {
    let s = toDecision(start());
    const pos = s.pos;
    expect(reducer(s, { t: 'advance', ts: ts() }).pos).toBe(pos);
    s = toDecision(reducer(s, { t: 'choose', id: 'd1', value: 'group', ts: ts() }));
    const pw = s.pos;
    expect(currentItem(s)?.type).toBe('why');
    expect(reducer(s, { t: 'advance', ts: ts() }).pos).toBe(pw);
  });

  it('16. the saved state rebuilds to the same step with choices intact', async () => {
    const { rehydrate } = await import('@/lib/engine/state');
    let s = toDecision(start());
    s = toDecision(reducer(s, { t: 'choose', id: 'd1', value: 'group', ts: ts() }));
    s = reducer(s, { t: 'draft', key: 'why1', text: 'half-written thought' });
    const back = rehydrate(JSON.parse(JSON.stringify(s)))!;
    expect(back.step).toBe('play');
    expect(back.pos).toBe(s.pos);
    expect(back.choices).toEqual({ d1: 'group' });
    expect(back.why.why1.draft).toBe('half-written thought');
    expect(currentItem(back)?.type).toBe('why');
  });

  it('the start has no questions: age, note, the story card, then the story', () => {
    let s = run(initialState(), { t: 'agePass', id: 'test-session', ts: ts() });
    expect(s.step).toBe('content_note');
    s = reducer(s, { t: 'noteOk' });
    expect(s.step).toBe('ready');
    s = reducer(s, { t: 'begin', ts: ts() });
    expect(s.step).toBe('play');
    expect(s.feeling).toBeNull();
  });

  it('the feeling is asked once the story is over: it is saved, logged, can be changed, and is ignored earlier', () => {
    let s = start();
    expect(reducer(s, { t: 'feeling', label: 'sad', ts: ts() }).feeling).toBeNull(); // not mid-story
    s = { ...s, step: 'end' };
    s = reducer(s, { t: 'feeling', label: 'worried', ts: ts() });
    expect(s.feeling).toBe('worried');
    s = reducer(s, { t: 'feeling', label: 'sad', ts: ts() });
    expect(s.feeling).toBe('sad');
    const picks = s.events.filter((e) => e.event === 'feeling_check').map((e) => e.payload.label);
    expect(picks).toEqual(['worried', 'sad']);
  });

  it('a session saved on one of the old start questions goes to the story card', async () => {
    const { rehydrate } = await import('@/lib/engine/state');
    for (const old of ['input', 'emotion', 'appraisal', 'match']) {
      const saved = { ...JSON.parse(JSON.stringify(start())), step: old, pos: 0 };
      expect(rehydrate(saved)!.step, old).toBe('ready');
    }
  });

  it('logs the events the brief lists, with an anonymous session id and nothing else', () => {
    const s = play({ d1: 'private', d2: 'tell', d3: 'hold' }, [SOLID1, ''], [SOLID2, '']);
    const names = new Set(s.events.map((e) => e.event));
    for (const n of ['session_start', 'age_gate_pass', 'scene_enter', 'choice', 'why_submit', 'score_response', 'harder_shown', 'ending']) expect(names.has(n as never), n).toBe(true);
    for (const e of s.events) {
      expect(e.sessionId).toBe('test-session');
      expect(Object.keys(e).sort()).toEqual(['event', 'payload', 'sessionId', 'ts']);
    }
  });
});

