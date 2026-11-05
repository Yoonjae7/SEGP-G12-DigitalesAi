import { expect, test } from '@playwright/test';
import { COMBOS, D1, D2, D3, choose, localSession, playThrough, rather, startStory, toDecision, toFeedback, toWhy } from './helpers';

const SOLID1 = 'Lisa posted it without asking. Marco and Dev forwarded it, which spread it. Sarah could be humiliated, and I should have spoken up sooner.';
const SOLID2 = 'I disagree with her because Sarah could be humiliated once it spreads, even if Lisa meant it as a joke.';

test.describe('the whole journey', () => {
  for (const c of COMBOS) {
    test(`1. choices ${c.join(' / ')} reach S7 and an ending`, async ({ page }) => {
      await startStory(page);
      await playThrough(page, c, null, null);
      await expect(page.locator('.banner')).toHaveText(/Your ending came from your written answers, not from which option you picked\./);
      const s = await localSession(page);
      expect(s.ending).toBe('B'); // both skipped counts as 0, so the choices alone never reach A
      expect(s.events.some((e: { event: string; payload: { sceneId?: string } }) => e.event === 'scene_enter' && e.payload.sceneId === 's7')).toBe(true);
    });
  }

  test('4. Ending A is reachable, with both answers thorough', async ({ page }) => {
    await startStory(page);
    await playThrough(page, ['private', 'tell', 'hold'], SOLID1, SOLID2, 'Sarah did not have a say, and she could be hurt a lot if more people save it.', 'Someone could argue Lisa was only joking, but it does not change that Sarah was hurt.');
    const s = await localSession(page);
    expect(s.ending).toBe('A');
    await expect(page.getByRole('heading', { name: 'What do you think Sarah needed most from Lisa, Marco and Dev?' })).toBeVisible();
    // Ask, then explain
    await page.getByRole('radio', { name: 'A clear sorry' }).click();
    await page.getByRole('button', { name: 'Show me what happened' }).click();
    await expect(page.getByRole('heading', { name: 'What happened' })).toBeVisible();
    await expect(page.getByText('You messaged Lisa privately')).toBeVisible();
    await expect(page.getByText('You held Lisa responsible')).toBeVisible();
    await expect(page.getByText("There's no single right path.")).toBeVisible();
  });

  test('4. Ending B is reachable, and the same choices do not decide it', async ({ page }) => {
    await startStory(page);
    // the same choices as the Ending A run above, but thin reasoning
    await playThrough(page, ['private', 'tell', 'hold'], 'Lisa posted it, so it is her fault.', 'I do not agree with Lisa about this one.', 'It is mostly Lisa.', 'Because I think so.');
    expect((await localSession(page)).ending).toBe('B');
    await expect(page.getByRole('heading', { name: 'The photo is still in two chats. What do you think would help most now?' })).toBeVisible();
  });

  test('16. refresh at a decision, a Why and the feedback resumes at the same step with choices intact', async ({ page }) => {
    await startStory(page);
    await toDecision(page);
    await page.reload();
    await expect(page.locator('.decide')).toBeVisible();
    await page.getByRole('button', { name: D1.group }).click();
    await toWhy(page);
    await page.locator('.nb textarea').fill('half a thought');
    await page.reload();
    await expect(page.locator('.nb textarea')).toHaveValue('half a thought');
    await page.getByRole('button', { name: 'I would rather not answer' }).click();
    await page.getByRole('button', { name: 'Go on' }).click();
    await choose(page, D2.tell);
    await page.reload();
    await expect.poll(async () => (await localSession(page)).choices).toEqual({ d1: 'group', d2: 'tell' });
    await choose(page, D3.accept);
    await rather(page);
    await toFeedback(page);
    await page.reload();
    await expect(page.locator('.banner')).toBeVisible();
  });

  test('17. Delete my data clears everything', async ({ page }) => {
    await startStory(page);
    await playThrough(page, ['group', 'delete', 'accept'], null, null);
    await page.getByRole('radio', { name: 'Not sure' }).click();
    await page.getByRole('button', { name: 'Show me what happened' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'No thanks' }).click();
    await expect(page.getByRole('heading', { name: 'Thanks for playing.' })).toBeVisible();
    expect(await localSession(page)).not.toBeNull();
    await page.getByRole('button', { name: 'Delete my data' }).click();
    await expect(page).toHaveURL(/deleted=1/);
    const left = await page.evaluate(() => ({ session: localStorage.getItem('dt_session_v1'), lab: localStorage.getItem('dt_lab_v1'), n: localStorage.length }));
    expect(left.session).toBeNull();
    expect(left.n).toBe(0);
  });

  test('Download my log gives the learner their own JSON, with no name or email in it', async ({ page }) => {
    await startStory(page);
    await playThrough(page, ['group', 'delete', 'accept'], null, null);
    await page.getByRole('button', { name: 'Show me what happened' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'No thanks' }).click();
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download my log' }).click();
    const file = await (await dl).createReadStream();
    const chunks: Buffer[] = [];
    for await (const ch of file!) chunks.push(Buffer.from(ch));
    const log = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    expect(log.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(Object.keys(log.events[0]).sort()).toEqual(['event', 'payload', 'sessionId', 'ts']);
    expect(JSON.stringify(log)).not.toMatch(/@/);
  });
});

test('Reflect: the optional extra moment follows the same pattern and is skippable', async ({ page }) => {
  await startStory(page);
  await playThrough(page, ['group', 'delete', 'accept'], null, null);
  await page.getByRole('button', { name: 'Show me what happened' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: "Want to try one more? It's a short, similar situation." })).toBeVisible();
  await page.getByRole('button', { name: 'Yes, one more' }).click();
  await expect(page.getByText('A friend sends you a screenshot of a private chat.')).toBeVisible();
  await page.locator('textarea').fill('It would hurt a classmate in the class group, and then people would pass it on and it spreads.');
  await page.getByRole('button', { name: 'Send my answer' }).click();
  await expect(page.getByText("What's one thing you could do at the start to change how it turns out?")).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByRole('heading', { name: 'Thanks for playing.' })).toBeVisible();
});

