import ui from '@/content/ui-copy.json';

/** All learner-facing interface words live in content/ui-copy.json, so the team can edit them without touching code. */
export const copy = ui;

/** Fill {n}-style slots: fill("Scene {n} of 7", { n: 3 }) */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
