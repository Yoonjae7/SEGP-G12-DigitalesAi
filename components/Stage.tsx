'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { copy, fill } from '@/lib/copy';
import { canGoBack, chatAt, type TItem } from '@/lib/engine/flow';
import { timeline } from '@/lib/engine/state';
import { story } from '@/lib/story';
import type { Line, Speaker } from '@/lib/story/types';
import { useDeckle } from '@/lib/useDeckle';
import { useLabFlags } from '@/lib/useLabFlags';
import { useVoice } from '@/lib/useVoice';
import { VOICE_ENABLED } from '@/lib/voice/manifest';
import { AnswerEditor } from './AnswerEditor';
import { Icon, PhotoTile } from './Marks';
import { SceneArt } from './SceneArt';
import { useSession } from './SessionProvider';
import { Visuals } from './Visuals';

const NAMES: Record<Speaker, string> = { narrator: 'Narrator', lisa: 'Lisa', sarah: 'Sarah', marco: 'Marco', dev: 'Dev', you: 'You', screen: 'On screen' };
const P = copy.player;

/** The stage: scene, caption plate, chat panel, decisions and the written answers. Everything plays with text alone. */
export function Stage() {
  const { state, dispatch } = useSession();
  const lab = useLabFlags();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const items = useMemo(() => timeline(state), [state.choices, state.ending]); // eslint-disable-line react-hooks/exhaustive-deps
  const item: TItem | undefined = items[state.pos];
  const line: Line | null = item?.type === 'line' ? item.line : null;
  const voiceOn = VOICE_ENABLED && lab.voice;
  const soundOn = voiceOn && state.settings.sound;
  const overlay = drawer || exitOpen;

  const ahead = useMemo(() => {
    if (!item) return [];
    const nextScene = items.slice(state.pos + 1).find((i) => i.sceneId !== item.sceneId)?.sceneId;
    return items.filter((i): i is Extract<TItem, { type: 'line' }> => i.type === 'line' && i.sceneId === nextScene).map((i) => i.line);
  }, [items, state.pos, item]);
  const { replay } = useVoice(line, soundOn, ahead);

  const advance = useCallback(() => dispatch({ t: 'advance', ts: Date.now() }), [dispatch]);
  const canAdvance = !!item && (item.type === 'line' || item.type === 'ending-title') && !overlay;

  // Space or Enter go on, unless the learner is in a control, a box, or a dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== ' ' && e.key !== 'Enter') || !canAdvance) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest('button, a, input, textarea, select, [role="switch"], [role="radio"]')) return;
      e.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canAdvance, advance]);

  // Auto-advance is off by default. A line stays long enough to read.
  useEffect(() => {
    if (!state.settings.auto || !canAdvance) return;
    const words = line ? line.text.split(/\s+/).length : 3;
    const id = setTimeout(advance, Math.max(2600, words * 420 + 900));
    return () => clearTimeout(id);
  }, [state.settings.auto, canAdvance, state.pos, line, advance]);

  if (!item) return null;
  const scene = story.scenes.find((s) => s.id === item.sceneId);
  const ending = item.sceneId.startsWith('ending-') ? story.endings[item.sceneId.slice(-1) as 'A' | 'B'] : null;
  const art = item.art === 's7' ? (state.ending === 'A' ? 's7a' : 's7b') : item.art;
  const sceneTitle = scene?.title ?? ending?.title ?? '';
  const description = scene?.id === 's7' ? story.endings[state.ending ?? 'B'].description : scene?.description ?? ending?.description ?? '';
  const first = state.pos === 0 || items[state.pos - 1]?.sceneId !== item.sceneId;
  const split = item.type === 'why';
  const dim = item.type === 'decision' || overlay;
  const chat = line ? chatAt(story, items, state.pos) : null;
  const nextRaw = items.slice(state.pos + 1).find((i) => i.art !== item.art)?.art;
  const nextArt = nextRaw && nextRaw !== 's7' ? nextRaw : null;
  const override = line && (line.pose || line.expression) ? { speaker: line.speaker, pose: line.pose, expression: line.expression } : null;

  const onStageClick = (e: React.MouseEvent) => {
    if (!canAdvance) return;
    if ((e.target as HTMLElement).closest('button, a, aside, textarea, input, .plate .ctl')) return;
    advance();
  };

  return (
    <div className="on-night">
      <div className="viewport">
        <main className={`stage${split ? ' split' : ''}`} aria-label="Story" onClick={onStageClick}>
          <Visuals art={art} nextArt={nextArt} override={override} />
          {dim ? <div className="dim" /> : null}
          <p className="sr" role="status" aria-live="polite">{fill(P.scene, { n: item.n })}. {sceneTitle}.</p>
          <Hud n={item.n} voiceOn={voiceOn} soundOn={soundOn}
            onSound={() => dispatch({ t: 'settings', patch: { sound: !state.settings.sound } })}
            onSettings={() => setDrawer(true)} onExit={() => setExitOpen(true)} />

          {line ? (
            <>
              {chat ? <ChatPanel chat={chat} /> : line.showPhotoTile ? <aside className="chat tile-only" aria-label={P.photo}><div className="ch-body"><div className="b"><PhotoTile /></div></div></aside> : null}
              <Plate line={line} first={first} description={description} back={canGoBack(items, state.pos)} voiceOn={voiceOn} soundOn={soundOn}
                onBack={() => dispatch({ t: 'back' })} onReplay={replay} onSound={() => dispatch({ t: 'settings', patch: { sound: true } })} onNext={advance} />
            </>
          ) : null}
          {item.type === 'ending-title' ? <TitleCard ending={item.ending} /> : null}
          {item.type === 'decision' ? <Decision id={item.id} /> : null}
          {item.type === 'why' ? <WhyPanel id={item.id} /> : null}

          {drawer ? <Drawer onClose={() => setDrawer(false)} voiceOn={voiceOn} /> : null}
          {exitOpen ? (
            <Dialog label={P.exitModal.title} onClose={() => setExitOpen(false)}>
              <div className="m">
                <h2>{P.exitModal.title}</h2>
                <p>{P.exitModal.text}</p>
                <div className="row">
                  <button className="btn" onClick={() => setExitOpen(false)}>{P.exitModal.keep}</button>
                  <button className="btn paper" onClick={() => { dispatch({ t: 'log', event: 'exit', payload: { step: state.step, pos: state.pos }, ts: Date.now() }); router.push('/'); }}>{P.exitModal.leave}</button>
                </div>
              </div>
            </Dialog>
          ) : null}
        </main>
      </div>
    </div>
  );
}

/* ---------- top bar tabs ---------- */
function Hud({ n, voiceOn, soundOn, onSound, onSettings, onExit }: { n: number; voiceOn: boolean; soundOn: boolean; onSound: () => void; onSettings: () => void; onExit: () => void }) {
  return (
    <header className="hud">
      <div className="tab left">
        <button className="wordmark sm wm-btn" onClick={onExit} aria-label="DigiTales AI. Opens the leave-the-story check">
          Dig<span className="wm-i" aria-hidden="true">{'\u0131'}</span>Tales<span className="wm-ai" aria-hidden="true">AI</span>
        </button>
        <button className="imark wm-btn" onClick={onExit} aria-label="DigiTales AI. Opens the leave-the-story check">i</button>
      </div>
      <div className="tab scene">{fill(P.scene, { n })}</div>
      <div className="tab right">
        {voiceOn ? (
          <button className="hbtn" aria-pressed={soundOn} aria-label={soundOn ? `${P.soundOn}. Turn sound off` : `${P.soundOff}. Turn sound on`} onClick={onSound}>
            <Icon id={soundOn ? 'ic-sound' : 'ic-sound-off'} /><span>{soundOn ? P.soundOn : P.soundOff}</span>
          </button>
        ) : null}
        <button className="hbtn" aria-label={P.settings} onClick={onSettings}><Icon id="ic-settings" /><span>{P.settings}</span></button>
        <Link className="hbtn" href="/support" aria-label={copy.nav.support}><Icon id="ic-support" /><span>{copy.nav.support}</span></Link>
        <button className="hbtn" aria-label={P.exit} onClick={onExit}><Icon id="ic-exit" /><span>{P.exit}</span></button>
      </div>
    </header>
  );
}

/* ---------- caption plate ---------- */
function Plate({ line, first, description, back, voiceOn, soundOn, onBack, onReplay, onSound, onNext }: {
  line: Line; first: boolean; description: string; back: boolean; voiceOn: boolean; soundOn: boolean;
  onBack: () => void; onReplay: () => void; onSound: () => void; onNext: () => void;
}) {
  const chip = line.speaker === 'narrator' ? 'narrator' : line.speaker;
  return (
    <div className="plate" role="region" aria-label={P.caption} aria-live="polite" key={line.id}>
      <span className={`who ${chip}`}>{NAMES[line.speaker]}</span>
      {line.kind === 'chat' ? <span className="in">{P.inTheChat}</span> : null}
      {first && description ? <p className="scene-note">{description}</p> : null}
      <p className={`line${line.kind === 'narration' ? ' narr' : ''}`}><span className="sr">{NAMES[line.speaker]}: </span>{line.text}</p>
      <div className="ctl">
        <button className="hbtn" disabled={!back} onClick={onBack}><Icon id="ic-back" size={20} />{P.back}</button>
        {voiceOn && !soundOn ? <button className="hbtn" onClick={onSound}><Icon id="ic-sound" size={20} />{P.playSound}</button> : null}
        {voiceOn && soundOn && line.voiced ? <button className="hbtn" onClick={onReplay}><Icon id="ic-replay" size={20} />{P.replay}</button> : null}
        <span className="hint">{P.hint}</span>
        <button className="hbtn next" onClick={onNext}>{P.next}</button>
      </div>
    </div>
  );
}

/* ---------- chat panel ---------- */
function ChatPanel({ chat }: { chat: NonNullable<ReturnType<typeof chatAt>> }) {
  return (
    <aside className="chat" aria-label={`Chat: ${chat.title}`}>
      <div className="ch-head"><b>{chat.title}</b><span>{fill(P.people, { n: chat.people })}</span></div>
      <div className="ch-body">
        {chat.items.map((c, i) => (
          <div className={`b${i === chat.items.length - 1 ? ' new' : ''}${c.mine ? ' mine' : ''}`} key={c.line.id}>
            <span className="nm">{NAMES[c.line.speaker]}{i === chat.items.length - 1 && !c.mine ? <i className="dot" aria-hidden="true" /> : null}</span>
            {c.line.showPhotoTile ? <PhotoTile /> : null}
            {c.line.speaker === 'screen' ? null : c.line.text}
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ---------- ending title card (torn edge, hero element 2 of 3) ---------- */
function TitleCard({ ending }: { ending: 'A' | 'B' }) {
  const ref = useRef<HTMLDivElement>(null);
  useDeckle(ref, { amp: 8, step: 16, seed: 21 });
  return (
    <div className="titlecard-wrap">
      <div className="titlecard" ref={ref}>
        <span className="eyebrow">{copy.feedback.ending}</span>
        <h1>{story.endings[ending].title}</h1>
        <p>{copy.feedback.clickOn}</p>
      </div>
    </div>
  );
}

/* ---------- decision: two cards, same size, same colour, no default focus, no confirm ---------- */
function Decision({ id }: { id: 'd1' | 'd2' | 'd3' }) {
  const { dispatch } = useSession();
  const d = story.decisions[id];
  return (
    <div className="decide">
      <h2>{d.prompt}</h2>
      <div className="cards" role="group" aria-label={fill(P.decision, { n: id.slice(1) })}>
        {d.options.map((o) => (
          <button key={o.id} className="co" onClick={() => dispatch({ t: 'choose', id, value: o.id.split('_')[1], ts: Date.now() })}>
            <span className="lab">{o.label}</span>
            <span className="sub">{o.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- the written answer (notebook with a torn left edge, hero element 3 of 3) ---------- */
function WhyPanel({ id }: { id: 'why1' | 'why2' }) {
  const ref = useRef<HTMLElement>(null);
  useDeckle(ref, { edges: 'l', amp: 9, step: 17, seed: 5 });
  const w = story.whys[id];
  return (
    <div className="nb-wrap">
      <section className="nb" ref={ref} aria-label={fill(copy.player.why.label, { n: id.slice(3) })}>
        <div className="holes" aria-hidden="true"><i /><i /><i /></div>
        <span className="eyebrow">{fill(copy.player.why.label, { n: id.slice(3) })}</span>
        <p className="q">{w.question}</p>
        <AnswerEditor k={id} helper={w.helper} />
      </section>
    </div>
  );
}

/* ---------- settings drawer and dialogs ---------- */
function Drawer({ onClose, voiceOn }: { onClose: () => void; voiceOn: boolean }) {
  const { state, dispatch } = useSession();
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => dispatch({ t: 'settings', patch });
  const S = P.settingsPanel;

  return (
    <Dialog label={S.title} onClose={onClose} drawer>
      <aside className="drawer">
        <h2>{S.title}</h2>
        {voiceOn ? <Row title={S.sound} help={S.soundHelp}><Sw on={s.sound} label={S.sound} onClick={() => set({ sound: !s.sound })} /></Row> : null}
        <Row title={S.simple} help={S.simpleHelp}><Sw on={s.simple} label={S.simple} onClick={() => set({ simple: !s.simple })} /></Row>
        <Row title={S.size} help={S.sizeHelp}>
          <div className="sz" role="group" aria-label={S.size}>
            <button aria-label="Smaller text" disabled={s.text <= -1} onClick={() => set({ text: Math.max(-1, s.text - 1) })}>A-</button>
            <button aria-label="Larger text" disabled={s.text >= 3} onClick={() => set({ text: Math.min(3, s.text + 1) })}>A+</button>
          </div>
        </Row>
        <Row title={S.auto} help={S.autoHelp}><Sw on={s.auto} label={S.auto} onClick={() => set({ auto: !s.auto })} /></Row>
        <p style={{ marginTop: 28 }}><button className="btn quiet" onClick={onClose}>{S.close}</button></p>
      </aside>
    </Dialog>
  );
}

function Row({ title, help, children }: { title: string; help: string; children: React.ReactNode }) {
  return <div className="set"><div><b>{title}</b><small>{help}</small></div>{children}</div>;
}
function Sw({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return <button className="sw" role="switch" aria-checked={on} aria-label={label} onClick={onClick} />;
}

/** A dialog: focus goes in, Tab stays in, Escape closes, focus goes back to where it was. */
function Dialog({ label, onClose, drawer, children }: { label: string; onClose: () => void; drawer?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, a, [tabindex]')?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('keydown', esc); prev?.focus?.(); };
  }, []);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab' || !ref.current) return;
    const f = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, textarea, [tabindex]:not([tabindex="-1"])')];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  return (
    <div ref={ref} className={drawer ? undefined : 'modal'} role="dialog" aria-modal="true" aria-label={label} onKeyDown={onKey} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

