import raw from '@/content/story.json';
import { StorySchema, type Story } from './types';

/** The one story, validated once at load. Edit content/story.json to change any words. */
export const story: Story = StorySchema.parse(raw);

export * from './types';
