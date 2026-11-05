/**
 * Makes one mp3 for every voiced line in content/story.json, using the ElevenLabs text-to-speech API.
 * Voice is made ahead of time, not while someone plays. The key is never in the browser.
 *
 *   npm run audio                  make only lines that are new or changed
 *   npm run audio -- --dry         list what would be made, and call nothing
 *   npm run audio -- --force       make every line again
 *   npm run audio -- --only s1_01,s2_02
 *
 * Needs ELEVENLABS_API_KEY in .env.local, and real voice IDs in voices.json.
 * Files go to public/audio/<lineId>.mp3. Commit them, so a deploy needs no key.
 *
 * If ElevenLabs keeps failing, make the files another way (for example in the ElevenLabs web app) and drop them in
 * public/audio with the same names. The line list is in design/motion-voice.html. Nothing else changes.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { allVoicedLines } from '../lib/voice/manifest';

const ROOT = process.cwd();
const OUT = join(ROOT, 'public', 'audio');
const CACHE = join(ROOT, '.audio-cache.json');
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const only = (() => { const i = args.indexOf('--only'); return i >= 0 ? new Set(args[i + 1].split(',')) : null; })();

try { process.loadEnvFile?.(join(ROOT, '.env.local')); } catch { /* no .env.local yet */ }

interface Voice { voiceId: string; settings: Record<string, number> }
const cfg = JSON.parse(readFileSync(join(ROOT, 'voices.json'), 'utf8')) as { model: string; speakers: Record<string, Voice> };
const model = process.env.ELEVENLABS_MODEL || cfg.model;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cache: Record<string, string> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const hash = (speaker: string, text: string, v: Voice) => createHash('sha256').update(JSON.stringify([speaker, text, v.voiceId, model, v.settings])).digest('hex');

async function speak(text: string, v: Voice): Promise<Buffer> {
  let lastErr = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'content-type': 'application/json', accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: model, voice_settings: v.settings }),
      });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      lastErr = `${res.status} ${(await res.text()).slice(0, 200)}`;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) break; // not worth retrying
    } catch (e) {
      lastErr = String(e);
    }
    await sleep(1500 * attempt);
  }
  throw new Error(lastErr);
}

async function main() {
  const lines = allVoicedLines().filter((l) => !only || only.has(l.id));
  mkdirSync(OUT, { recursive: true });
  const todo = lines.filter((l) => {
    const v = cfg.speakers[l.speaker];
    if (!v) return false;
    return flag('force') || !existsSync(join(OUT, `${l.id}.mp3`)) || cache[l.id] !== hash(l.speaker, l.text, v);
  });
  console.log(`${lines.length} voiced lines. ${todo.length} to make, ${lines.length - todo.length} up to date.`);
  if (flag('dry')) { todo.forEach((l) => console.log(`  ${l.id}  ${l.speaker}: ${l.text}`)); return; }
  if (!process.env.ELEVENLABS_API_KEY) { console.error('Set ELEVENLABS_API_KEY in .env.local first.'); process.exit(1); }
  const missing = [...new Set(todo.map((l) => l.speaker))].filter((s) => !cfg.speakers[s] || cfg.speakers[s].voiceId.startsWith('REPLACE'));
  if (missing.length) { console.error(`Put real voice IDs in voices.json for: ${missing.join(', ')}`); process.exit(1); }

  let made = 0, failed = 0;
  for (const l of todo) {
    const v = cfg.speakers[l.speaker];
    try {
      writeFileSync(join(OUT, `${l.id}.mp3`), await speak(l.text, v));
      cache[l.id] = hash(l.speaker, l.text, v);
      writeFileSync(CACHE, JSON.stringify(cache, null, 2));
      made++;
      console.log(`  made  ${l.id}`);
    } catch (e) {
      failed++;
      console.error(`  FAILED ${l.id}: ${(e as Error).message}`);
      if (failed >= 3) { console.error('\nElevenLabs failed 3 times. Stopping so no more is spent.\nYou can make these files another way and drop them in public/audio named by line ID. See the note at the top of this script.'); break; }
    }
    await sleep(250);
  }
  console.log(`\nDone. Regenerated ${made}. Failed ${failed}.`);
  process.exit(failed ? 1 : 0);
}
void main();
