import { story } from '@/lib/story';
import type { StageCharacter } from '@/lib/story/types';
import type { CharId, Slot } from './types';

/**
 * Each set is data: who stands where. The people, their poses and expressions come from content/story.json,
 * so changing a pose never needs a code change. Positions use the 2D scene's pixel space so both versions match.
 */
export const SLOTS: Record<string, Partial<Record<CharId, Slot>>> = {
  s1: { you: { x: 410, y: 985, scale: 8.2, depth: 0.62 } },
  s4: {
    marco: { x: 700, y: 792, scale: 4.8, depth: 0.56 },
    dev: { x: 810, y: 798, scale: 4.6, depth: 0.56 },
    sarah: { x: 600, y: 806, scale: 6.4, depth: 0.7 },
    you: { x: 300, y: 960, scale: 7.8, depth: 0.9 },
  },
  s5: { sarah: { x: 670, y: 846, scale: 8.2, depth: 0.4, yaw: 0.2 }, you: { x: 1020, y: 1160, scale: 8.2, depth: 0.9 } },
  s6: { lisa: { x: 970, y: 840, scale: 6.4, depth: 0.6 }, you: { x: 620, y: 990, scale: 7.6, depth: 0.9 } },
  s7a: { sarah: { x: 790, y: 786, scale: 5.6, depth: 0.7 }, lisa: { x: 1000, y: 782, scale: 5.0, depth: 0.7, yaw: -0.15 }, you: { x: 570, y: 830, scale: 6.2, depth: 0.9 } },
  s7b: {
    you: { x: 1140, y: 880, scale: 6.4, depth: 0.9 },
    marco: { x: 330, y: 612, scale: 2.6, depth: 0.6 },
    dev: { x: 410, y: 614, scale: 2.6, depth: 0.6 },
    lisa: { x: 520, y: 612, scale: 2.8, depth: 0.6, yaw: 1 },
  },
};

/** Who is on stage in a set, from the story file. */
export function charactersFor(setId: string): StageCharacter[] {
  const fromScene = story.scenes.find((s) => s.stage.set === setId);
  if (fromScene) return fromScene.stage.characters;
  const e = Object.values(story.endings).find((x) => x.stage.set === setId);
  return e ? e.stage.characters : [];
}

/** The part of the 1600-wide scene a portrait stage shows, as a centre x. Matches the 2D crops. */
export const FOCUS: Record<string, number> = { s1: 950, s2: 800, s3: 800, s4: 560, s5: 845, s6: 800, s7a: 790, s7b: 940 };

/** Slow camera moves, per set. Off with reduced motion. */
export const CAMERA: Record<string, 'push' | 'sway' | 'pan' | 'hold'> = { s1: 'push', s2: 'sway', s3: 'pan', s4: 'hold', s5: 'hold', s6: 'hold', s7a: 'push', s7b: 'push' };

/** Light colour for each recipe: night, morning, warm low sun, flat grey-blue. */
export const LIGHT: Record<string, { ambient: string; key: string; keyI: number; ambI: number }> = {
  s1: { ambient: '#8fb2c4', key: '#d6ecf3', keyI: 1.2, ambI: 1.2 },
  s2: { ambient: '#8fb2c4', key: '#d6ecf3', keyI: 1.2, ambI: 1.2 },
  s3: { ambient: '#8fb2c4', key: '#d6ecf3', keyI: 1.2, ambI: 1.2 },
  s4: { ambient: '#fff1da', key: '#ffe2b0', keyI: 1.6, ambI: 1.6 },
  s5: { ambient: '#fff4e4', key: '#ffe8c4', keyI: 1.3, ambI: 1.9 },
  s6: { ambient: '#fff4e4', key: '#fff0d8', keyI: 1.1, ambI: 2.0 },
  s7a: { ambient: '#ffe9c0', key: '#ffd58a', keyI: 1.9, ambI: 1.5 },
  s7b: { ambient: '#c7d3d9', key: '#dfe8ec', keyI: 1.0, ambI: 2.0 },
};
