import { story } from '../story';
import type { Line, Speaker } from '../story/types';

/** NEXT_PUBLIC_VOICE=0 removes all audio UI. Default is on. */
export const VOICE_ENABLED = process.env.NEXT_PUBLIC_VOICE !== '0';

/** The file for a line, or null if the line is not voiced. Files are named by line ID. */
export function audioSrc(line: Line): string | null {
  return VOICE_ENABLED && line.voiced ? `/audio/${line.id}.mp3` : null;
}

export interface VoicedLine { id: string; speaker: Speaker; text: string }

/** The question on a decision or a written answer, as a line the narrator reads when it appears. */
export function promptLine(kind: 'decision' | 'why', id: 'd1' | 'd2' | 'd3' | 'why1' | 'why2'): Line {
  const text = kind === 'decision' ? story.decisions[id as 'd1' | 'd2' | 'd3'].prompt : story.whys[id as 'why1' | 'why2'].question;
  return { id: kind === 'decision' ? `${id}_prompt` : `${id}_question`, speaker: 'narrator', kind: 'narration', text, voiced: true };
}

/** Every voiced line, including all variants. Used by scripts/generate-audio.ts and the tests. A line is read by `voice` if it has one. */
export function allVoicedLines(): VoicedLine[] {
  const out: VoicedLine[] = [];
  const add = (ls: Line[]) => ls.forEach((l) => l.voiced && out.push({ id: l.id, speaker: l.voice ?? l.speaker, text: l.text }));
  story.scenes.forEach((s) => add(s.lines));
  Object.values(story.decisions).forEach((d) => d.options.forEach((o) => add(o.beat)));
  Object.values(story.endings).forEach((e) => add(e.lines));
  story.debrief.slides.forEach((s) => add(s.narration));
  add([promptLine('decision', 'd1'), promptLine('decision', 'd2'), promptLine('decision', 'd3'), promptLine('why', 'why1'), promptLine('why', 'why2')]);
  return out;
}
