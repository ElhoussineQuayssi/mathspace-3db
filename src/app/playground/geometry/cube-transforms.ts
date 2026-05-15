/**
 * Face Transform Calculations
 * Derives pivot positions, offsets, and rotation axes from edge attachments
 * This is the universal transform function for all faces
 */

import type { Edge } from "./cube-topology";

export type FaceSize = [number, number];

export interface FaceTransform {
  pivot: [number, number, number];
  offset: [number, number, number];
  rotationAxis: "x" | "y" | "z";
  rotationSign: 1 | -1;
}

/**
 * Get the transform for a face attached on a specific edge
 * The pivot sits on the shared edge in the parent face's center space.
 * The offset moves into the child face's center space.
 * This keeps nested faces dimension-aware instead of unit-cube based.
 */
export function getFaceTransform(
  edge: Edge,
  parentSize: FaceSize,
  childSize: FaceSize
): FaceTransform {
  const [parentWidth, parentHeight] = parentSize;
  const [childWidth, childHeight] = childSize;

  switch (edge) {
    case "top":
      return {
        pivot: [0, parentHeight / 2, 0],
        offset: [0, childHeight / 2, 0],
        rotationAxis: "x",
        rotationSign: -1,
      };

    case "bottom":
      return {
        pivot: [0, -parentHeight / 2, 0],
        offset: [0, -childHeight / 2, 0],
        rotationAxis: "x",
        rotationSign: 1,
      };

    case "left":
      return {
        pivot: [-parentWidth / 2, 0, 0],
        offset: [-childWidth / 2, 0, 0],
        rotationAxis: "y",
        rotationSign: -1,
      };

    case "right":
      return {
        pivot: [parentWidth / 2, 0, 0],
        offset: [childWidth / 2, 0, 0],
        rotationAxis: "y",
        rotationSign: 1,
      };

    default:
      const _exhaustive: never = edge;
      return _exhaustive;
  }
}

/**
 * Get rotation angle for an axis based on fold progress
 * Returns angle in radians
 */
export function getRotationForAxis(
  axis: "x" | "y" | "z",
  progress: number,
  sign: 1 | -1 = -1
): [number, number, number] {
  const angle = progress * (Math.PI / 2) * sign;
  const rotation: [number, number, number] = [0, 0, 0];

  switch (axis) {
    case "x":
      rotation[0] = angle;
      break;
    case "y":
      rotation[1] = angle;
      break;
    case "z":
      rotation[2] = angle;
      break;
  }

  return rotation;
}
