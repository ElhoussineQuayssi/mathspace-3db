/**
 * Cube Shape Definition
 * Registers cube topology, transforms, and folding with the shape system
 * 
 * A cube has:
 * - 6 square faces (all identical)
 * - 12 edges (all identical length)
 * - 8 vertices
 * 
 * Key properties:
 * - All faces are squares
 * - All angles are 90°
 * - Orthogonal symmetry (3 perpendicular axes)
 */

import type { ShapeDefinition, FaceNode, FaceTransform, ShapeSize } from "./shape-system";
import { registerShape } from "./shape-system";

export type CubeFaceId = "front" | "back" | "left" | "right" | "top" | "bottom";

/**
 * Cube topology: front is root, all others attach to edges
 * Structure:
 * - front: root
 * - left/right/top/bottom: attached to front's edges
 * - back: attached to right's right edge
 */
const cubeTopology: FaceNode[] = [
  { id: "front" },
  { id: "right", parent: "front", attachEdge: "right" },
  { id: "left", parent: "front", attachEdge: "left" },
  { id: "top", parent: "front", attachEdge: "top" },
  { id: "bottom", parent: "front", attachEdge: "bottom" },
  { id: "back", parent: "right", attachEdge: "right" },
];

/**
 * Cube net layout: cross pattern (patron en croix)
 * Standard unfolding for a cube net:
 *        [top]
 *   [left][front][right][back]
 *       [bottom]
 */
const cubeNetLayout: Record<string, [number, number]> = {
  front: [0, 0],
  right: [1, 0],
  left: [-1, 0],
  top: [0, -1],
  bottom: [0, 1],
  back: [2, 0],
};

/**
 * Cube patron angles: all faces flat (0°) when unfolded
 */
const cubePatronAngles: Record<string, number> = {
  front: 0,
  right: 0,
  left: 0,
  top: 0,
  bottom: 0,
  back: 0,
};

/**
 * Cube folded angles: all hinged faces rotate 90° when assembled
 * All dihedral angles are Math.PI/2 (90°)
 */
const cubeFoldedAngles: Record<string, number> = {
  front: 0, // root never rotates
  right: Math.PI / 2,
  left: Math.PI / 2,
  top: Math.PI / 2,
  bottom: Math.PI / 2,
  back: Math.PI / 2,
};

/**
 * Get transform for a cube face attached on an edge
 * 
 * Cube geometry is orthogonal:
 * - All faces are squares with side length s
 * - All edges are axis-aligned
 * - All hinges are at 90° angles
 * 
 * For a front face (width × height), edges are:
 * - top: along positive Y
 * - bottom: along negative Y
 * - left: along negative X
 * - right: along positive X
 */
function getCubeTransform(
  edge: string,
  parentSize: [number, number],
  childSize: [number, number]
): FaceTransform {
  const [parentWidth, parentHeight] = parentSize;
  const [childWidth, childHeight] = childSize;

  switch (edge) {
    case "top":
      // Top edge of front face
      // Pivot at midpoint of top edge
      // Child face (top face) rotates around this edge
      return {
        pivot: [0, parentHeight / 2, 0],
        offset: [0, childHeight / 2, 0],
        rotationAxis: "x",
        rotationSign: 1,
      };

    case "bottom":
      // Bottom edge of front face
      // Child face (bottom) rotates down
      return {
        pivot: [0, -parentHeight / 2, 0],
        offset: [0, -childHeight / 2, 0],
        rotationAxis: "x",
        rotationSign: -1,
      };

    case "left":
      // Left edge of front face
      // Child face (left) rotates left
      return {
        pivot: [-parentWidth / 2, 0, 0],
        offset: [-childWidth / 2, 0, 0],
        rotationAxis: "y",
        rotationSign: 1,
      };

    case "right":
      // Right edge of front face
      // Child face rotates right
      return {
        pivot: [parentWidth / 2, 0, 0],
        offset: [childWidth / 2, 0, 0],
        rotationAxis: "y",
        rotationSign: -1,
      };

    default:
      throw new Error(`Unknown cube edge: ${edge}`);
  }
}

/**
 * Get fold angle for a cube face given progress
 * Interpolates linearly between patron (0°) and folded state
 */
function getCubeFoldAngle(faceId: string, progress: number): number {
  const patron = cubePatronAngles[faceId] || 0;
  const folded = cubeFoldedAngles[faceId] || 0;
  return patron + (folded - patron) * progress;
}

/**
 * Get 2D size of a rectangular prism face.
 * If only `size` is provided, this still behaves as a true cube.
 */
function getCubeFaceSize(
  faceId: string,
  shapeSize: ShapeSize
): [number, number] {
  const width = shapeSize.width ?? shapeSize.size ?? 1;
  const height = shapeSize.height ?? shapeSize.size ?? width;
  const depth = shapeSize.depth ?? shapeSize.size ?? width;

  switch (faceId) {
    case "front":
    case "back":
      return [width, height];
    case "left":
    case "right":
      return [depth, height];
    case "top":
    case "bottom":
      return [width, depth];
    default:
      return [width, height];
  }
}

/**
 * Cube shape definition
 */
const cubeDefinition: ShapeDefinition = {
  shapeType: "cube",
  topology: cubeTopology,
  netLayout: cubeNetLayout,
  patronAngles: cubePatronAngles,
  foldedAngles: cubeFoldedAngles,
  getTransform: getCubeTransform,
  getFoldAngle: getCubeFoldAngle,
  getFaceSize: getCubeFaceSize,
};

/**
 * Register cube with the shape system
 */
registerShape(cubeDefinition);

/**
 * Export for backward compatibility
 */
export { cubeDefinition };
