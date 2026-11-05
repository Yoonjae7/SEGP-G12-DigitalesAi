import type { EmotionLabel, ScoreResponse } from '../ai/types';
import { makeEvent, type EventName, type LogEvent } from '../log/events';
import { story } from '../story';
import { applyScore, continueUnscored, freshAnswer, skipFollowup, skipPrimary } from './adaptation';
import { decideEnding } from './endings';
import { buildTimeline, type TItem } from './flow';
import type { AnswerKey, AnswerState, Choices, SessionState, Settings } from './types';

export const STORAGE_KEY = 'dt_session_v1';
export const DEFAULT_SETTINGS: Settings = { sound: false, simple: false, text: 0, auto: false };

export function initialState(settings: Settings = DEFAULT_SETTINGS): SessionState {
  return {
    v: 1,
    sessionId: null,
    step: 'age_gate',
    input: { text: '', theme: false, skipped: false },
    emotion: { guess: null, final: null },
    appraisal: null,
    match: null,
    choices: {},
    pos: 0,
    why: { why1: freshAnswer(story, 'why1'), why2: freshAnswer(story, 'why2') },
    ending: null,
    endingRule: null,
    feedback: { tap: null, phase: 'ask' },
    reflect: freshAnswer(story, 'reflect', true),
    settings: { ...settings },
    events: [],
  };
}

export type Action =
  | { t: 'hydrate'; state: SessionState }
  | { t: 'wipe' }
  | { t: 'newSession' }
  | { t: 'agePass'; id: string; ts: number }
  | { t: 'noteOk' }
  | { t: 'setInput'; text: string; theme: boolean; skipped: boolean; ts: number }
  | { t: 'emotionGuess'; label: EmotionLabel; ts: number }
  | { t: 'emotionFinal'; label: EmotionLabel; ts: number }
  | { t: 'appraisal'; value: string; ts: number }
  | { t: 'matchResult'; confidence: number; note: string | null }
  | { t: 'begin'; ts: number }
  | { t: 'advance'; ts: number }
  | { t: 'back' }
  | { t: 'choose'; id: 'd1' | 'd2' | 'd3'; value: string; ts: number }
  | { t: 'draft'; key: AnswerKey; text: string }
  | { t: 'submit'; key: AnswerKey; text: string; ts: number }
  | { t: 'scored'; key: AnswerKey; text: string; resp: ScoreResponse; ts: number }
  | { t: 'failed'; key: AnswerKey; ts: number }
  | { t: 'continueUnscored'; key: AnswerKey; ts: number }
  | { t: 'skipPrimary'; key: AnswerKey; ts: number }
  | { t: 'skipFollowup'; key: AnswerKey; ts: number }
  | { t: 'ackContinue'; key: AnswerKey; ts: number }
  | { t: 'feedbackTap'; value: string; ts: number }
  | { t: 'feedbackExplain' }
  | { t: 'feedbackDone'; ts: number }
  | { t: 'reflectAccept'; ts: number }
  | { t: 'reflectDecline'; ts: number }
  | { t: 'settings'; patch: Partial<Settings> }
  | { t: 'log'; event: EventName; payload?: Record<string, unknown>; ts: number };

/* ---------- helpers ---------- */
export const timeline = (s: SessionState): TItem[] => buildTimeline(story, s.choices, s.ending);
export const currentItem = (s: SessionState): TItem | undefined => timeline(s)[s.pos];

function withLog(s: SessionState, items: [EventName, Record<string, unknown>][], ts: number): SessionState {
  if (!s.sessionId || items.length === 0) return s;
  return { ...s, events: [...s.events, ...items.map(([e, p]) => makeEvent(s.sessionId, e, p, ts))] };
}
const one = (s: SessionState, e: EventName, p: Record<string, unknown>, ts: number) => withLog(s, [[e, p]], ts);

function setAnswer(s: SessionState, key: AnswerKey, a: AnswerState): SessionState {
  return key === 'reflect' ? { ...s, reflect: a } : { ...s, why: { ...s.why, [key]: a } };
}
const getAnswer = (s: SessionState, key: AnswerKey): AnswerState => (key === 'reflect' ? s.reflect : s.why[key]);

function advance(s: SessionState, ts: number): SessionState {
  const items = timeline(s);
  const cur = items[s.pos];
  if (!cur) return s;
  if (cur.type === 'decision' && !s.choices[cur.id]) return s; // blocked until the learner chooses
  if (cur.type === 'why' && s.why[cur.id].phase !== 'done') return s; // blocked until the written answer is finished
  const next = items[s.pos + 1];
  if (!next) {
    if (s.ending) return { ...s, step: 'feedback', feedback: { tap: null, phase: 'ask' } };
    return s;
  }
  let ns: SessionState = { ...s, pos: s.pos + 1 };
  if (next.sceneId !== cur.sceneId) ns = one(ns, 'scene_enter', { sceneId: next.sceneId, n: next.n }, ts);
  return ns;
}

/** A written answer is finished. Move on: next scene, the ending, or the end screen. */
function settleDone(s: SessionState, key: AnswerKey, ts: number): SessionState {
  if (key === 'reflect') return one({ ...s, step: 'end' }, 'reflect_done', {}, ts);
  if (key === 'why1') return advance(s, ts);
  const { ending, rule } = decideEnding(s.why.why1.final, s.why.why2.final);
  let ns: SessionState = { ...s, ending, endingRule: rule };
  ns = one(ns, 'ending', { ending, why1: s.why.why1.final, why2: s.why.why2.final, rule }, ts);
  return advance(ns, ts);
}

export function anySkipped(s: SessionState): boolean {
  return s.why.why1.skipped || s.why.why2.skipped;
}

/* ---------- reducer ---------- */
export function reducer(s: SessionState, a: Action): SessionState {
  switch (a.t) {
    case 'hydrate':
      return a.state;
    case 'wipe':
      return initialState();
    case 'newSession':
      return initialState(s.settings);
    case 'agePass': {
      const ns: SessionState = { ...initialState(s.settings), sessionId: a.id, step: 'content_note' };
      return withLog(ns, [['session_start', {}], ['age_gate_pass', {}]], a.ts);
    }
    case 'noteOk':
      return { ...s, step: 'input' };
    case 'setInput':
      return one({ ...s, step: 'emotion', input: { text: a.text, theme: a.theme, skipped: a.skipped } }, 'input_submitted', { chars: a.text.length, theme: a.theme, skipped: a.skipped }, a.ts);
    case 'emotionGuess':
      return one({ ...s, emotion: { guess: a.label, final: a.label } }, 'emotion_guess', { label: a.label }, a.ts);
    case 'emotionFinal':
      return one({ ...s, step: 'appraisal', emotion: { ...s.emotion, final: a.label } }, 'emotion_final', { label: a.label, changed: s.emotion.guess !== null && s.emotion.guess !== a.label }, a.ts);
    case 'appraisal':
      return one({ ...s, step: 'match', appraisal: a.value }, 'appraisal', { value: a.value }, a.ts);
    case 'matchResult':
      return { ...s, match: { confidence: a.confidence, note: a.note } };
    case 'begin': {
      const ns: SessionState = { ...s, step: 'play', pos: 0 };
      return one(ns, 'scene_enter', { sceneId: 's1', n: 1 }, a.ts);
    }
    case 'advance':
      return advance(s, a.ts);
    case 'back': {
      const items = timeline(s);
      const cur = items[s.pos];
      const prev = items[s.pos - 1];
      if (cur?.type === 'line' && prev?.type === 'line' && cur.sceneId === prev.sceneId) return { ...s, pos: s.pos - 1 };
      return s;
    }
    case 'choose': {
      const cur = currentItem(s);
      if (cur?.type !== 'decision' || cur.id !== a.id || s.choices[a.id]) return s; // a choice is locked once made
      const choices: Choices = { ...s.choices, [a.id]: a.value } as Choices;
      const ns = one({ ...s, choices }, 'choice', { decision: a.id, option: `${a.id}_${a.value}` }, a.ts);
      return advance(ns, a.ts);
    }
    case 'draft':
      return setAnswer(s, a.key, { ...getAnswer(s, a.key), draft: a.text });
    case 'submit': {
      const cur = getAnswer(s, a.key);
      const ns = setAnswer(s, a.key, { ...cur, phase: 'reading', draft: a.text });
      return one(ns, a.key === 'reflect' ? 'reflect_submit' : 'why_submit', { promptId: a.key, attempt: cur.attempt, answer: a.text, chars: a.text.length }, a.ts);
    }
    case 'scored': {
      const { a: next, log } = applyScore(story, a.key, getAnswer(s, a.key), a.text, a.resp);
      let ns = withLog(setAnswer(s, a.key, next), log, a.ts);
      if (next.phase === 'done') ns = settleDone(ns, a.key, a.ts);
      return ns;
    }
    case 'failed': {
      const cur = getAnswer(s, a.key);
      const ns = setAnswer(s, a.key, { ...cur, phase: 'error', failures: cur.failures + 1 });
      return one(ns, 'score_error', { promptId: a.key, attempt: cur.attempt, failures: cur.failures + 1 }, a.ts);
    }
    case 'continueUnscored': {
      const { a: next, log } = continueUnscored(a.key, getAnswer(s, a.key));
      return settleDone(withLog(setAnswer(s, a.key, next), log, a.ts), a.key, a.ts);
    }
    case 'skipPrimary': {
      const { a: next, log } = skipPrimary(story, a.key, getAnswer(s, a.key));
      let ns = withLog(setAnswer(s, a.key, next), log, a.ts);
      if (next.phase === 'done') ns = settleDone(ns, a.key, a.ts);
      return ns;
    }
    case 'skipFollowup': {
      const { a: next, log } = skipFollowup(a.key, getAnswer(s, a.key));
      return settleDone(withLog(setAnswer(s, a.key, next), log, a.ts), a.key, a.ts);
    }
    case 'ackContinue':
      return settleDone(setAnswer(s, a.key, { ...getAnswer(s, a.key), phase: 'done', ack: null }), a.key, a.ts);
    case 'feedbackTap':
      return one({ ...s, feedback: { ...s.feedback, tap: a.value } }, 'feedback_ask_tap', { value: a.value }, a.ts);
    case 'feedbackExplain':
      return { ...s, feedback: { ...s.feedback, phase: 'explain' } };
    case 'feedbackDone':
      return one({ ...s, step: 'reflect', reflect: freshAnswer(story, 'reflect', true) }, 'reflect_offer', {}, a.ts);
    case 'reflectAccept':
      return one({ ...s, reflect: { ...s.reflect, phase: 'ask' } }, 'reflect_start', {}, a.ts);
    case 'reflectDecline':
      return one({ ...s, step: 'end' }, 'reflect_skipped', { kind: 'declined' }, a.ts);
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch } };
    case 'log':
      return one(s, a.event, a.payload ?? {}, a.ts);
    default:
      return s;
  }
}

/* ---------- saving and loading ---------- */
/** Anything half-finished when the page closed goes back to a safe place. The text is kept. */
export function rehydrate(raw: unknown): SessionState | null {
  try {
    const r = raw as SessionState;
    if (!r || r.v !== 1 || typeof r.step !== 'string' || !r.why || !r.settings) return null;
    const base = initialState(r.settings);
    const fix = (a: AnswerState): AnswerState => ({ ...a, phase: a.phase === 'reading' ? 'ask' : a.phase });
    const s: SessionState = {
      ...base,
      ...r,
      why: { why1: fix(r.why.why1), why2: fix(r.why.why2) },
      reflect: fix(r.reflect),
      settings: { ...DEFAULT_SETTINGS, ...r.settings },
      events: Array.isArray(r.events) ? r.events : [],
    };
    const len = timeline(s).length;
    if (s.pos >= len) s.pos = Math.max(0, len - 1);
    if (s.step !== 'age_gate' && !s.sessionId) return null;
    return s;
  } catch {
    return null;
  }
}

export const STEP_ROUTE: Record<SessionState['step'], '/start' | '/play'> = {
  age_gate: '/start', content_note: '/start', input: '/start', emotion: '/start', appraisal: '/start', match: '/start',
  play: '/play', feedback: '/play', reflect: '/play', end: '/play',
};
