import { test } from '@playwright/test';
import { startStory } from '../e2e/helpers';

// Screenshots of the dorm room (scenes 1 and 2), one per line. Set SHOTS=<folder>.
const out = process.env.SHOTS;
test.skip(!out, 'set SHOTS=<folder> to take screenshots');

test('the dorm room, line by line', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message.slice(0, 300)));
  await page.addInitScript(() => localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: true, forceFail: false, ratings: {} })));
  await startStory(page); // the dorm room, after the bus
  for (let k = 1; k <= 11; k++) {
    await page.waitForTimeout(k === 1 ? 4500 : 3200);
    await page.screenshot({ path: `${out}/dorm-${String(k).padStart(2, '0')}.png` });
    await page.keyboard.press('Space');
  }
  console.log(logs.filter((l) => !/404|THREE.Clock/.test(l)).slice(0, 10).join('\n'));
});
