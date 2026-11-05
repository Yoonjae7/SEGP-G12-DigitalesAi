import type { Rating } from './export';

/** Team-only switches and human ratings. Kept in this browser. Never sent anywhere. */
export const LAB_KEY = 'dt_lab_v1';
export interface LabSettings { forceFail: boolean; voice: boolean; threeD: boolean; ratings: Record<string, Rating> }
export const LAB_DEFAULT: LabSettings = { forceFail: false, voice: true, threeD: true, ratings: {} };

export function readLab(): LabSettings {
  try {
    const raw = localStorage.getItem(LAB_KEY);
    return raw ? { ...LAB_DEFAULT, ...JSON.parse(raw) } : { ...LAB_DEFAULT };
  } catch {
    return { ...LAB_DEFAULT };
  }
}
export function writeLab(patch: Partial<LabSettings>) {
  try {
    localStorage.setItem(LAB_KEY, JSON.stringify({ ...readLab(), ...patch }));
  } catch {
    /* storage can be blocked. The Lab still works for this visit. */
  }
}
