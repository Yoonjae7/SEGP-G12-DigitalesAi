import type { CharId } from './types';

export type V3 = [number, number, number];

/** One camera set-up. It holds for the lines listed, and the camera glides to it from wherever it was. */
export interface Shot { lines?: string[]; pos: V3; look: V3; fov: number; drift?: V3 }

/** Where a person stands or sits in a set, and which way they face (radians about the up axis; 0 faces +z). */
export interface Place { pos: V3; rotY: number }

export const FRONT = Math.PI; // facing -z, toward the front of the bus

/**
 * The staging for each set. People, poses and expressions come from content/story.json (a line can also change what someone is
 * doing with `act`). This file only says where things are and where the camera looks.
 */
export const PLACE: Record<string, Partial<Record<CharId, Place>>> = {
  s0: {
    sarah: { pos: [-1.2, 0, 0.1], rotY: FRONT },
    lisa: { pos: [0.6, 0, 0.1], rotY: FRONT + 0.9 },
    you: { pos: [-0.6, 0, 1.1], rotY: FRONT },
    marco: { pos: [0.6, 0, 1.1], rotY: FRONT - 0.2 },
    dev: { pos: [1.2, 0, 1.1], rotY: FRONT - 0.35 },
  },
};

// In the bus, +x is on the left of the picture when the camera looks back (+z) from the front.
export const SHOTS: Record<string, Shot[]> = {
  s0: [
    { lines: ['s0_01'], pos: [0.2, 1.5, -3.3], look: [-0.2, 1.0, 0.6], fov: 42, drift: [0, 0, 0.1] },
    { lines: ['s0_02'], pos: [0.15, 1.2, -1.5], look: [-1.1, 1.08, 0.1], fov: 30, drift: [-0.02, 0, 0.03] },
    { lines: ['s0_03'], pos: [-0.5, 1.25, -1.7], look: [0.6, 1.0, 0.1], fov: 33, drift: [0.02, 0, 0.03] },
    { lines: ['s0_04'], pos: [-0.15, 1.38, -1.7], look: [-0.4, 1.05, 0.1], fov: 38, drift: [0, 0, 0.03] },
    { lines: ['s0_05'], pos: [-0.3, 1.58, -0.7], look: [-0.62, 1.08, 1.1], fov: 26, drift: [0, 0, 0.02] },
    { pos: [0.2, 1.5, -3.3], look: [-0.2, 1.0, 0.6], fov: 42 },
  ],
};

export function shotFor(art: string, lineId: string | null): Shot | null {
  const shots = SHOTS[art];
  if (!shots) return null;
  return (lineId && shots.find((s) => s.lines?.includes(lineId))) || shots.find((s) => !s.lines) || shots[0];
}

/** Sets that have a built 3D scene. Everything else keeps the layered paper scene. */
export const CINEMA_SETS = new Set(Object.keys(SHOTS));
