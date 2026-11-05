import { expect, test, type Page } from '@playwright/test';
import { D1, D2, D3, choose, rather, startStory } from '../e2e/helpers';

// One screenshot per scene in 3D, going through the story. Set SHOTS=<folder>.
const out = process.env.SHOTS;
test.skip(!out, 'set SHOTS=<folder> to take screenshots');

/** Presses Space until the caption contains the text. */
async function goto(page: Page, text: string) {
  for (let i = 0; i < 40; i++) {
    const now = (await page.locator('.plate .line').textContent({ timeout: 400 }).catch(() => '')) ?? '';
    if (now.includes(text)) return;
    await page.keyboard.press('Space');
    await page.waitForTimeout(70);
  }
  expect(await page.locator('.plate .line').textContent()).toContain(text);
}

test('every scene in 3D', async ({ page }) => {
  test.setTimeout(900_000);
  const logs: string[] = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message.slice(0, 300)));
  await page.addInitScript(() => localStorage.setItem('dt_lab_v1', JSON.stringify({ voice: false, threeD: true, forceFail: false, ratings: {} })));
  const shot = async (name: string, wait = 3600) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${out}/${name}.png` }); };
  await startStory(page); // the dorm room
  await choose(page, D1.private);
  await goto(page, 'By midnight'); await shot('s3-1', 4500);
  await goto(page, 'Just sent it'); await shot('s3-2');
  await goto(page, 'football group'); await shot('s3-3');
  await goto(page, 'three chats'); await shot('s3-4');
  await goto(page, 'Lisa read your message'); await shot('s3-5');
  await rather(page);
  await goto(page, "8:30 am"); await shot('s4-1', 4500);
  await goto(page, 'look at their phones'); await shot('s4-2');
  await goto(page, 'Why is everyone looking'); await shot('s4-3');
  await choose(page, D2.tell);
  await goto(page, 'Thank you for telling me first'); await shot('s5-1', 4500);
  await goto(page, 'hands are shaking'); await shot('s5-2');
  await goto(page, 'picks up her bag'); await shot('s5-3', 2200);
  await goto(page, 'Lisa walks in'); await shot('s5-4', 4000);
  await goto(page, 'one joke'); await shot('s6-1', 4500);
  await goto(page, 'You know me'); await shot('s6-2');
  await choose(page, D3.hold);
  await rather(page);
  await goto(page, 'two days later'); await shot('s7-1', 4500);
  console.log(logs.filter((l) => !/404|THREE.Clock/.test(l)).slice(0, 10).join('\n'));
});
