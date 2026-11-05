import { expect, test } from '@playwright/test';
import { D1, choose, localSession, startStory, toWhy, writeWhy } from './helpers';
import { story } from '../../lib/story';

const w1 = story.whys.why1;

/** Starts a story and gets to the first written answer. */
async function atWhy1(page: import('@playwright/test').Page, url?: string) {
  await startStory(page, { url });
  await choose(page, D1.private);
  await toWhy(page);
}

test.describe('adaptation: the follow-up fits the answer', () => {
  test('5a. one person named: "who else played a part"', async ({ page }) => {
    await atWhy1(page);
    await writeWhy(page, 'Lisa posted it, so it is her fault.');
    await expect(page.locator('.nb .fu')).toContainText(w1.followups.why1_fu_parties);
  });

  test('5b. a very short answer: the nudge, then one more try, then on', async ({ page }) => {
    await atWhy1(page);
    await writeWhy(page, 'Lisa is wrong');
    await expect(page.locator('.nb .fu')).toContainText(w1.nudge);
    await page.locator('.nb textarea').fill('Lisa is wrong');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    // still empty after the nudge: no second follow-up, it just goes on to the next scene
    await expect(page.locator('.nb')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('.plate .line')).toContainText('Wednesday, 8:30 am');
  });

  test('5c. a thorough answer: the harder question', async ({ page }) => {
    await atWhy1(page);
    await writeWhy(page, 'Lisa posted it without asking. Marco and Dev forwarded it, which spread it. Sarah could be humiliated, and I should have spoken up sooner.');
    await expect(page.locator('.nb .fu')).toContainText(w1.harder);
  });

  test('6. who did what with no consequence: asks what could happen to Sarah', async ({ page }) => {
    await atWhy1(page);
    await writeWhy(page, 'Lisa posted the photo. Marco and Dev forwarded it.');
    await expect(page.locator('.nb .fu')).toContainText(w1.followups.why1_fu_consequence);
  });

  test('7. a second answer never lowers the first, and there is no second follow-up', async ({ page }) => {
    await atWhy1(page);
    await writeWhy(page, 'Lisa posted it without asking. Marco and Dev forwarded it, which spread it. Sarah could be humiliated, and I should have spoken up sooner.');
    await expect(page.locator('.nb .fu')).toContainText(w1.harder);
    await page.locator('.nb textarea').fill('Not sure.');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByText(w1.ackHarder)).toBeVisible({ timeout: 20_000 });
    expect((await localSession(page)).why.why1.final).toBe(3);
    await page.getByRole('button', { name: 'Go on' }).click();
    await expect(page.locator('.nb')).toHaveCount(0);
  });

  test('8. "I would rather not answer" and "Skip" work and are logged', async ({ page }) => {
    await atWhy1(page);
    await page.getByRole('button', { name: 'I would rather not answer' }).click();
    await expect(page.getByText(w1.skipped)).toBeVisible();
    await page.getByRole('button', { name: 'Go on' }).click();
    const s = await localSession(page);
    expect(s.events.some((e: { event: string; payload: { promptId?: string } }) => e.event === 'skipped' && e.payload.promptId === 'why1')).toBe(true);
    // and a skipped follow-up
    await page.goto('/start'); // resumes the story
    await expect(page).toHaveURL(/play/);
    await choose(page, 'Ask Marco and Dev to delete it first.');
    // a picked choice lights up for a moment before it is recorded
    await expect.poll(async () => (await localSession(page)).choices.d2).toBe('delete');
  });

  test('skipping a follow-up is logged with no penalty', async ({ page }) => {
    await atWhy1(page);
    await writeWhy(page, 'Lisa posted it, so it is her fault.');
    await expect(page.locator('.nb .fu')).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();
    const s = await localSession(page);
    expect(s.events.some((e: { event: string; payload: { kind?: string } }) => e.event === 'skipped' && e.payload.kind === 'followup')).toBe(true);
    expect(s.why.why1.final).toBe(1);
  });

  test('13. ?fail=1 shows the error state, keeps the text, and the retry works', async ({ page }) => {
    await atWhy1(page, '/start?fail=1');
    const text = 'Lisa posted the photo. Marco and Dev forwarded it.';
    await writeWhy(page, text);
    await expect(page.getByText('We could not read your answer. Your text is saved. Try again.')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.nb textarea')).toHaveValue(text);
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('We could not read your answer. Your text is saved. Try again.')).toBeVisible({ timeout: 20_000 });
    // after two failures: go on without a follow-up
    await expect(page.getByRole('button', { name: 'Continue without a follow-up' })).toBeVisible();
    // turn the demo failure off and retry: it works, and the same text is scored
    await page.evaluate(() => sessionStorage.removeItem('dt_fail'));
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.nb .fu')).toContainText(w1.followups.why1_fu_consequence, { timeout: 20_000 });
    const s = await localSession(page);
    expect(s.events.filter((e: { event: string }) => e.event === 'score_error').length).toBe(2);
  });

  test('13b. "Continue without a follow-up" goes on and is logged', async ({ page }) => {
    await atWhy1(page, '/start?fail=1');
    await writeWhy(page, 'Lisa posted the photo. Marco and Dev forwarded it.');
    await page.getByRole('button', { name: 'Try again' }).click({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Continue without a follow-up' }).click({ timeout: 20_000 });
    await expect(page.locator('.plate .line')).toContainText('Wednesday, 8:30 am');
    const s = await localSession(page);
    expect(s.events.some((e: { event: string }) => e.event === 'score_unavailable')).toBe(true);
  });

  test('a safety phrase shows the support card, is not scored, and lets the learner continue', async ({ page }) => {
    await atWhy1(page);
    await writeWhy(page, 'Honestly I want to hurt myself because of what happened to me.');
    await expect(page.getByText('It sounds like something real may be going on. You do not have to continue.')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Wellbeing.Ambassadors@nottingham.edu.my')).toBeVisible();
    const s = await localSession(page);
    expect(s.events.some((e: { event: string }) => e.event === 'support_shown')).toBe(true);
    await page.getByRole('button', { name: 'Carry on' }).click();
    await expect(page.locator('.plate .line')).toContainText('Wednesday, 8:30 am');
  });
});
