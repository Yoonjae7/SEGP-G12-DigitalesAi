import type { AiProvider, CallOptions, Criterion, ScoreRequest, ScoreResponse } from '../types';

/**
 * Demo provider. Written rules, no model. It reads the learner's actual words, so different answers give
 * different results. Scoring is deterministic: the same text always gives the same level and rule.
 * Only the delay is random. The AI never writes learner-facing text. It only picks a team-written textId.
 */
export const MOCK_VERSION = '1.0.0';

/* ---------- text helpers ---------- */
const norm = (t: string) => t.toLowerCase().replace(/[‘’]/g, "'");
const words = (t: string) => norm(t).match(/[a-z0-9']+/g) ?? [];

/** Cue lists. A trailing * means "any ending" (humiliat* matches humiliated). Everything else is a whole word or phrase. */
const CUES = {
  responsibility: ['posted', 'shared', 'forwarded', 'sent', 'took the photo', 'filmed', 'recorded', 'took the video', 'shared the clip', 'posted the clip', 'should have asked', 'did not ask', 'consent*', 'should delete', 'should report', 'should tell', 'should stop', 'responsib*', 'their job', 'up to', 'her fault', 'his fault'],
  consequence: ['hurt*', 'embarrass*', 'humiliat*', 'upset', 'ashamed', 'spread*', 'saved', 'screenshot*', 'bullied', 'laughed at', 'trust*', 'lonely', 'anxious', 'stays online', 'cannot be undone', 'never go away', 'reputation', 'skip class', 'avoid*'],
  reason: ['because', 'since', 'so that', 'which means', 'that means', 'therefore', 'if'],
  counterview: ['but', 'however', 'although', 'on the other hand', 'some people', 'fair point', 'even if'],
  view: ['agree', 'disagree', 'fair', 'not fair', 'excuse', 'i think', 'i do not think', 'yes', 'no', 'partly'],
  vague: ['everyone is to blame', 'all of us', 'it is all her', 'they are all bad'],
  safety: ['hurt myself', 'kill myself', 'suicide', 'self harm', 'abuse', 'being threatened', 'unsafe at home'],
  sequence: ['then', 'after', 'next', 'later', 'because of that', 'spreads'],
  partyWord: ['classmate', 'they', 'people', 'class', 'everyone', 'friend'],
} as const;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function cueRegex(cue: string): RegExp {
  const stem = cue.endsWith('*');
  const base = esc(stem ? cue.slice(0, -1) : cue).replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${base}${stem ? "[a-z']*" : ''}\\b`, 'i');
}
function find(text: string, cues: readonly string[]): { hit: boolean; at: number[] } {
  const t = norm(text);
  const at: number[] = [];
  for (const c of cues) {
    const m = cueRegex(c).exec(t);
    if (m) at.push(m.index);
  }
  return { hit: at.length > 0, at };
}

const PARTIES: Record<string, RegExp> = {
  lisa: /\blisa\b/,
  sarah: /\bsarah\b/,
  forwarders: /\b(marco|dev|forward[a-z]*|people who (shared|sent)|the others|friends|group|everyone who)\b/,
  you: /\b(i|me|my|myself|we)\b/,
  admin: /\b(admin[a-z]*|moderator[a-z]*)\b/,
};
export function partiesIn(text: string): string[] {
  const t = norm(text);
  return Object.keys(PARTIES).filter((k) => PARTIES[k].test(t));
}

/** Up to 2 short snippets (8 words at most) around the words that decided the level. */
function evidenceFor(text: string, positions: number[]): string[] {
  const out: string[] = [];
  const re = /[A-Za-z0-9'’]+/g;
  const toks: { s: number; e: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) toks.push({ s: m.index, e: m.index + m[0].length });
  for (const p of [...positions].sort((a, b) => a - b)) {
    const i = toks.findIndex((k) => p >= k.s && p < k.e);
    if (i < 0) continue;
    const from = Math.max(0, i - 2);
    const to = Math.min(toks.length, from + 8);
    const snip = text.slice(toks[from].s, toks[to - 1].e);
    if (!out.some((o) => o === snip || o.includes(snip) || snip.includes(o))) out.push(snip);
    if (out.length === 2) break;
  }
  return out;
}

function looksEmpty(text: string): boolean {
  const w = words(text);
  if (w.length < 6) return true;
  const letters = text.replace(/[^a-z]/gi, '').toLowerCase();
  if (letters.length > 8) {
    const distinct = new Set(letters).size;
    if (distinct <= 3) return true; // mostly repeated characters
    const run = /(.)\1{5,}/.exec(letters);
    if (run && run[0].length / letters.length > 0.5) return true;
  }
  return false;
}

/* ---------- scoring ---------- */
export type Level = 0 | 1 | 2 | 3;
export interface Reading {
  level: Level;
  flags: Record<string, unknown>;
  evidence: string[];
  safety: boolean;
}

export function readAnalysis(text: string): Reading {
  const parties = partiesIn(text);
  const resp = find(text, CUES.responsibility);
  const cons = find(text, CUES.consequence);
  const vague = find(text, CUES.vague).hit && parties.length < 2;
  let level: Level;
  if (looksEmpty(text)) level = 0;
  else if (parties.length >= 2 && resp.hit && cons.hit) level = 3;
  else if (parties.length >= 2 && resp.hit) level = 2;
  else level = 1;
  return {
    level,
    flags: { parties, responsibility: resp.hit, consequence: cons.hit, vague },
    evidence: level === 0 ? [] : evidenceFor(text, [...resp.at, ...cons.at]),
    safety: false,
  };
}

export function readEvaluation(text: string): Reading {
  const view = find(text, CUES.view);
  const reason = find(text, CUES.reason);
  const cons = find(text, CUES.consequence);
  const counter = find(text, CUES.counterview);
  let level: Level;
  if (looksEmpty(text)) level = 0;
  else if (reason.hit && (cons.hit || counter.hit)) level = 3;
  else if (reason.hit) level = 2;
  else level = 1;
  return {
    level,
    flags: { view: view.hit, reason: reason.hit, consequence: cons.hit, counterview: counter.hit },
    evidence: level === 0 ? [] : evidenceFor(text, [...view.at, ...reason.at, ...cons.at, ...counter.at]),
    safety: false,
  };
}

export function readInference(text: string): Reading {
  const cons = find(text, CUES.consequence);
  const party = find(text, CUES.partyWord);
  const seq = find(text, CUES.sequence);
  let level: Level = 0;
  if (words(text).length >= 3 && cons.hit) level = party.hit ? (seq.hit ? 3 : 2) : 1;
  return {
    level,
    flags: { outcome: cons.hit, party: party.hit, sequence: seq.hit },
    evidence: level === 0 ? [] : evidenceFor(text, [...cons.at, ...party.at, ...seq.at]),
    safety: false,
  };
}

export function isSafety(text: string): boolean {
  return find(text, CUES.safety).hit;
}

/** First match wins. Text IDs point to the team-written text in story.json. */
export function pickRule(criterion: Criterion, promptId: string, attempt: 1 | 2, r: Reading): { rule: string; next: ScoreResponse['next'] } {
  const P = criterion === 'analysis' ? 'A' : criterion === 'evaluation' ? 'E' : 'I';
  if (r.safety) return { rule: `${P}-SAFETY`, next: { type: 'continue' } };
  if (attempt === 2) return { rule: `${P}-ATTEMPT2`, next: { type: 'continue' } };
  if (criterion === 'analysis') {
    const parties = (r.flags.parties as string[]) ?? [];
    if (r.level === 0) return { rule: 'A-NUDGE', next: { type: 'nudge', textId: `${promptId}_nudge` } };
    if (r.level === 1) {
      if (parties.length < 2 && !r.flags.vague) return { rule: 'A-THIN-PARTIES', next: { type: 'followup', textId: `${promptId}_fu_parties` } };
      return { rule: 'A-THIN-VAGUE', next: { type: 'followup', textId: `${promptId}_fu_split` } };
    }
    if (r.level === 2) return { rule: 'A-THIN-NO-CONSEQUENCE', next: { type: 'followup', textId: `${promptId}_fu_consequence` } };
    return { rule: 'A-SOLID-HARDER', next: { type: 'harder', textId: `${promptId}_harder` } };
  }
  if (criterion === 'evaluation') {
    if (r.level === 0) return { rule: 'E-NUDGE', next: { type: 'nudge', textId: `${promptId}_nudge` } };
    if (r.level === 1) return { rule: 'E-THIN-NO-REASON', next: { type: 'followup', textId: `${promptId}_fu_reason` } };
    if (r.level === 2) return { rule: 'E-THIN-NO-CONSEQUENCE', next: { type: 'followup', textId: `${promptId}_fu_consequence` } };
    return { rule: 'E-SOLID-HARDER', next: { type: 'harder', textId: `${promptId}_harder` } };
  }
  if (r.level === 0) return { rule: 'I-NONE', next: { type: 'continue' } };
  if (r.level === 3) return { rule: 'I-SOLID', next: { type: 'harder', textId: 'ref_harder' } };
  return { rule: 'I-THIN', next: { type: 'followup', textId: 'ref_fu_next' } };
}

/** Pure and deterministic: the same request always gives the same reading. Used by the provider and by the tests. */
export function scoreText(req: ScoreRequest): Omit<ScoreResponse, 'requestId' | 'model' | 'latencyMs'> {
  const answer = req.answer ?? '';
  if (isSafety(answer)) {
    const r: Reading = { level: 0, flags: {}, evidence: [], safety: true };
    const pr = pickRule(req.criterion, req.promptId, req.attempt, r);
    return { criterion: req.criterion, level: 0, flags: {}, evidence: [], rule: pr.rule, next: pr.next, safety: true };
  }
  const r = req.criterion === 'analysis' ? readAnalysis(answer) : req.criterion === 'evaluation' ? readEvaluation(answer) : readInference(answer);
  const pr = pickRule(req.criterion, req.promptId, req.attempt, r);
  return { criterion: req.criterion, level: r.level, flags: r.flags, evidence: r.evidence, rule: pr.rule, next: pr.next, safety: false };
}

/* ---------- provider wrapper: delay, failure demo ---------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (min: number, max: number) => min + Math.random() * (max - min);
function maybeFail(opts?: CallOptions) {
  const rate = Number(process.env.MOCK_FAIL_RATE ?? 0);
  if (opts?.forceFail || (rate > 0 && Math.random() < rate)) throw new Error('mock failure');
}

export const mockProvider: AiProvider = {
  name: 'mock',
  version: MOCK_VERSION,
  async score(req, opts) {
    const t0 = Date.now();
    await sleep(jitter(900, 1800)); // feels like a real model
    maybeFail(opts);
    const body = scoreText(req);
    return { requestId: crypto.randomUUID(), ...body, model: { provider: 'mock', version: MOCK_VERSION }, latencyMs: Date.now() - t0 };
  },

};
