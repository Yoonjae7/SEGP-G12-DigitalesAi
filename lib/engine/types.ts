import type { ScoreResponse } from '../ai/types';
import type { LogEvent } from '../log/events';

export type Step = 'age_gate' | 'content_note' | 'ready' | 'play' | 'feedback' | 'debrief' | 'reflect' | 'end';

export interface Choices {
  d1?: 'private' | 'group';
  d2?: 'tell' | 'delete';
  d3?: 'accept' | 'hold';
}

export type PromptKind = 'question' | 'nudge' | 'followup' | 'harder';
export type AnswerKey = 'why1' | 'why2' | 'reflect';

/** One written answer: the first try, and at most one follow-up. Levels are internal and never shown to the learner. */
export interface AnswerState {
  phase: 'offer' | 'ask' | 'reading' | 'error' | 'ack' | 'support' | 'done';
  attempt: 1 | 2;
  prompt: { kind: PromptKind; text: string };
  draft: string;
  text1: string | null;
  text2: string | null;
  level1: number | null;
  level2: number | null;
  final: number; // the higher of the two. 0 if skipped.
  skipped: boolean;
  unscored: boolean; // continued without a follow-up after errors
  failures: number;
  ack: string | null;
  support: boolean;
}

export interface Settings {
  sound: boolean;
  simple: boolean;
  text: number; // -1 (floor) 0 (default) 1 2 3
  auto: boolean;
  /** Which set of defaults this session was made with. Older sessions had sound and auto-play off. */
  defaults?: number;
}

export interface SessionState {
  v: 1;
  sessionId: string | null;
  step: Step;
  /** How the learner says they feel about the theme once the story is over. Self-reported, never graded. */
  feeling: string | null;
  choices: Choices;
  pos: number;
  why: { why1: AnswerState; why2: AnswerState };
  ending: 'A' | 'B' | null;
  endingRule: string | null;
  feedback: { tap: string | null; phase: 'ask' | 'explain' };
  reflect: AnswerState;
  settings: Settings;
  events: LogEvent[];
}

export type { ScoreResponse };
