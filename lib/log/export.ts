import type { SessionState } from '../engine/types';
import type { LogEvent } from './events';

/** The learner's own log, as a file on their own device. Nothing here is sent anywhere. */
export function buildLog(s: SessionState) {
  return {
    app: 'DigiTales AI prototype',
    note: 'Anonymous. Your text stays on this device. This file is your copy.',
    exportedAt: new Date().toISOString(),
    sessionId: s.sessionId,
    summary: { step: s.step, choices: s.choices, ending: s.ending, feeling: s.feeling },
    events: s.events,
  };
}

export function downloadLog(s: SessionState) {
  const blob = new Blob([JSON.stringify(buildLog(s), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `digitales-log-${(s.sessionId ?? 'session').slice(0, 8)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- Lab: rows for the human-versus-AI comparison ---------- */
export interface Rating { r1: string; r2: string; notes: string }
export interface LabRow {
  sessionId: string; promptId: string; attempt: number; answer: string; aiLevel: number;
  rule: string; flags: Record<string, unknown>; evidence: string[]; next: string; provider: string; version: string; latencyMs: number;
}

export function labRows(events: LogEvent[]): LabRow[] {
  const out: LabRow[] = [];
  for (const e of events) {
    if (e.event !== 'score_response') continue;
    const p = e.payload as { promptId: string; attempt: number; answer: string; response: { level: number; rule: string; flags: Record<string, unknown>; evidence: string[]; next: { type: string; textId?: string }; model: { provider: string; version: string }; latencyMs: number } };
    out.push({
      sessionId: e.sessionId, promptId: p.promptId, attempt: p.attempt, answer: p.answer, aiLevel: p.response.level,
      rule: p.response.rule, flags: p.response.flags, evidence: p.response.evidence,
      next: `${p.response.next.type}${p.response.next.textId ? ' ' + p.response.next.textId : ''}`,
      provider: p.response.model.provider, version: p.response.model.version, latencyMs: p.response.latencyMs,
    });
  }
  return out;
}

const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export function labCsv(rows: LabRow[], ratings: Record<string, Rating>): string {
  const head = 'sessionId,promptId,attempt,answer,aiLevel,rater1,rater2,rule,flags';
  const lines = rows.map((r) => {
    const rt = ratings[`${r.promptId}:${r.attempt}`] ?? { r1: '', r2: '', notes: '' };
    return [q(r.sessionId), q(r.promptId), r.attempt, q(r.answer), r.aiLevel, q(rt.r1), q(rt.r2), q(r.rule), q(JSON.stringify(r.flags))].join(',');
  });
  return [head, ...lines].join('\n');
}
