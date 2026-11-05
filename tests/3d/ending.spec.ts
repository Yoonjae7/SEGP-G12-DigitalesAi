import { expect, test, type Page } from '@playwright/test';
import { D1, D2, D3, choose, finishWhy, startStory, toWhy } from '../e2e/helpers';

// The good ending in 3D (both written answers solid). Set SHOTS=<folder>.
const out = process.env.SHOTS;
test.skip(!out, 'set SHOTS=<folder> to take screenshots');

const SOLID1 = 'Lisa posted it without asking. Marco and Dev forwarded it, which spread it. Sarah could be humiliated, and I should have spoken up sooner.';
const SOLID2 = 'I disagree with her because Sarah could be humiliated once it spreads, even if Lisa meant it as a joke.';

async function goto(page: Page, text: string) {
  for (let i = 0; i < 40; i++) {
    const now = (await page.locator('.plate .line').textContent({ timeout: 400 }).catch(() => '')) ?? '';
    if (now.includes(text)) return;
    await page.keyboard.press('Space');
    await page.waitForTimeout(70);
  }
  expect(await page.locator('.plate .line').textContent()).toContain(text);
}

test('the good ending in 3D', async ({ page }) => {
  test.setTimeout(900_000);
  await page.addInitScript(() => localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: true, forceFail: false, ratings: {} })));
  const shot = async (name: string, wait = 3600) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${out}/${name}.png` }); };
  await startStory(page);
  await choose(page, D1.private);
  await toWhy(page);
  await page.locator('.nb textarea').fill(SOLID1);
  await page.getByRole('button', { name: 'Send my answer' }).click();
  await finishWhy(page, 'Sarah did not have a say, and she could be hurt a lot if more people save it.');
  await choose(page, D2.tell);
  await choose(page, D3.hold);
  await toWhy(page);
  await page.locator('.nb textarea').fill(SOLID2);
  await page.getByRole('button', { name: 'Send my answer' }).click();
  await finishWhy(page, 'Someone could argue Lisa was only joking, but it does not change that Sarah was hurt.');
  await goto(page, 'two days later'); await shot('eA-0', 4500);
  await goto(page, 'Sarah asks to meet'); await shot('eA-1', 4500);
  await goto(page, 'I posted a photo of you'); await shot('eA-2');
  await goto(page, 'Thank you. I want it gone'); await shot('eA-3');
  await goto(page, 'Within an hour'); await shot('eA-5');
  await goto(page, 'Sarah finally smiles'); await shot('eA-6');
});
