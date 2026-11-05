import type { Story } from '../story/types';
import type { Choices } from './types';

/**
 * Ending A if both final levels are 2 or more and at least one is 3. Ending B in every other case.
 * Reasoning decides the ending. The choice combination alone never does.
 * Neither ending is "pass" or "fail". Never show a number or label that says so.
 */
export function decideEnding(why1Final: number, why2Final: number): { ending: 'A' | 'B'; rule: string } {
  const a = why1Final >= 2 && why2Final >= 2 && (why1Final === 3 || why2Final === 3);
  return a ? { ending: 'A', rule: 'both 2 or more, at least one 3' } : { ending: 'B', rule: 'any other case' };
}

export interface FeedbackView {
  question: string;
  taps: string[];
  paragraphs: string[];
  choices: { n: number; line: string }[];
  closing: string;
}

/** `skipped` is true if either written answer was skipped. In that case Ending B swaps its second paragraph. */
export function buildFeedback(story: Story, ending: 'A' | 'B', choices: Choices, skipped: boolean): FeedbackView {
  const e = story.endings[ending];
  const paragraphs = [...e.explain];
  if (ending === 'B' && skipped && e.explainIfSkipped) paragraphs[1] = e.explainIfSkipped;
  const lines: { n: number; line: string }[] = [];
  (['d1', 'd2', 'd3'] as const).forEach((k, i) => {
    const v = choices[k];
    if (v) lines.push({ n: i + 1, line: story.choiceLines[`${k}_${v}`] });
  });
  return { question: e.ask.question, taps: e.ask.taps, paragraphs, choices: lines, closing: story.closing };
}
