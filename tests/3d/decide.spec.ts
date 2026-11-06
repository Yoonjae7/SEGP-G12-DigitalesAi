import { test, type Page } from '@playwright/test';
import { D1, startStory, toDecision } from '../e2e/helpers';

// The dorm room from the first message to the end of the first decision's beat, one screenshot per line. Set SHOTS=<folder>.
// PATH=group takes the group-chat option instead of the private message.
const out = process.env.SHOTS;
test.skip(!out, 'set SHOTS=<folder> to take screenshots');

const grab = async (page: Page, name: string, wait = 3000) => {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png` });
};

test('the first decision, line by line', async ({ page }) => {
  test.setTimeout(300_000);
  const logs: string[] = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message.slice(0, 300)));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404|THREE.Clock/.test(m.text())) logs.push(m.type() + ' ' + m.text().slice(0, 400)); });
  await page.addInitScript(() => localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: true, forceFail: false, ratings: {} })));
  await startStory(page); // the dorm room, after the bus
  let k = 0;
  for (let i = 0; i < 20; i++) {
    if ((await page.locator('.decide .cards:not(.picking)').count()) > 0) break;
    await grab(page, `d1-${String(++k).padStart(2, '0')}`, k === 1 ? 4500 : 3000);
    await page.keyboard.press('Space');
  }
  await toDecision(page);
  await grab(page, `d1-${String(++k).padStart(2, '0')}-cards`, 3500);
  const group = process.env.PATH_CHOICE === 'group';
  await page.getByRole('button', { name: group ? D1.group : D1.private }).click();
  for (let i = 0; i < 6; i++) {
    await grab(page, `d1-${String(++k).padStart(2, '0')}-beat`, 3200);
    const text = (await page.locator('.plate .line').textContent({ timeout: 400 }).catch(() => '')) ?? '';
    if (/midnight/i.test(text)) break;
    await page.keyboard.press('Space');
  }
  if (logs.length) console.log(logs.join('\n'));
});
