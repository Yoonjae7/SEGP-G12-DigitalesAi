import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { story } from '@/lib/story';
import { allVoicedLines } from '@/lib/voice/manifest';

const storyRaw = readFileSync('content/story.json', 'utf8');
const uiRaw = readFileSync('content/ui-copy.json', 'utf8');

describe('story.json', () => {
  it('validates against the schema', () => {
    expect(story.scenes).toHaveLength(8); // the bus scene, then the seven scenes of the story
  });

  it('has unique line ids, and every line is read aloud by someone who has a voice', () => {
    const voices = JSON.parse(readFileSync('voices.json', 'utf8')).speakers as Record<string, { voiceId: string }>;
    const ids = new Set<string>();
    for (const l of allVoicedLines()) {
      expect(ids.has(l.id), l.id).toBe(false);
      ids.add(l.id);
      expect(voices[l.speaker], `${l.id} is read by ${l.speaker}, who has no voice in voices.json`).toBeTruthy();
      expect(voices[l.speaker].voiceId.startsWith('REPLACE'), l.speaker).toBe(false);
    }
    // 109 spoken lines: the story, every choice and answer, the endings, the debrief, and the five questions the narrator reads out
    expect(allVoicedLines().length).toBe(109);
  });

  it('no line in the story is left without a voice', () => {
    const all = [
      ...story.scenes.flatMap((s) => s.lines),
      ...Object.values(story.decisions).flatMap((d) => d.options.flatMap((o) => o.beat)),
      ...Object.values(story.endings).flatMap((e) => e.lines),
      ...story.debrief.slides.flatMap((s) => s.narration),
    ];
    expect(all.filter((l) => !l.voiced).map((l) => l.id)).toEqual([]);
    // on-screen text is read by the narrator, and the learner's own words by the learner's voice
    for (const l of all) if (l.speaker === 'screen') expect(l.voice, l.id).toBe('narrator');
  });

  it('every scene and ending says what day and time it is, for the clock in the corner', () => {
    for (const s of story.scenes) expect(s.time, s.id).toMatch(/^(Tuesday|Wednesday|Thursday|Friday) · /);
    for (const e of Object.values(story.endings)) expect(e.time, e.id).toMatch(/^Friday · /);
  });

  it('introduces everyone: a name and a short background for each person, and a tag shown for each one on the bus', () => {
    expect(Object.keys(story.cast).sort()).toEqual(['dev', 'lisa', 'marco', 'sarah', 'you']);
    for (const c of Object.values(story.cast)) { expect(c.name.length).toBeGreaterThan(1); expect(c.about.length).toBeGreaterThan(10); }
    const tagged = story.scenes[0].lines.flatMap((l) => l.intro ?? []);
    expect(tagged).toEqual(['sarah', 'lisa', 'marco', 'dev']);
  });

  it('the recordings that exist are current: a real mp3 for a line in the story, never one left from other words', () => {
    const lines = new Set(allVoicedLines().map((l) => l.id));
    const files = readdirSync('public/audio').filter((f) => f.endsWith('.mp3'));
    for (const f of files) expect(lines.has(f.replace(/\.mp3$/, '')), `${f} belongs to no line`).toBe(true);
    const missing = [...lines].filter((id) => !existsSync(`public/audio/${id}.mp3`));
    // Not a failure: a line without a recording is read by the browser's voice until its recording is made (npm run audio).
    console.info(`${lines.size - missing.length} of ${lines.size} lines have a recording; ${missing.length} are read by the browser's voice for now`);
  });

  it('the group chat tells the truth: nobody "agrees" when nobody does, and a reply that was sent is not called missing', () => {
    const text = (id: string) => [...story.scenes.flatMap((s) => s.lines), ...Object.values(story.decisions).flatMap((d) => d.options.flatMap((o) => o.beat))].find((l) => l.id === id)!.text;
    expect(text('s2g_04')).not.toMatch(/agree/i);
    expect(text('s3_05a')).not.toMatch(/read your message but hasn't replied/i);
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

