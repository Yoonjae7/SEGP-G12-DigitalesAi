import { story } from '../story';
import type { Line, Speaker } from '../story/types';

/** NEXT_PUBLIC_VOICE=0 removes all audio UI. Default is on. */
export const VOICE_ENABLED = process.env.NEXT_PUBLIC_VOICE !== '0';

/** The file for a line, or null if the line is not voiced. Files are named by line ID. */
export function audioSrc(line: Line): string | null {
  return VOICE_ENABLED && line.voiced ? `/audio/${line.id}.mp3` : null;
}

export interface VoicedLine { id: string; speaker: Speaker; text: string }

/** Every voiced line, including all variants. Used by scripts/generate-audio.ts and the tests. */
export function allVoicedLines(): VoicedLine[] {
  const out: VoicedLine[] = [];
  const add = (ls: Line[]) => ls.forEach((l) => l.voiced && out.push({ id: l.id, speaker: l.speaker, text: l.text }));
  story.scenes.forEach((s) => add(s.lines));
  Object.values(story.decisions).forEach((d) => d.options.forEach((o) => add(o.beat)));
  Object.values(story.endings).forEach((e) => add(e.lines));
  story.debrief.slides.forEach((s) => add(s.narration));
  return out;
}
