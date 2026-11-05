import { expect, test } from '@playwright/test';
import { D1, choose, startStory, toWhy } from './helpers';

// A learner types one key at a time. Filling the whole box at once hides a box that loses focus after each key.
const SENTENCE = 'Lisa posted it without asking, and Marco and Dev passed it on.';

test('typing in a written answer keeps going: the box keeps focus for every key', async ({ page }) => {
  await startStory(page);
  await choose(page, D1.private);
  await toWhy(page);
  const box = page.locator('.nb textarea');
  await box.click();
  await page.keyboard.type(SENTENCE, { delay: 15 });
  await expect(box).toHaveValue(SENTENCE);
  await expect(box).toBeFocused();
});

test('typing in the follow-up box also keeps going', async ({ page }) => {
  await startStory(page);
  await choose(page, D1.private);
  await toWhy(page);
  await page.locator('.nb textarea').fill('Lisa did it.');
  await page.getByRole('button', { name: 'Send my answer' }).click();
  const follow = page.locator('.nb .fu');
  await expect(follow).toBeVisible({ timeout: 20_000 });
  const box = page.locator('.nb textarea');
  await box.click();
  await page.keyboard.type(SENTENCE, { delay: 15 });
  await expect(box).toHaveValue(SENTENCE);
});
