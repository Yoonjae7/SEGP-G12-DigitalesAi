import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { story } from '@/lib/story';
import { allVoicedLines } from '@/lib/voice/manifest';

const storyRaw = readFileSync('content/story.json', 'utf8');
const uiRaw = readFileSync('content/ui-copy.json', 'utf8');

describe('story.json', () => {
  it('validates against the schema', () => {
    expect(story.scenes).toHaveLength(7);
  });

  it('has unique line ids, and every voiced line has a speaker that can be voiced', () => {
    const ids = new Set<string>();
    for (const l of allVoicedLines()) {
      expect(ids.has(l.id)).toBe(false);
      ids.add(l.id);
      expect(['you', 'screen']).not.toContain(l.speaker);
    }
    expect(allVoicedLines().length).toBe(58);
  });

  it('11. no real brand or platform name appears in story.json or the UI copy (About may credit tools)', () => {
    const brands = ['whatsapp', 'instagram', 'snapchat', 'tiktok', 'facebook', 'messenger', 'telegram', 'discord', 'twitter', 'youtube', 'google', 'apple', 'iphone', 'android', 'imessage', 'signal app', 'reddit', 'linkedin', 'wechat', 'line app'];
    const ui = JSON.parse(uiRaw);
    delete ui.about; // the About page may credit the tools the team used
    const hay = (storyRaw + JSON.stringify(ui)).toLowerCase();
    for (const b of brands) expect(hay.includes(b), `brand: ${b}`).toBe(false);
  });

  it('10. no points, badges, levels or streaks in the copy (Points appears only in the Home line)', () => {
    const hay = (storyRaw + uiRaw).toLowerCase();
    for (const w of ['badge', 'level up', 'leaderboard', 'streak']) expect(hay.includes(w), w).toBe(false);
    const ui = JSON.parse(uiRaw);
    const withoutHome = JSON.stringify({ ...ui, home: { ...ui.home, lede: '' } }).toLowerCase() + storyRaw.toLowerCase();
    expect(withoutHome.includes('points')).toBe(false);
    expect(ui.home.lede).toContain('No points. No scores.');
  });

  it('avoids the banned buzzwords', () => {
    const hay = (storyRaw + uiRaw).toLowerCase().replace('no claim that it improves learning', '');
    for (const w of ['unlock', 'supercharge', 'journey', 'empower', 'seamless', 'improves', 'proven', 'boosts']) expect(hay.includes(w), w).toBe(false);
  });

  it('never claims a learning impact, has the wellbeing and group leader emails, and still has the survey placeholder', () => {
    expect(uiRaw).toContain('Wellbeing.Ambassadors@nottingham.edu.my');
    expect(uiRaw).toContain('hfywh4@nottingham.edu.my');
    expect(uiRaw).toContain('Wei Feng');
    expect(uiRaw.toLowerCase()).not.toContain('emergency contact');
    expect(uiRaw).toContain('[usability survey link: team to add]');
  });

  it('keeps to the writing guide: no stiff phrases and no local jargon (content/WRITING-GUIDE.md)', () => {
    const stiff = ['not trying to', 'fill the screen', 'goes still', 'sits there', 'cursor blinks', 'goes red', 'now add one thing', 'hall b', 'film night', 'legend'];
    const hay = storyRaw.toLowerCase();
    for (const w of stiff) expect(hay.includes(w), w).toBe(false);
  });

  it('18. the photo is only ever a tile: no line describes drawing it', () => {
    const tiles = [...story.scenes.flatMap((s) => s.lines), ...Object.values(story.endings).flatMap((e) => e.lines)].filter((l) => l.showPhotoTile);
    expect(tiles.map((l) => l.id).sort()).toEqual(['eB_02', 's1_02', 's3_04']);
  });
});

