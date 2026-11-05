import { expect, type Page } from '@playwright/test';

export const D1 = { private: 'Message Lisa privately.', group: 'Reply in the group chat.' };
export const D2 = { tell: 'Tell Sarah what is happening.', delete: 'Ask Marco and Dev to delete it first.' };
export const D3 = { accept: 'Accept her excuse.', hold: 'Hold her responsible.' };

/** Gets through the start flow. Leaves the page on the first line of the story. */
export async function startStory(page: Page, opts: { text?: string; skipWriting?: boolean; url?: string; keepAuto?: boolean } = {}) {
  await page.goto(opts.url ?? '/start');
  await page.getByRole('button', { name: 'Yes, I am 18 or older' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  if (opts.skipWriting) {
    await page.getByRole('button', { name: 'Skip writing' }).click();
    await page.getByRole('button', { name: 'sad', exact: true }).click();
  } else {
    await page.getByLabel('Your online moment').fill(opts.text ?? 'A friend passed round a photo of a classmate. I was worried it would spread.');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
  await expect(nextBtn).toBeVisible({ timeout: 20_000 });
  if (await nextBtn.isDisabled()) await page.getByRole('button', { name: 'sad', exact: true }).click(); // no guess to start from
  await nextBtn.click();
  await page.getByRole('radio', { name: 'Something someone did' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.waitForURL('**/play');
  await expect(page.locator('.plate .line')).toBeVisible();
  // Auto-play is on by default. The tests press Space themselves, so they pause it first.
  if (!opts.keepAuto) {
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur()); // so Space goes on, not back to the button
  }
}

/** Presses Space (as a learner would) until the stop condition shows. */
export async function advanceUntil(page: Page, stop: () => Promise<boolean>, max = 80) {
  for (let i = 0; i < max; i++) {
    if (await stop()) return;
    await page.keyboard.press('Space');
    await page.waitForTimeout(40);
  }
  throw new Error('did not reach the stop condition');
}
// A choice that was just picked stays on screen for a moment (it lights up), so wait for one that is still open.
export const toDecision = (page: Page) => advanceUntil(page, async () => (await page.locator('.decide .cards:not(.picking)').count()) > 0);
export const toWhy = (page: Page) => advanceUntil(page, async () => (await page.locator('.nb').count()) > 0);
export const toFeedback = (page: Page) => advanceUntil(page, async () => (await page.locator('.banner').count()) > 0);

export async function choose(page: Page, label: string) {
  await toDecision(page);
  await page.getByRole('button', { name: label }).click();
}

/** Goes through a Why with "I would rather not answer". */
export async function rather(page: Page) {
  await toWhy(page);
  await page.getByRole('button', { name: 'I would rather not answer' }).click();
  await page.getByRole('button', { name: 'Go on' }).click();
}

export async function writeWhy(page: Page, text: string) {
  await toWhy(page);
  await page.locator('.nb textarea').fill(text);
  await page.getByRole('button', { name: 'Send my answer' }).click();
}

export async function localSession(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('dt_session_v1') ?? 'null'));
}

/** All eight choice combinations, with both written answers skipped. */
export const COMBOS = [
  ['private', 'tell', 'accept'], ['private', 'tell', 'hold'], ['private', 'delete', 'accept'], ['private', 'delete', 'hold'],
  ['group', 'tell', 'accept'], ['group', 'tell', 'hold'], ['group', 'delete', 'accept'], ['group', 'delete', 'hold'],
] as const;

export async function playThrough(page: Page, c: readonly [keyof typeof D1, keyof typeof D2, keyof typeof D3], why1: string | null, why2: string | null, follow1?: string, follow2?: string) {
  await choose(page, D1[c[0]]);
  if (why1) { await writeWhy(page, why1); await finishWhy(page, follow1); } else await rather(page);
  await choose(page, D2[c[1]]);
  await choose(page, D3[c[2]]);
  if (why2) { await writeWhy(page, why2); await finishWhy(page, follow2); } else await rather(page);
  await toFeedback(page);
}

/** Answers the follow-up (or skips it), then goes past the thank-you if there is one. */
export async function finishWhy(page: Page, follow?: string) {
  const fu = page.locator('.nb .fu');
  await expect(fu.or(page.getByRole('button', { name: 'Go on' }))).toBeVisible({ timeout: 20_000 });
  if (await fu.count()) {
    if (follow) {
      await page.locator('.nb textarea').fill(follow);
      await page.getByRole('button', { name: 'Send', exact: true }).click();
      await page.getByRole('button', { name: 'Go on' }).click({ timeout: 20_000 });
    } else {
      await page.getByRole('button', { name: 'Skip' }).click();
    }
  } else {
    await page.getByRole('button', { name: 'Go on' }).click();
  }
}


