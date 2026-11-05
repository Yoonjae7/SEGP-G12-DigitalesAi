import type { Decision, Line, Scene, Story } from '../story/types';
import type { Choices } from './types';

/**
 * The story as one list. It is a pure function of the learner's choices, so a refresh always rebuilds the same list.
 *
 *   S0 (the bus) > S1 > S2 > [D1 + beat] > S3 > [WHY1] > S4 > [D2 + beat] > S5 > S6 > [D3 + beat] > [WHY2] > S7 > ending
 *
 * Paths merge after every decision. Lines with `when` show only if the earlier choice matches.
 */
export interface LineItem { type: 'line'; line: Line; sceneId: string; n: number; art: string; beat?: string }
export interface DecisionItem { type: 'decision'; id: 'd1' | 'd2' | 'd3'; sceneId: string; n: number; art: string }
export interface WhyItem { type: 'why'; id: 'why1' | 'why2'; sceneId: string; n: number; art: string }
export interface TitleItem { type: 'ending-title'; ending: 'A' | 'B'; sceneId: string; n: number; art: string }
export type TItem = LineItem | DecisionItem | WhyItem | TitleItem;

export function lineApplies(line: Line, choices: Choices): boolean {
  if (!line.when) return true;
  return (Object.entries(line.when) as [keyof Choices, string][]).every(([k, v]) => choices[k] === v);
}

export function buildTimeline(story: Story, choices: Choices, ending: 'A' | 'B' | null): TItem[] {
  const out: TItem[] = [];
  const byId: Record<string, Scene> = Object.fromEntries(story.scenes.map((s) => [s.id, s]));
  const line = (l: Line, s: Scene, beat?: string): LineItem => ({ type: 'line', line: l, sceneId: s.id, n: s.n, art: s.art, beat });

  const scene = (id: string) => {
    const s = byId[id];
    for (const l of s.lines) if (lineApplies(l, choices)) out.push(line(l, s));
  };
  /** Pushes the decision and, if it was made, its beat. Returns false while the choice is still open. */
  const decision = (d: Decision): boolean => {
    const s = byId[d.scene];
    out.push({ type: 'decision', id: d.id, sceneId: s.id, n: s.n, art: s.art });
    const picked = choices[d.id];
    if (!picked) return false;
    const opt = d.options.find((o) => o.id === `${d.id}_${picked}`);
    if (!opt) return false;
    for (const l of opt.beat) out.push(line(l, s, opt.id));
    return true;
  };
  const why = (id: 'why1' | 'why2') => {
    const w = story.whys[id];
    const s = byId[w.scene];
    out.push({ type: 'why', id, sceneId: s.id, n: s.n, art: s.art });
  };

  scene('s0');
  scene('s1');
  scene('s2');
  if (!decision(story.decisions.d1)) return out;
  scene('s3');
  why('why1');
  scene('s4');
  if (!decision(story.decisions.d2)) return out;
  scene('s5');
  scene('s6');
  if (!decision(story.decisions.d3)) return out;
  why('why2');
  scene('s7');
  if (ending) {
    const e = story.endings[ending];
    out.push({ type: 'ending-title', ending, sceneId: `ending-${ending}`, n: 7, art: e.art });
    for (const l of e.lines) out.push({ type: 'line', line: l, sceneId: `ending-${ending}`, n: 7, art: e.art });
  }
  return out;
}

/** "Back one line" works inside a scene. It never crosses a choice, a written answer or a scene change. */
export function canGoBack(items: TItem[], pos: number): boolean {
  const cur = items[pos];
  const prev = items[pos - 1];
  return !!cur && !!prev && cur.type === 'line' && prev.type === 'line' && cur.sceneId === prev.sceneId;
}

/** The kind of chat panel that should be showing, and the lines in it, at this position. */
export interface ChatView {
  title: string;
  people: number;
  items: { line: Line; mine: boolean }[];
}
export function chatAt(story: Story, items: TItem[], pos: number): ChatView | null {
  const cur = items[pos];
  if (!cur || cur.type !== 'line') return null;
  const scene = story.scenes.find((s) => s.id === cur.sceneId);
  if (!scene?.chat) return null;
  const isChatLine = (l: Line) => l.kind === 'chat' || (l.speaker === 'you' && l.kind === 'screen') || !!l.showPhotoTile;
  const group = (it: TItem) => (it.type === 'line' && it.sceneId === cur.sceneId ? (it.beat ?? 'main') : null);
  const key = group(cur);
  const seen: ChatView['items'] = [];
  for (let i = 0; i <= pos; i++) {
    const it = items[i];
    if (it.type === 'line' && group(it) === key && isChatLine(it.line)) seen.push({ line: it.line, mine: it.line.speaker === 'you' });
  }
  // Only show the panel once a chat line has appeared in this part of the scene.
  if (seen.length === 0) return null;
  const privateWithLisa = cur.beat === 'd1_private';
  return { title: privateWithLisa ? 'Lisa' : scene.chat, people: privateWithLisa ? 2 : 12, items: seen };
}
