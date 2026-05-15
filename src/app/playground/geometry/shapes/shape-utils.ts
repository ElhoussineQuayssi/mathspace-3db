/**
 * Shape-Aware Transform Utilities
 * Dispatches transform requests to the correct shape definition
 */

import type { ShapeType, FaceTransform, ShapeSize } from "./shape-system";
import { getShapeDefinition } from "./shape-system";

/**
 * Get face transform for any shape
 * Dispatches to the shape's definition
 */
export function getShapeTransform(
  shapeType: ShapeType,
  edge: string,
  parentSize: [number, number],
  childSize: [number, number]
): FaceTransform {
  const definition = getShapeDefinition(shapeType);
  return definition.getTransform(edge, parentSize, childSize);
}

/**
 * Get rotation angle for an axis based on fold progress
 * Used during folding animation
 */
export function getRotationForAxis(
  axis: "x" | "y" | "z",
  progress: number,
  sign: 1 | -1 = -1
): [number, number, number] {
  // Note: this uses a fixed angle for cube-like shapes
  // For non-orthogonal shapes, the fold angle is provided by getFoldAngle
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

/**
 * Get fold angle for a face during animation
 * Dispatches to the shape's fold angle calculator
 * 
 * progress: 0 = patron (flat), 1 = fully folded
 */
export function getShapeFoldAngle(
  shapeType: ShapeType,
  faceId: string,
  progress: number
): number {
  const definition = getShapeDefinition(shapeType);
  return definition.getFoldAngle(faceId, progress);
}

/**
 * Get 2D size of a face in a shape
 */
export function getShapeFaceSize(
  shapeType: ShapeType,
  faceId: string,
  shapeSize: ShapeSize
): [number, number] {
  const definition = getShapeDefinition(shapeType);
  return definition.getFaceSize(faceId, shapeSize);
}
