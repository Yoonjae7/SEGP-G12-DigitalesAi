'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { labCsv, labRows, type Rating } from '@/lib/log/export';
import { LAB_DEFAULT, readLab, writeLab, type LabSettings } from '@/lib/log/lab';
import { Wordmark } from './Brand';
import { useSession } from './SessionProvider';

const LEVELS = ['', '0', '1', '2', '3'];

/**
 * Team only. For this browser's session: the event log, every written answer with the reader's result,
 * the ending decision, a rater form, and a CSV for the AI-versus-human comparison.
 * This is the one place levels, rules and flags are shown.
 */
export function LabClient() {
  const { state, ready } = useSession();
  const [lab, setLab] = useState<LabSettings>(LAB_DEFAULT);
  useEffect(() => setLab(readLab()), []);
  const rows = useMemo(() => labRows(state.events), [state.events]);
  const update = (patch: Partial<LabSettings>) => { setLab((l) => ({ ...l, ...patch })); writeLab(patch); };
  const rate = (id: string, patch: Partial<Rating>) => {
    const cur = lab.ratings[id] ?? { r1: '', r2: '', notes: '' };
    update({ ratings: { ...lab.ratings, [id]: { ...cur, ...patch } } });
  };
  const csv = useMemo(() => labCsv(rows, lab.ratings), [rows, lab.ratings]);
  const download = () => {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'digitales-lab.csv' });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="p-lab">
      <header className="topbar"><Wordmark small /><nav aria-label="Lab"><Link href="/">Leave the lab</Link></nav></header>
      <main className="lab grid">
        <div className="top">
          <h1>Lab</h1><span className="eyebrow">Team only</span><span className="tag-demo">Demo scoring</span>
          <span className="sid">Session {ready ? state.sessionId ?? 'none yet' : '...'} &middot; this browser</span>
        </div>

        <section className="ctrl" aria-label="Switches">
          <h2>Switches</h2>
          <div className="set"><label htmlFor="prov">Provider</label><select id="prov" value="mock" onChange={() => {}}><option value="mock">mock</option></select></div>
          <div className="set"><span>Force fail</span><button className="sw" role="switch" aria-checked={lab.forceFail} aria-label="Force fail" onClick={() => update({ forceFail: !lab.forceFail })} /></div>
          <div className="set"><span>Voice</span><button className="sw" role="switch" aria-checked={lab.voice} aria-label="Voice" onClick={() => update({ voice: !lab.voice })} /></div>
          <div className="set"><span>3D</span><button className="sw" role="switch" aria-checked={lab.threeD} aria-label="3D" onClick={() => update({ threeD: !lab.threeD })} /></div>
          <p className="small soft">Applies to this browser. Reload the story page after changing.</p>
        </section>

        <section className="end-dec" aria-label="Ending decision">
          <span className="eyebrow">Ending decision</span>
          {state.ending ? (
            <>
              <p><b>Ending {state.ending}</b></p>
              <dl className="kv">
                <dt>Final levels</dt><dd>Why 1: {state.why.why1.final} &middot; Why 2: {state.why.why2.final}</dd>
                <dt>Rule used</dt><dd>{state.endingRule}. Ending A needs both at 2 or more, and at least one at 3.</dd>
                <dt>Choices</dt><dd>D1 {state.choices.d1 ?? '-'} &middot; D2 {state.choices.d2 ?? '-'} &middot; D3 {state.choices.d3 ?? '-'}. Choices never decide the ending.</dd>
                <dt>Skipped</dt><dd>Why 1: {String(state.why.why1.skipped)} &middot; Why 2: {String(state.why.why2.skipped)}</dd>
              </dl>
            </>
          ) : <p className="soft">Not decided yet. It is decided after Why 2.</p>}
        </section>

        <section className="ans" aria-label="Answers">
          {rows.length === 0 ? <p className="soft">No written answers yet in this session.</p> : null}
          {rows.map((r, i) => {
            const id = `${r.promptId}:${r.attempt}`;
            const rt = lab.ratings[id] ?? { r1: '', r2: '', notes: '' };
            return (
              <article className="acard" key={`${id}-${i}`}>
                <header><span className="id">{r.promptId} &middot; attempt {r.attempt}</span><span className="tag-demo">Level {r.aiLevel}</span></header>
                <blockquote>{r.answer}</blockquote>
                <dl className="kv">
                  <dt>Flags</dt><dd>{Object.entries(r.flags).map(([k, v]) => <span key={k}>{k}: {Array.isArray(v) ? v.join(', ') || 'none' : String(v)}<br /></span>)}</dd>
                  <dt>Rule</dt><dd><code>{r.rule}</code></dd>
                  <dt>Next</dt><dd>{r.next}</dd>
                  <dt>Evidence</dt><dd>{r.evidence.length ? r.evidence.map((e) => <span key={e}>&ldquo;{e}&rdquo;<br /></span>) : 'none'}</dd>
                  <dt>Provider</dt><dd>{r.provider} {r.version} &middot; {r.latencyMs} ms</dd>
                </dl>
                <form className="rater" onSubmit={(e) => e.preventDefault()}>
                  <label>Rater 1<select value={rt.r1} onChange={(e) => rate(id, { r1: e.target.value })}>{LEVELS.map((l) => <option key={l} value={l}>{l || '-'}</option>)}</select></label>
                  <label>Rater 2<select value={rt.r2} onChange={(e) => rate(id, { r2: e.target.value })}>{LEVELS.map((l) => <option key={l} value={l}>{l || '-'}</option>)}</select></label>
                  <label className="notes">Notes<input type="text" value={rt.notes} onChange={(e) => rate(id, { notes: e.target.value })} /></label>
                </form>
              </article>
            );
          })}
        </section>

        <section className="logwrap" aria-label="Event log">
          <h2>Event log</h2>
          <table>
            <thead><tr><th>Time</th><th>Event</th><th>Payload</th></tr></thead>
            <tbody>
              {state.events.map((e, i) => {
                const { answer, response, ...rest } = e.payload as Record<string, unknown>;
                void answer; void response;
                return (
                  <tr key={i}>
                    <td className="n">{new Date(e.ts).toLocaleTimeString()}</td>
                    <td>{e.event}</td>
                    <td>{Object.keys(rest).length ? JSON.stringify(rest) : ''}{e.event === 'score_response' ? ' (see answers)' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="csv" aria-label="Export">
          <button className="btn" onClick={download} disabled={rows.length === 0}>Export CSV</button>
          <span className="soft small">Columns: sessionId, promptId, attempt, answer, aiLevel, rater1, rater2, rule, flags</span>
        </section>
        <pre className="csvprev">{csv}</pre>
      </main>
    </div>
  );
}
