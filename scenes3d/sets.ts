import { story } from '@/lib/story';
import type { StageCharacter } from '@/lib/story/types';

/** Who is on stage in a set, from the story file. The positions and the camera are in direction.ts. */
export function charactersFor(setId: string): StageCharacter[] {
  const fromScene = story.scenes.find((s) => s.stage.set === setId);
  if (fromScene) return fromScene.stage.characters;
  const e = Object.values(story.endings).find((x) => x.stage.set === setId);
  return e ? e.stage.characters : [];
}