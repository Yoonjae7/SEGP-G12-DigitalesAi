import { test } from '@playwright/test';
import { D1, D2, D3, choose, rather, startStory, toDecision, toFeedback, toWhy, writeWhy } from './helpers';

// Not part of the pass/fail suite: set SHOTS=<folder> to write screenshots of the key screens for a visual check.
const out = process.env.SHOTS;
test.skip(!out, 'set SHOTS=<folder> to take screenshots');

test('screenshots', async ({ page }) => {
  const shot = (name: string) => page.screenshot({ path: `${out}/${name}.png` });
  await page.goto('/'); await page.waitForTimeout(800); await shot('01-home');
  await startStory(page, { text: 'A friend passed round a photo of a classmate. I was worried it would spread.' });
  await page.waitForTimeout(700); await shot('02-narration');
  await page.keyboard.press('Space'); await page.waitForTimeout(600); await shot('03-chat');
  await toDecision(page); await page.waitForTimeout(600); await shot('04-decision');
  await page.getByRole('button', { name: D1.group }).click();
  await writeWhy(page, 'Lisa posted the photo and Marco and Dev passed it on. I should have said something sooner.');
  await page.waitForTimeout(300); await shot('05-reading');
  await page.locator('.nb .fu').waitFor(); await page.waitForTimeout(500); await shot('06-followup');
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.waitForTimeout(700); await shot('07-s4');
  await choose(page, D2.tell); await page.waitForTimeout(500); await shot('08-s4-beat');
  await choose(page, D3.hold); await page.waitForTimeout(500);
  await rather(page); await toFeedback(page); await page.waitForTimeout(400); await shot('09-feedback-ask');
  await page.getByRole('button', { name: 'Show me what happened' }).click(); await page.waitForTimeout(300); await shot('10-feedback-explain');
});

test('screenshots at 390', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const shot = (name: string) => page.screenshot({ path: `${out}/m-${name}.png` });
  await page.goto('/'); await page.waitForTimeout(800); await shot('01-home');
  await startStory(page);
  await page.waitForTimeout(700); await shot('02-narration');
  await page.keyboard.press('Space'); await page.waitForTimeout(500); await shot('03-chat');
  await toDecision(page); await page.waitForTimeout(600); await shot('04-decision');
  await page.getByRole('button', { name: D1.private }).click();
  await writeWhy(page, 'Lisa posted it, so it is her fault.');
  await page.locator('.nb .fu').waitFor(); await page.waitForTimeout(500); await shot('05-followup');
});

test('screenshots in 3D', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 300)); });
  await startStory(page);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/3d-01-s1.png` });
  console.log('canvas count', await page.locator('canvas').count(), 'wrap on', await page.locator('.stage3d-wrap.on').count());
  await toDecision(page); await page.waitForTimeout(2500); await page.screenshot({ path: `${out}/3d-02-s2.png` });
  await page.getByRole('button', { name: D1.group }).click();
  await writeWhy(page, 'Lisa posted it, so it is her fault.');
  await page.locator('.nb .fu').waitFor(); await page.waitForTimeout(2500); await page.screenshot({ path: `${out}/3d-03-why.png` });
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.waitForTimeout(3000); await page.screenshot({ path: `${out}/3d-04-s4.png` });
  console.log(logs.slice(0, 8).join('\n'));
});
