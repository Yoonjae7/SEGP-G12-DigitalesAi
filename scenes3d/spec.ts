import { Rig } from '@/lib/art/rig';

/** The shared figure data from the 2D rig (colours, proportions, the joint table, the faces), with types. One source for 2D and 3D. */
export interface Spec {
  name: string; ht: number; wf: number; hf: number; fy: number; skin: string; hair: string; top: string; bottom: string; shoe: string; style: string;
  glasses?: boolean; scarf?: string; pack?: string; coat?: boolean; socks?: boolean; beanie?: string; hoodie?: boolean; phones?: string;
}
export interface PoseData { L: [number, number]; R: [number, number]; lean: number; tilt: number; pitch: number; rise: number; drop: number; stance: number; yaw: number; prop?: string }
export interface ExprData { t: number; lift: [number, number]; eye: string; m: string; blush?: number }

export const SPEC = Rig.CHARS as unknown as Record<string, Spec>;
export const POSES = Rig.POSES as unknown as Record<string, PoseData>;
export const EXPR = Rig.EXPR as unknown as Record<string, ExprData>;
export const mouthPath = Rig.mouthPath as unknown as (kind: string, w: number) => string[];