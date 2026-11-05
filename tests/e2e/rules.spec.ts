import { expect, test, type Page } from '@playwright/test';
import { COMBOS, D1, D2, D3, choose, localSession, playThrough, startStory, toDecision, toFeedback, toWhy } from './helpers';

const RULE_ID = /\b[AEI]-(THIN|SOLID|NUDGE|SAFETY|ATTEMPT2|NONE)[A-Z-]*\b/;
const SCORE_LIKE = /\b(score|level|rubric)\s*[:=]?\s*\d|\blevel\s*(up|\d)|\b\d\s*\/\s*3\b/i;

async function pageText(page: Page) {
  return page.evaluate(() => document.body.innerText);
}
async function expectClean(page: Page, where: string) {
  const t = await pageText(page);
  expect(t, `${where}: rule id`).not.toMatch(RULE_ID);
  expect(t, `${where}: score or level`).not.toMatch(SCORE_LIKE);
  expect(t.toLowerCase(), `${where}: banned words`).not.toMatch(/badge|leaderboard|streak|level up/);
}

test('9 and 10. no score, level, rule id or reward appears in the learner UI', async ({ page }) => {
  for (const path of ['/', '/about', '/support', '/start']) { await page.goto(path); await expectClean(page, path); }
  await startStory(page);
  await expectClean(page, 'story');
  await toDecision(page);
  await expectClean(page, 'decision');
  await page.getByRole('button', { name: D1.group }).click();
  await page.keyboard.press('Space');
  await toFeedbackWith(page);
  await expectClean(page, 'feedback');
  await page.getByRole('button', { name: 'Show me what happened' }).click();
  await expectClean(page, 'explain');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expectClean(page, 'debrief');
  await page.getByRole('button', { name: 'Skip debrief' }).click();
  await expectClean(page, 'reflect offer');
  await page.getByRole('button', { name: 'No thanks' }).click();
  await expectClean(page, 'end');
  // "Points" only in the Home line "No points. No scores."
  await page.goto('/');
  expect((await pageText(page)).match(/points/gi)?.length).toBe(1);
  await page.goto('/about');
  expect(await pageText(page)).not.toMatch(/points/i);
  expect(await pageText(page)).toMatch(/demo scoring/i);
});

async function toFeedbackWith(page: Page) {
  // the rest of the journey with both answers skipped, from just after Decision 1
  const { rather } = await import('./helpers');
  await rather(page);
  await choose(page, D2.delete);
  await choose(page, D3.accept);
  await rather(page);
  await toFeedback(page);
}

test('3. both options at each decision look the same, and nothing is focused by default', async ({ page }) => {
  await startStory(page);
  for (const [i, pick] of [[1, D1.private], [2, D2.tell], [3, D3.hold]] as const) {
    await toDecision(page);
    const cards = page.locator('.decide .co');
    await expect(cards).toHaveCount(2);
    await page.mouse.move(5, 5); // so neither card is under the pointer
    await page.waitForTimeout(400); // the cards finish rising
    const [a, b] = await Promise.all([cards.nth(0), cards.nth(1)].map(async (c) => ({
      box: await c.boundingBox(),
      css: await c.evaluate((el) => { const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.borderTopWidth, s.borderTopColor, s.fontSize, s.boxShadow, s.borderRadius, s.paddingTop].join('|'); }),
      lab: await c.locator('.lab').evaluate((el) => { const s = getComputedStyle(el); return [s.fontFamily, s.fontSize, s.color].join('|'); }),
    })));
    expect(Math.abs(a.box!.width - b.box!.width)).toBeLessThan(1.5);
    expect(Math.abs(a.box!.height - b.box!.height)).toBeLessThan(1.5);
    expect(a.css).toBe(b.css);
    expect(a.lab).toBe(b.lab);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
    expect(await page.locator('.decide').innerText()).not.toMatch(/recommended|best|correct|right answer/i);
    await page.getByRole('button', { name: pick }).click();
    if (i === 1) { const { rather } = await import('./helpers'); await rather(page); }
  }
});

test('12. the age gate blocks "No" from reaching the story', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await expect(page.getByText('This pilot is for adults only.')).toBeVisible();
  expect(await localSession(page)).toBeNull();
  await page.goto('/play');
  await expect(page).toHaveURL(/\/start/);
  await expect(page.getByRole('button', { name: 'Yes, I am 18 or older' })).toBeVisible();
});

test('14. with 3D off, voice off and audio blocked, the story still plays start to finish', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: false, forceFail: false, ratings: {} }));
    Object.defineProperty(window, 'Audio', { value: undefined, configurable: true });
  });
  await startStory(page);
  await expect(page.getByRole('button', { name: /sound/i })).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
  await playThrough(page, COMBOS[5], null, null);
  await expect(page.locator('.banner')).toBeVisible();
});

test('18. the photo is a cut-paper cartoon of Sarah asleep, never a real photograph', async ({ page }) => {
  await startStory(page);
  await page.keyboard.press('Space'); // s1_02: the photo line
  await expect(page.locator('.chat .photo-tile')).toBeVisible();
  expect(await page.locator('img').count()).toBe(0); // no photographs at all
  const label = await page.locator('.photo-tile').first().getAttribute('aria-label');
  expect(label).toBe('Photo of Sarah asleep on the bus with her mouth open');
  expect(await page.locator('.chat .photo-tile text').count()).toBe(0); // no "hidden" label any more
  expect(await page.locator('.chat .photo-tile ellipse').count()).toBeGreaterThan(3); // it is drawn
});

test('sound and auto-play start on, and Pause and the sound button turn them off', async ({ page }) => {
  await startStory(page, { keepAuto: true });
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Sound on\. Turn sound off/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Auto-play' })).toBeVisible();
  await page.getByRole('button', { name: /Turn sound off/ }).click();
  await expect(page.getByRole('button', { name: /Turn sound on/ })).toBeVisible();
});

test('Home is short: digital citizenship through an adaptive story, the made-up note and wellbeing email, no photo, no 18+ line', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('digital citizenship');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('adaptive story');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The choice is yours.');
  await expect(page.locator('main').getByText(/18|for adults/i)).toHaveCount(0); // no age line on Home (the age question comes first in the start flow)
  await expect(page.getByText('About 10 minutes')).toHaveCount(0);
  await expect(page.getByText('Tell us a little')).toHaveCount(0);
  await expect(page.getByText('This story is made up.').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Wellbeing.Ambassadors@nottingham.edu.my' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start the story' })).toBeVisible();
  await expect(page.locator('.photo-tile, .diorama')).toHaveCount(0);
  // Story 1 can be played. Stories 2, 3 and 4 are shown as Coming soon and cannot be opened.
  await expect(page.getByRole('link', { name: /^Story 1/ })).toBeVisible();
  for (const n of ['Story 2', 'Story 3', 'Story 4']) await expect(page.locator('main').getByText(n, { exact: true })).toBeVisible();
  await expect(page.locator('main').getByText('Coming soon')).toHaveCount(3);
  await expect(page.getByRole('link', { name: /^Story 2/ })).toHaveCount(0);
  await page.getByRole('link', { name: /^Story 1/ }).click();
  await expect(page).toHaveURL(/\/start/);
});

test('Start the story always starts from the beginning, even after a story was under way', async ({ page }) => {
  await startStory(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /continue/i })).toHaveCount(0);
  await page.getByRole('link', { name: 'Start the story' }).click();
  await expect(page).toHaveURL(/\/start/);
  await expect(page.getByRole('button', { name: 'Yes, I am 18 or older' })).toBeVisible();
});

test('Support shows the wellbeing email and the group leader (Wei Feng) with their email, and no emergency row', async ({ page }) => {
  await page.goto('/support');
  await expect(page.getByText('Wei Feng')).toBeVisible();
  await expect(page.getByRole('link', { name: 'hfywh4@nottingham.edu.my' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Wellbeing.Ambassadors@nottingham.edu.my' })).toBeVisible();
  await expect(page.getByText('Emergency', { exact: true })).toHaveCount(0);
  await expect(page.getByText('team to add')).toHaveCount(0);
});

test('before the story: a made-up note with the wellbeing email, and the reminder again before Begin', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: 'Yes, I am 18 or older' }).click();
  await expect(page.getByText('This story is made up.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Wellbeing.Ambassadors@nottingham.edu.my' })).toBeVisible();
  await page.getByRole('button', { name: 'I understand this story is made up' }).click();
  await page.getByRole('button', { name: 'Skip writing' }).click();
  await page.getByRole('button', { name: 'sad', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: 'Something someone did' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('A reminder: this story is made up')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Story 1' })).toBeVisible();
  await expect(page.getByText('Coming soon')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Wellbeing.Ambassadors@nottingham.edu.my' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
});

test('the speaking character shows with a moving mouth, and the narrator has no portrait', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeAudio {
      src: string; currentTime = 0; preload = ''; onended: null | (() => void) = null; onerror: null | (() => void) = null;
      constructor(src?: string) { this.src = src ?? ''; }
      play() { setTimeout(() => this.onended?.(), 4000); return Promise.resolve(); }
      pause() { /* nothing to stop */ }
    }
    (window as unknown as { Audio: unknown }).Audio = FakeAudio;
  });
  await startStory(page); // paused, on the narrator's first line
  await expect(page.locator('.plate .portrait')).toHaveCount(0);
  await page.keyboard.press('Space'); // s1_02: Lisa
  await expect(page.locator('.plate .portrait.lisa')).toBeVisible();
  await expect(page.locator('.plate .portrait.lisa.talking')).toBeVisible(); // her voice is playing
  const mouths = new Set<string>();
  for (let i = 0; i < 12; i++) { mouths.add(await page.locator('.plate .portrait').innerHTML()); await page.waitForTimeout(60); }
  expect(mouths.size).toBeGreaterThan(1); // the mouth moved
});

test('a choice: number keys pick, and the two panels look like a game screen', async ({ page }) => {
  await startStory(page);
  await toDecision(page);
  await expect(page.locator('.decide .step')).toHaveText('Decision 1 of 3');
  await expect(page.locator('.decide .co').nth(0)).toHaveAttribute('data-n', '1');
  await expect(page.locator('.decide .co').nth(1)).toHaveAttribute('data-n', '2');
  await expect(page.locator('.decide')).not.toContainText('few seconds');
  await page.keyboard.press('2');
  await expect(page.locator('.plate .line')).toContainText('Can we take this down?', { timeout: 6000 }); // the "reply in the group chat" beat
});

test('the debrief after the story: what happened, who should have seen it, how it could have gone, and the moral', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: false, forceFail: false, ratings: {} })));
  await startStory(page); // auto-play is paused
  await playThrough(page, COMBOS[0], null, null);
  await page.getByRole('button', { name: 'Show me what happened' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'What happened' })).toBeVisible();
  await expect(page.locator('.db-chain li')).toHaveCount(3);
  const next = page.getByRole('button', { name: 'Next', exact: true });
  for (let k = 0; k < 2; k++) await next.click();
  await expect(page.getByRole('heading', { name: 'Who should have seen it coming?' })).toBeVisible();
  await expect(page.locator('.db-people li')).toHaveCount(4);
  await expect(page.getByText('Ask Sarah first, or don\'t post it.')).toBeVisible();
  for (let k = 0; k < 3; k++) await next.click();
  await expect(page.getByRole('heading', { name: 'How it could have gone' })).toBeVisible();
  await expect(page.locator('.db-steps li')).toHaveCount(4);
  for (let k = 0; k < 2; k++) await next.click();
  await expect(page.getByRole('heading', { name: 'The moral' })).toBeVisible();
  await next.click(); // the last line
  await expect(page.getByText('Ask before you share. If it goes wrong, own it and make it right.').first()).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: "Want to try one more? It's a short, similar situation." })).toBeVisible();
});

test('auto-play with sound: a line moves on a moment after its voice ends, and the voice files are served', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __played: string[]; Audio: unknown };
    w.__played = [];
    class FakeAudio {
      src: string; currentTime = 0; preload = ''; onended: null | (() => void) = null; onerror: null | (() => void) = null;
      constructor(src?: string) { this.src = src ?? ''; }
      play() { w.__played.push(this.src); setTimeout(() => this.onended?.(), 700); return Promise.resolve(); }
      pause() { /* nothing to stop */ }
    }
    w.Audio = FakeAudio;
  });
  await startStory(page, { keepAuto: true });
  const first = await page.locator('.plate .line').textContent();
  // The pretend voice ends after 0.7 s, so the next line shows well before the 4.4 s a silent first line would wait.
  await expect.poll(() => page.locator('.plate .line').textContent(), { timeout: 3000 }).not.toBe(first);
  expect(await page.evaluate(() => (window as unknown as { __played: string[] }).__played.join(','))).toContain('/audio/s1_01.mp3');
  const file = await page.request.get('/audio/s1_01.mp3');
  expect(file.ok()).toBe(true);
  expect(file.headers()['content-type']).toContain('audio');
});

test('auto-play: lines move on by themselves, Pause holds, and a decision always waits', async ({ page }) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: false, forceFail: false, ratings: {} })));
  await startStory(page); // pauses auto-play
  const text = () => page.locator('.plate .line').textContent();
  const first = await text();
  await page.getByRole('button', { name: 'Auto-play' }).click();
  await expect.poll(text, { timeout: 15_000 }).not.toBe(first); // moved on with no key press
  await page.getByRole('button', { name: 'Pause' }).click();
  const held = await text();
  await page.waitForTimeout(5000);
  expect(await text()).toBe(held); // paused: it stays put
  await page.getByRole('button', { name: 'Auto-play' }).click();
  await expect(page.locator('.decide')).toBeVisible({ timeout: 100_000 }); // it plays on to the first decision
  await page.waitForTimeout(5000);
  await expect(page.locator('.decide')).toBeVisible(); // and waits there
});

test('13 (support). "Need support?" is reachable from every screen', async ({ page }) => {
  const has = async (where: string) => expect(page.getByRole('link', { name: 'Need support?' }).first(), where).toBeVisible();
  for (const p of ['/', '/about', '/start']) { await page.goto(p); await has(p); }
  await startStory(page);
  await has('story'); // the stage bar
  await toDecision(page); await has('decision');
  await page.getByRole('button', { name: D1.private }).click();
  await has('why');
  const { rather } = await import('./helpers');
  await rather(page);
  await choose(page, D2.tell); await choose(page, D3.accept); await rather(page); await toFeedback(page);
  await has('feedback');
  await page.getByRole('button', { name: 'Show me what happened' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await has('debrief');
  await page.getByRole('button', { name: 'Skip debrief' }).click();
  await has('reflect');
  await page.getByRole('button', { name: 'No thanks' }).click();
  await has('end');
  await page.getByRole('link', { name: 'Need support?' }).first().click();
  await expect(page.getByText('Wellbeing.Ambassadors@nottingham.edu.my')).toBeVisible();
  await expect(page.getByText('If you are in danger now, contact local emergency services.')).toBeVisible();
});

test('settings: text size never goes below the floor, Simple visuals and exit work', async ({ page }) => {
  await startStory(page);
  const size = () => page.evaluate(() => getComputedStyle(document.querySelector('.plate .line')!).fontSize);
  expect(await size()).toBe('22px');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Larger text' }).click();
  expect(await size()).toBe('24px');
  await page.getByRole('button', { name: 'Smaller text' }).click();
  await page.getByRole('button', { name: 'Smaller text' }).click();
  expect(await size()).toBe('20px'); // the floor
  await expect(page.getByRole('button', { name: 'Smaller text' })).toBeDisabled();
  await page.getByRole('switch', { name: 'Simple visuals' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Leave the story?' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep playing' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('"Back one line" works inside a scene but never undoes a choice', async ({ page }) => {
  await startStory(page);
  const line = page.locator('.plate .line');
  const first = await line.innerText();
  await page.keyboard.press('Space');
  await expect(line).not.toHaveText(first);
  await page.getByRole('button', { name: 'Back one line' }).click();
  await expect(line).toHaveText(first);
  await expect(page.getByRole('button', { name: 'Back one line' })).toBeDisabled();
  await choose(page, D1.group);
  await expect(page.getByRole('button', { name: 'Back one line' })).toBeDisabled(); // first line of the beat
});

test('15a. a full run with the keyboard only', async ({ page }) => {
  const nameOf = () => page.evaluate(() => { const e = document.activeElement as HTMLElement | null; return ((e?.getAttribute('aria-label') || e?.textContent || '') + '').trim(); });
  const tabTo = async (re: RegExp, max = 60) => { for (let i = 0; i < max; i++) { await page.keyboard.press('Tab'); if (re.test(await nameOf())) return; } throw new Error(`could not tab to ${re}`); };
  const press = async (re: RegExp) => { await tabTo(re); await page.keyboard.press('Enter'); };
  await page.goto('/start');
  await press(/^Yes, I am 18 or older$/);
  await press(/^I understand this story is made up$/);
  await press(/^Skip writing$/);
  await tabTo(/^sad$/); await page.keyboard.press('Enter');
  await press(/^Next$/);
  await tabTo(/^Something someone did/); await page.keyboard.press('Space');
  await press(/^Next$/);
  await page.getByRole('button', { name: 'Begin' }).waitFor();
  await press(/^Begin$/);
  await page.waitForURL('**/play');
  await toDecision(page); // Space only
  await tabTo(/^Message Lisa privately/); await page.keyboard.press('Enter');
  await toWhy(page);
  await tabTo(/^I would rather not answer/); await page.keyboard.press('Enter');
  await press(/^Go on$/);
  await toDecision(page);
  await tabTo(/^Tell Sarah/); await page.keyboard.press('Enter');
  await toDecision(page);
  await tabTo(/^Accept her excuse/); await page.keyboard.press('Enter');
  await toWhy(page);
  await tabTo(/^I would rather not answer/); await page.keyboard.press('Enter');
  await press(/^Go on$/);
  await toFeedback(page);
  await expect(page.locator('.banner')).toBeVisible();
  // focus ring is visible on a focused control
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(ring).toBe('solid');
});

test.describe('15b. at 390px wide', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a full run, with no sideways scroll and touch targets of 44px or more', async ({ page }) => {
    const noSideScroll = async (w: string) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), w).toBe(true);
    await page.goto('/'); await noSideScroll('home');
    await startStory(page);
    await noSideScroll('stage');
    const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.hbtn, .btn, .chip, .co')].filter((e) => e.offsetParent !== null).map((e) => ({ n: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), h: e.getBoundingClientRect().height, w: e.getBoundingClientRect().width })).filter((e) => e.h < 43.5 || e.w < 43.5));
    expect(small).toEqual([]);
    await toDecision(page);
    await noSideScroll('decision');
    await page.getByRole('button', { name: D1.group }).click();
    await toWhy(page);
    await noSideScroll('why');
    const { rather } = await import('./helpers');
    await rather(page);
    await choose(page, D2.delete); await choose(page, D3.hold); await rather(page); await toFeedback(page);
    await noSideScroll('feedback');
  });
});


