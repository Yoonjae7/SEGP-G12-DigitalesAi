import type { CharacterModel, CharId } from '../types';
import { ClayCharacter } from './Clay';

/**
 * The registry. Scene code asks for a model by id and never cares which kind it gets.
 * To swap in a GLB later: write a component with CharacterModelProps that loads /public/models/<id>.glb
 * (useGLTF from @react-three/drei) and map the pose table onto its bones, then register it here.
 */
const MODELS: Partial<Record<CharId, CharacterModel>> = {};

export const characterModel = (id: CharId): CharacterModel => MODELS[id] ?? ClayCharacter;
