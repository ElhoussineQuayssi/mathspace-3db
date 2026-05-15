/**
 * Net Fold Definitions for Non-Cube Shapes
 * Each shape defines its patron (flat) and folded (assembled) states
 */

export interface FoldAngles {
  [faceId: string]: number; // 0 = flat, 1 = fully folded
}

// ===== Cylinder =====

/** Cylinder patron: side flat, circles on top/bottom edges */
export function getCylinderPatronAngles(): FoldAngles {
  return {
    side: 0,
    top: 0,
    bottom: 0,
  };
}

/** Cylinder folded: circles upright, side wraps around */
export function getCylinderFoldedAngles(): FoldAngles {
  return {
    side: 0,
    top: 1, // 90 degrees
    bottom: 1, // 90 degrees
  };
}

// ===== Cone =====

/** Cone patron: circle flat, sector on edge */
export function getConePatronAngles(): FoldAngles {
  return {
    base: 0,
    side: 0,
  };
}

/** Cone folded: sector lifts up */
export function getConeFoldedAngles(): FoldAngles {
  return {
    base: 0,
    side: 1, // lifts up
  };
}

// ===== Triangular Pyramid =====

/** Pyramid patron: base flat, faces flat on ground */
export function getTriangularPyramidPatronAngles(): FoldAngles {
  return {
    base: 0,
    face1: 0,
    face2: 0,
    face3: 0,
  };
}

/** Pyramid folded: side faces lift up */
export function getTriangularPyramidFoldedAngles(): FoldAngles {
  return {
    base: 0,
    face1: 1,
    face2: 1,
    face3: 1,
  };
}

/**
 * Interpolate between patron and folded states
 */
export function getNetFoldAngles(
  patron: FoldAngles,
  folded: FoldAngles,
  progress: number
): FoldAngles {
  const result: FoldAngles = {};
  for (const key in patron) {
    result[key] = patron[key] + (folded[key] - patron[key]) * progress;
  }
  return result;
}
