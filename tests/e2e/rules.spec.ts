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

test('18. the photo is only ever a labelled placeholder tile', async ({ page }) => {
  await startStory(page);
  await page.keyboard.press('Space'); // s1_02: the photo line
  await expect(page.locator('.chat .photo-tile')).toBeVisible();
  expect(await page.locator('img').count()).toBe(0);
  const label = await page.locator('.photo-tile').first().getAttribute('aria-label');
  expect(label).toBe('Photo (hidden)');
  expect(await page.locator('.chat .photo-tile text').first().textContent()).toBe('Photo (hidden)');
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
  await has('reflect');
  await page.getByRole('button', { name: 'No thanks' }).click();
  await has('end');
  await page.getByRole('link', { name: 'Need support?' }).first().click();
  await expect(page.getByText('[University wellbeing service: team to add contact]')).toBeVisible();
  await expect(page.getByText('If you are in danger now, contact local emergency services.')).toBeVisible();
});

test('settings: text size never goes below the floor, Simple visuals and exit work', async ({ page }) => {
  await startStory(page);
  const size = () => page.evaluate(() => getComputedStyle(document.querySelector('.plate .line')!).fontSize);
  expect(await size()).toBe('24px');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Larger text' }).click();
  expect(await size()).toBe('26px');
  await page.getByRole('button', { name: 'Smaller text' }).click();
  await page.getByRole('button', { name: 'Smaller text' }).click();
  expect(await size()).toBe('22px'); // the floor
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
  await press(/^I understand$/);
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


