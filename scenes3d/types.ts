import type { ComponentType } from 'react';

export type CharId = 'sarah' | 'lisa' | 'marco' | 'dev' | 'you';

/**
 * What every character model must accept. Scene code only ever uses this.
 * The built-in clay figures in characters/Clay.tsx are built from primitives. To use GLB models later,
 * put them in /public/models/<id>.glb, write a component with these props, and register it in
 * characters/index.ts. Nothing in the scenes changes. The build never waits for model files.
 */
export interface CharacterModelProps {
  id: CharId;
  pose: string; // a name from lib/art/rig POSES. Poses are tables of joint rotations.
  expression: string; // a name from EXPR. Expressions swap the face texture.
  view: 'front' | 'back' | 'side';
  yaw?: number; // 0 to 1, turns the body and face away
  talking?: boolean; // the mouth moves and the head and hands move a little
}
export type CharacterModel = ComponentType<CharacterModelProps>;

/** Where a person stands, in the same pixel space as the 2D scene (1600 x 900), and how deep they are (0 far, 1 near). */
export interface Slot { x: number; y: number; scale: number; depth: number; yaw?: number }
