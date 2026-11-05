import { test } from '@playwright/test';
import { D1, choose, rather, startStory } from '../e2e/helpers';

// Screenshots of the scenes that still use the layered paper scene in 3D (after the bus). Set SHOTS=<folder>.
const out = process.env.SHOTS;
test.skip(!out, 'set SHOTS=<folder> to take screenshots');

test('the rest of the story in 3D', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message.slice(0, 300)));
  await page.addInitScript(() => localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: true, forceFail: false, ratings: {} })));
  await startStory(page); // lands on the dorm room, after the bus
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${out}/rest-1-s1.png` });
  await choose(page, D1.group);
  await rather(page);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${out}/rest-2-s4.png` });
  console.log(logs.filter((l) => !/404|THREE.Clock/.test(l)).slice(0, 10).join('\n'));
});
