import { test } from '@playwright/test';
import { startStory } from '../e2e/helpers';

// Screenshots of the 3D bus, one per line. Not part of the pass/fail suite: set SHOTS=<folder>.
const out = process.env.SHOTS;
test.skip(!out, 'set SHOTS=<folder> to take screenshots');

test('the bus, line by line', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message.slice(0, 300)));
  await page.addInitScript(() => localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: true, forceFail: false, ratings: {} })));
  await startStory(page, { prologue: true });
  for (let k = 0; k < 10; k++) {
    await page.waitForTimeout(k === 0 ? 4500 : 3200); // the camera glides to the new shot
    await page.screenshot({ path: `${out}/bus-${String(k + 1).padStart(2, '0')}.png` });
    console.log('canvas', await page.locator('canvas').count(), 'wrap on', await page.locator('.stage3d-wrap.on').count());
    await page.keyboard.press('Space');
  }
  console.log(logs.slice(0, 12).join('\n'));
});
