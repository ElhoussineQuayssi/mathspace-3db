/**
 * Cube Fold Animation
 * Manages two states: patron (unfolded, 0°) and folded (90°)
 * Only animates fold angles, never repositions faces
 */

export interface FoldState {
  faceId: string;
  angle: number; // in radians
}

/**
 * Patron mode: cube is unfolded flat
 * All fold angles are 0
 */
export function getPatronAngles(): Record<string, number> {
  return {
    front: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    back: 0,
  };
}

/**
 * Folded mode: cube is properly folded
 * All fold angles are 90° (Math.PI / 2)
 */
export function getFoldedAngles(): Record<string, number> {
  return {
    front: 0, // root never folds
    top: Math.PI / 2,
    bottom: Math.PI / 2,
    left: Math.PI / 2,
    right: Math.PI / 2,
    back: Math.PI / 2,
  };
}

/**
 * Interpolate between patron and folded states
 * progress: 0 = patron (unfolded), 1 = folded
 */
export function getFoldAngles(progress: number): Record<string, number> {
  const patron = getPatronAngles();
  const folded = getFoldedAngles();
  const result: Record<string, number> = {};

  for (const faceId in patron) {
    result[faceId] = patron[faceId] + (folded[faceId] - patron[faceId]) * progress;
  }

  return result;
}
