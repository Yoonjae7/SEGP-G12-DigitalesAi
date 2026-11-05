import type { PoseData } from './spec';

/**
 * Extra poses that only the 3D people use (the 2D pose table has no seated people).
 *   sit = 0 to 1, how far the person sits. fL / fR = how far each arm swings forward (degrees).
 *   eL / eR = how far each forearm folds up and forward (degrees).
 * Everything else is the same as the shared pose table (lean, tilt, pitch, and so on).
 */
export interface Pose3D extends Partial<PoseData> { sit?: number; fL?: number; fR?: number; eL?: number; eR?: number; walk?: number }

export const POSES3D: Record<string, Pose3D> = {
  // seated, hands resting on the lap
  sit: { sit: 1, L: [6, -4], R: [6, -4], fL: 34, fR: 34, eL: 62, eR: 62 },
  // seated, looking down at a phone held in both hands
  'sit-phone': { sit: 1, L: [4, -4], R: [4, -4], fL: 56, fR: 56, eL: 92, eR: 92, pitch: 0.9, prop: 'phone' },
  // seated, one arm out in front with a phone held up at eye height (taking a photo)
  'sit-photo': { sit: 1, L: [6, -4], R: [2, -4], fL: 34, fR: 88, eL: 62, eR: 58, lean: 5, pitch: 0.1, prop: 'phone' },
  // seated and fast asleep, head resting against the window
  'sit-sleep': { sit: 1, L: [6, -4], R: [6, -4], fL: 34, fR: 34, eL: 62, eR: 62, tilt: 24, pitch: 0.7, lean: -2, drop: 1 },
  // seated, leaning forward with a laugh
  'sit-laugh': { sit: 1, L: [6, -4], R: [6, -4], fL: 40, fR: 64, eL: 70, eR: 60, lean: 7, tilt: -6, pitch: -0.4 },
  // walking: the legs and arms swing while this pose is on
  walk: { L: [10, -10], R: [10, -10], walk: 1 },
};
