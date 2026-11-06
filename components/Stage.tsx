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
import { audioSrc, promptLine, VOICE_ENABLED } from '@/lib/voice/manifest';
import { AnswerEditor } from './AnswerEditor';
import { Icon, PhotoTile } from './Marks';
import { SceneArt } from './SceneArt';
import { useSession } from './SessionProvider';
import type { ChatShot } from '@/scenes3d/chat';
import { Visuals, type Acts } from './Visuals';

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
  // What the people on stage are doing: each line can change it, and it stays until a later line changes it again.
  const acts = useMemo(() => {
    const out: Acts = {};
    if (!item) return out;
    for (let i = 0; i <= state.pos; i++) {
      const it = items[i];
      if (it?.type === 'line' && it.sceneId === item.sceneId && it.line.act) {
        for (const [who, v] of Object.entries(it.line.act)) out[who as keyof Acts] = { ...out[who as keyof Acts], ...v };
      }
    }
    return out;
  }, [items, state.pos, item]);
  // The chat on the phone in the 3D scene: the messages so far (the photo, then the words).
  const chat = useMemo<ChatShot | null>(() => {
    const v = item?.type === 'ending-title' ? null : chatAt(story, items, state.pos);
    if (!v) return null;
    return {
      title: v.title, people: v.people,
      items: v.items.flatMap((c) => {
        const who = NAMES[c.line.speaker];
        const out: ChatShot['items'] = [];
        if (c.line.showPhotoTile) out.push({ who: c.line.speaker === 'screen' ? 'Photo' : who, text: '', photo: true });
        if (c.line.speaker !== 'screen') out.push({ who, text: c.line.text, mine: c.mine });
        return out;
      }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, state.pos]);
  const [settled, setSettled] = useState<{ id: string; ok: boolean } | null>(null);
  const onSettle = useCallback((id: string, ok: boolean) => setSettled({ id, ok }), []);
  // The question on a choice or a written answer is read aloud by the narrator when it appears.
  const voiceLine = line ?? (item?.type === 'decision' ? promptLine('decision', item.id) : item?.type === 'why' ? promptLine('why', item.id) : null);
  const { replay, speaking } = useVoice(voiceLine, soundOn, ahead, onSettle);

  // Who is speaking. With sound, the character's mouth moves while the voice plays. With sound off, it moves for about as
  // long as the line takes to read, so the story still shows who is talking.
  const [quiet, setQuiet] = useState(false);
  useEffect(() => {
    if (soundOn || !line || line.speaker === 'narrator') { setQuiet(false); return; }
    setQuiet(true);
    const t = setTimeout(() => setQuiet(false), Math.min(4200, 800 + line.text.length * 55));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn, line?.id]);
  const talking = soundOn ? speaking : quiet;

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

  // Auto-play is on by default. With sound, a line moves on a moment after its voice ends. With no voice, or when the
  // browser blocks it, the line stays long enough to read. A decision or a written answer always waits for the learner.
  const auto = state.settings.auto;
  useEffect(() => {
    if (!auto || !canAdvance || !item) return;
    const words = line ? line.text.split(/\s+/).length : 3;
    const newScene = state.pos === 0 || items[state.pos - 1]?.sceneId !== item.sceneId;
    const reading = Math.max(2600, words * 420 + 900) + (newScene && line ? 1800 : 0);
    const voiced = !!line && soundOn && !!audioSrc(line);
    const here = settled && line && settled.id === line.id ? settled : null;
    let delay = reading;
    if (item.type === 'ending-title') delay = 4500;
    else if (voiced && !here) delay = 30_000; // the voice has not reported back yet: a safety net only
    else if (voiced && here?.ok) delay = 900; // a short breath after the voice
    const id = setTimeout(advance, delay);
    return () => clearTimeout(id);
  }, [auto, canAdvance, state.pos, line, item, items, soundOn, settled, advance]);

  if (!item) return null;
  const scene = story.scenes.find((s) => s.id === item.sceneId);
  const ending = item.sceneId.startsWith('ending-') ? story.endings[item.sceneId.slice(-1) as 'A' | 'B'] : null;
  const art = item.art === 's7' ? (state.ending === 'A' ? 's7a' : 's7b') : item.art;
  const sceneTitle = scene?.title ?? ending?.title ?? '';
  const description = scene?.id === 's7' ? story.endings[state.ending ?? 'B'].description : scene?.description ?? ending?.description ?? '';
  const first = state.pos === 0 || items[state.pos - 1]?.sceneId !== item.sceneId;
  const split = item.type === 'why';
  const dim = item.type === 'decision' || overlay;
  const nextRaw = items.slice(state.pos + 1).find((i) => i.art !== item.art)?.art;
  const nextArt = nextRaw && nextRaw !== 's7' ? nextRaw : null;
  const override = line ? { speaker: line.speaker, pose: line.pose, expression: line.expression, talking } : null;
  const tags = (line?.intro ?? []).map((id) => ({ id, name: story.cast[id].name, about: story.cast[id].about }));
  const when = scene?.time ?? ending?.time ?? '';

  const onStageClick = (e: React.MouseEvent) => {
    if (!canAdvance) return;
    if ((e.target as HTMLElement).closest('button, a, aside, textarea, input, .plate .ctl')) return;
    advance();
  };

  return (
    <div className="on-night">
      <div className="viewport">
        <main className={`stage${split ? ' split' : ''}`} aria-label="Story" onClick={onStageClick}>
          <Visuals art={art} nextArt={nextArt} override={override} lineId={line?.id ?? null} acts={acts} chat={chat} photo={!!line?.showPhotoTile} tags={tags} deciding={item.type === 'decision'} />
          {dim ? <div className="dim" /> : null}
          {when ? <p className="when" key={when}>{when}</p> : null}
          <p className="sr" role="status" aria-live="polite">{item.n > 0 ? `${fill(P.scene, { n: item.n })}. ` : ''}{sceneTitle}. {when}.</p>
          <Controls voiceOn={voiceOn} soundOn={soundOn}
            onSound={() => dispatch({ t: 'settings', patch: { sound: !state.settings.sound } })}
            onSettings={() => setDrawer(true)} onExit={() => setExitOpen(true)} />

          {line ? (
            <>
              <Plate line={line} first={first} description={description} back={canGoBack(items, state.pos)} voiceOn={voiceOn} soundOn={soundOn}
                onBack={() => dispatch({ t: 'back' })} onReplay={replay} onSound={() => dispatch({ t: 'settings', patch: { sound: true } })} onNext={advance}
                auto={auto} onAuto={() => dispatch({ t: 'settings', patch: { auto: !auto } })} />
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

/* ---------- controls: a few small round buttons in the corner ---------- */
function Controls({ voiceOn, soundOn, onSound, onSettings, onExit }: { voiceOn: boolean; soundOn: boolean; onSound: () => void; onSettings: () => void; onExit: () => void }) {
  return (
    <nav className="mini" aria-label="Story controls">
      {voiceOn ? (
        <button className="ibtn" aria-pressed={soundOn} aria-label={soundOn ? `${P.soundOn}. Turn sound off` : `${P.soundOff}. Turn sound on`} title={soundOn ? P.soundOn : P.soundOff} onClick={onSound}>
          <Icon id={soundOn ? 'ic-sound' : 'ic-sound-off'} size={22} />
        </button>
      ) : null}
      <button className="ibtn" aria-label={P.settings} title={P.settings} onClick={onSettings}><Icon id="ic-settings" size={22} /></button>
      <Link className="ibtn" href="/support" aria-label={copy.nav.support} title={copy.nav.support}><Icon id="ic-support" size={22} /></Link>
      <button className="ibtn" aria-label={P.exit} title={P.exit} onClick={onExit}><Icon id="ic-exit" size={22} /></button>
    </nav>
  );
}

/* ---------- subtitle: the line, and a name only when a person speaks ---------- */
function Plate({ line, first, description, back, voiceOn, soundOn, auto, onBack, onReplay, onSound, onNext, onAuto }: {
  line: Line; first: boolean; description: string; back: boolean; voiceOn: boolean; soundOn: boolean; auto: boolean;
  onBack: () => void; onReplay: () => void; onSound: () => void; onNext: () => void; onAuto: () => void;
}) {
  const named = line.speaker !== 'narrator' && line.speaker !== 'screen';
  return (
    <div className="plate" role="region" aria-label={P.caption} aria-live="polite" key={line.id}>
      {first && description ? <p className="sr">{description}</p> : null}
      {named ? (
        <p className="who-line">
          <span className={`who ${line.speaker}`}>{NAMES[line.speaker]}</span>
          {line.kind === 'chat' ? <span className="in">{P.inTheChat}</span> : null}
        </p>
      ) : null}
      <p className={`line${line.kind === 'narration' ? ' narr' : ''}`}><span className="sr">{NAMES[line.speaker]}: </span>{line.text}</p>
      <div className="ctl">
        <button className="ibtn" aria-label={P.back} title={P.back} disabled={!back} onClick={onBack}><Icon id="ic-back" size={20} /></button>
        {voiceOn && !soundOn ? <button className="ibtn" aria-label={P.playSound} title={P.playSound} onClick={onSound}><Icon id="ic-sound" size={20} /></button> : null}
        {voiceOn && soundOn && line.voiced ? <button className="ibtn" aria-label={P.replay} title={P.replay} onClick={onReplay}><Icon id="ic-replay" size={20} /></button> : null}
        <button className="ibtn" aria-label={auto ? P.pause : P.autoPlay} title={auto ? P.pause : P.autoPlay} onClick={onAuto}><Icon id={auto ? 'ic-pause' : 'ic-play'} size={20} /></button>
        <button className="ibtn" aria-label={P.next} title={P.next} onClick={onNext}><Icon id="ic-next" size={20} /></button>
      </div>
    </div>
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
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // The chosen panel lights up and the other fades for a moment, then the story goes on.
  const pick = useCallback((optId: string) => {
    if (picked) return;
    setPicked(optId);
    timer.current = setTimeout(() => dispatch({ t: 'choose', id, value: optId.split('_')[1], ts: Date.now() }), 380);
  }, [picked, dispatch, id]);
  // Number keys choose, like a game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest('input, textarea, select')) return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < d.options.length) { e.preventDefault(); pick(d.options[i].id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d, pick]);
  return (
    <div className="decide">
      <span className="step">{fill(P.decision, { n: id.slice(1) })}</span>
      <h2>{d.prompt}</h2>
      <span className="rule" aria-hidden="true" />
      <div className={`cards${picked ? ' picking' : ''}`} role="group" aria-label={fill(P.decision, { n: id.slice(1) })}>
        {d.options.map((o, i) => (
          <button key={o.id} className={`co${picked === o.id ? ' picked' : ''}`} data-n={i + 1} disabled={!!picked && picked !== o.id} onClick={() => pick(o.id)}>
            <span className="lab">{o.label}</span>
            <span className="sub">{o.sub}</span>
          </button>
        ))}
      </div>
      <p className="keys">{P.decisionHint}</p>
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

