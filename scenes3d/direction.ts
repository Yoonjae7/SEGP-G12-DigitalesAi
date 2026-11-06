import type { CharId } from './types';

export type V3 = [number, number, number];

/** One camera set-up. It holds for the lines listed, and the camera glides to it from wherever it was. */
/**
 * `pov` puts the camera where that person's eyes are, so their head is not drawn.
 * `shift` moves the camera sideways by a fraction of the picture width, so the subject sits left of centre (when a choice is on screen it is shifted for you).
 */
export interface Shot { lines?: string[]; pos: V3; look: V3; fov: number; drift?: V3; pov?: CharId; shift?: number }

/** Where a person stands or sits in a set, and which way they face (radians about the up axis; 0 faces +z). */
export interface Place { pos: V3; rotY: number }

export const FRONT = Math.PI; // facing -z, toward the front of the bus, the counter, the wall
const TO_CAMERA = 0; // facing +z, toward a camera that looks along -z

/**
 * The staging for each set. People, poses and expressions come from content/story.json (a line can also change what someone is
 * doing with `act`). This file only says where things are and where the camera looks.
 */
export const PLACE: Record<string, Partial<Record<CharId, Place>>> = {
  // two seat blocks, one each side of the aisle: Sarah (window) on the right with you just behind her, Lisa and Marco (window) on the left,
  // and Dev standing in the aisle holding the pole. Nobody is right in front of anybody the camera needs to see.
  s0: {
    sarah: { pos: [-1.2, 0, 0.1], rotY: FRONT },
    you: { pos: [-0.6, 0, 1.1], rotY: FRONT },
    lisa: { pos: [0.6, 0, 0.1], rotY: FRONT - 0.55 },
    marco: { pos: [1.2, 0, 0.1], rotY: FRONT + 0.45 },
    dev: { pos: [0.0, 0, 1.45], rotY: FRONT },
  },
  // the dorm room: you sit on the foot of the bed, facing the wall, and the camera looks over your shoulder
  s1: { you: { pos: [-0.55, 0, -0.05], rotY: FRONT } },
  s2: { you: { pos: [-0.55, 0, -0.05], rotY: FRONT } },
  // the café, in the queue: you behind Sarah, Marco and Dev by the counter, looking at their phones
  s4: {
    sarah: { pos: [1.2, 0, -1.95], rotY: FRONT },
    you: { pos: [1.2, 0, -1.25], rotY: FRONT },
    marco: { pos: [2.7, 0, -2.1], rotY: TO_CAMERA + 0.15 },
    dev: { pos: [3.4, 0, -2.0], rotY: TO_CAMERA - 0.15 },
  },
  // at a table: Sarah faces the camera, you sit across from her with your back to it. Lisa waits outside the door.
  s5: {
    sarah: { pos: [-2.0, 0.06, -2.15], rotY: TO_CAMERA },
    you: { pos: [-2.0, 0.06, -1.05], rotY: FRONT },
    lisa: { pos: [-5.5, 0, -0.8], rotY: Math.PI / 2 },
  },
  // in the corner by the door: Lisa faces you, and you have your back to the camera
  s6: {
    lisa: { pos: [-4.0, 0, -0.8], rotY: Math.PI / 2 },
    you: { pos: [-2.9, 0, -0.4], rotY: -Math.PI / 2 },
  },
  // the library steps: the good ending, with everyone around Sarah
  s7a: {
    sarah: { pos: [0.3, 0.34, -1.0], rotY: TO_CAMERA },
    lisa: { pos: [1.15, 0.34, -0.95], rotY: -1.07 },
    marco: { pos: [-0.8, 0.34, -1.05], rotY: 0.45 },
    dev: { pos: [-1.5, 0.34, -1.0], rotY: 0.6 },
    you: { pos: [-1.9, 0, 0.6], rotY: FRONT - 0.5 }, // to one side, so Sarah is never behind your head
  },
  // and the other one: you alone with your phone, the others apart
  s7b: {
    you: { pos: [2.2, 0, 0.5], rotY: FRONT },
    marco: { pos: [-2.0, 0.34, -1.0], rotY: 0.4 },
    dev: { pos: [-1.3, 0.34, -1.0], rotY: 0.55 },
    lisa: { pos: [-3.6, 0, 0.6], rotY: -Math.PI / 2 },
  },
};

/** Named places people can walk to (a line says `to: "door"`). */
export const SPOTS: Record<string, Record<string, { x: number; z: number; rotY: number }>> = {
  s0: { window: { x: -1.2, z: 0.1, rotY: -Math.PI / 2 } }, // Sarah turns to look out of the window
  s4: { turn: { x: 1.2, z: -1.95, rotY: TO_CAMERA } }, // Sarah turns round to ask why everyone is looking
  s5: {
    door: { x: -5.6, z: -0.8, rotY: -Math.PI / 2 }, // Sarah leaves
    inside: { x: -3.7, z: -0.8, rotY: Math.PI / 2 }, // Lisa walks in
  },
};

// In the bus, +x is on the left of the picture when the camera looks back (+z) from the front.
export const SHOTS: Record<string, Shot[]> = {
  // The bus: wide, then one shot for each person as they are introduced, then the moment on Lisa's phone
  s0: [
    { lines: ['s0_01'], pos: [0.0, 1.6, -3.6], look: [0.0, 1.0, 0.5], fov: 46, drift: [0, 0, 0.1] },
    { lines: ['s0_02', 's0_06'], pos: [-0.2, 1.25, -1.5], look: [-1.1, 1.1, 0.1], fov: 30, drift: [-0.02, 0, 0.03] },
    { lines: ['s0_03'], pos: [0.1, 1.3, -1.7], look: [0.6, 1.05, 0.1], fov: 30, drift: [0.02, 0, 0.03] },
    { lines: ['s0_04'], pos: [0.9, 1.4, -1.5], look: [1.2, 1.1, 0.1], fov: 28, drift: [-0.02, 0, 0.03] },
    { lines: ['s0_05'], pos: [0.0, 1.65, -0.9], look: [0.0, 1.6, 1.45], fov: 36, drift: [0, 0, 0.03] },
    { lines: ['s0_07'], pos: [0.2, 1.3, -1.3], look: [-1.5, 1.1, 0.1], fov: 28, drift: [-0.02, 0, 0.02] },
    { lines: ['s0_08'], pos: [0.1, 1.5, -1.9], look: [0.9, 1.0, 0.1], fov: 34, drift: [0.02, 0, 0.03] },
    { lines: ['s0_09'], pos: [0.0, 1.7, -2.0], look: [0.6, 1.1, 0.6], fov: 38, drift: [-0.02, 0, 0.02] },
    { lines: ['s0_10'], pos: [-0.1, 1.55, -1.0], look: [-0.6, 1.15, 1.1], fov: 28, drift: [0, 0, 0.02] },
    { pos: [0.0, 1.6, -3.6], look: [0.0, 1.0, 0.5], fov: 46 },
  ],
  // Your phone buzzes: the room first, then in on the screen for the chat. The close shot is where your own eyes are,
  // looking straight at the phone, so the whole chat can be read (the phone is at about [-0.28, 0.86, -0.49], tilted a little towards +z).
  s1: [
    { lines: ['s1_01'], pos: [1.0, 1.65, 1.8], look: [-0.5, 1.0, -1.1], fov: 44, drift: [-0.04, -0.01, -0.06] },
    { pos: [-0.46, 1.05, 0.08], look: [-0.28, 0.85, -0.49], fov: 34, pov: 'you' },
  ],
  // The chat goes on, you think about Lisa from over your shoulder, and then the phone again while you decide
  s2: [
    { lines: ['s2_03', 's2_03b'], pos: [0.95, 1.5, 0.95], look: [-0.45, 0.85, -0.4], fov: 38, drift: [-0.01, 0, -0.02] },
    { pos: [-0.46, 1.05, 0.08], look: [-0.28, 0.85, -0.49], fov: 34, pov: 'you' },
  ],
  // Three phones, one chain: the camera starts wide, visits each phone as the message reaches it, then pulls back
  s3: [
    { lines: ['s3_01'], pos: [0, 1.0, 3.6], look: [0, 0.5, 0], fov: 38, drift: [0, 0, -0.04] },
    { lines: ['s3_02'], pos: [0.35, 0.85, 2.0], look: [0, 0.55, 0], fov: 34 },
    { lines: ['s3_03'], pos: [1.75, 0.85, 2.0], look: [1.5, 0.55, 0], fov: 34 },
    { lines: ['s3_04'], pos: [0, 1.5, 4.4], look: [0, 0.45, 0], fov: 40, drift: [0, 0.01, 0.05] },
    { lines: ['s3_05a', 's3_05b'], pos: [-1.2, 0.85, 2.1], look: [-1.5, 0.55, 0], fov: 34 },
    { pos: [0, 1.7, 4.8], look: [0, 0.3, 0], fov: 42, drift: [0, 0.02, 0.06] },
  ],
  // The queue: wide from behind you, closer on the people, then Sarah turns round and asks why everyone is looking
  s4: [
    { lines: ['s4_01', 's4_01b'], pos: [-1.4, 1.5, 1.2], look: [1.6, 1.0, -2.3], fov: 46, drift: [0.03, 0, -0.03] },
    { lines: ['s4_02'], pos: [0.1, 1.4, 0.5], look: [1.8, 1.1, -2.0], fov: 38 },
    { lines: ['s4_03', 's4_03b'], pos: [2.35, 1.5, -0.2], look: [1.15, 1.2, -1.95], fov: 30 },
    { lines: ['s4t_01', 's4t_02', 's4t_03', 's4t_04'], pos: [-0.2, 1.35, -0.9], look: [1.2, 1.2, -1.7], fov: 34 },
    { lines: ['s4d_01', 's4d_02', 's4d_03', 's4d_04'], pos: [1.3, 1.4, -0.6], look: [3.0, 1.2, -2.1], fov: 32 },
    { pos: [0.2, 1.5, 0.6], look: [1.8, 1.1, -1.9], fov: 40, drift: [0, 0, -0.02] },
  ],
  // At the table: over your shoulder at Sarah, and wide when she leaves and Lisa comes in
  s5: [
    { lines: ['s5_04', 's5_05'], pos: [-0.6, 1.7, 1.4], look: [-3.4, 0.95, -1.1], fov: 48 },
    { pos: [-1.35, 1.4, -0.1], look: [-2.0, 1.12, -2.1], fov: 32, drift: [0, 0, -0.015] },
  ],
  // By the door: Lisa and you, face to face
  s6: [
    { pos: [-2.5, 1.55, 1.3], look: [-3.5, 1.05, -0.65], fov: 40, drift: [-0.01, 0, -0.01] },
  ],
  // The library steps, the good ending: wide, then in on the group
  s7a: [
    { lines: ['s7_01', 'eA_00', 'eA_01', 'eA_04', 'eA_04b', 'eA_05', 'eA_05a', 'eA_06'], pos: [-1.1, 1.55, 3.0], look: [0.2, 1.0, -1.0], fov: 42, drift: [0.03, 0, -0.03] },
    { pos: [1.5, 1.4, 1.6], look: [0.35, 1.15, -1.0], fov: 36, drift: [-0.015, 0, -0.01] },
  ],
  // and the other one
  s7b: [
    { pos: [0.5, 1.6, 3.6], look: [-0.2, 1.0, -0.6], fov: 50, drift: [-0.03, 0, -0.03] },
  ],
};

export function shotFor(art: string, lineId: string | null): Shot | null {
  const shots = SHOTS[art];
  if (!shots) return null;
  return (lineId && shots.find((s) => s.lines?.includes(lineId))) || shots.find((s) => !s.lines) || shots[0];
}

/** Sets that have a built 3D scene. Everything else keeps the layered paper scene. */
export const CINEMA_SETS = new Set(Object.keys(SHOTS));
