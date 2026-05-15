/**
 * Triangular Pyramid Shape Definition
 * Registers pyramid topology, transforms, and folding with the shape system
 * 
 * A triangular pyramid has:
 * - 1 triangular base
 * - 3 triangular side faces
 * Total: 4 faces, 6 edges
 * 
 * Key difference from cube:
 * - Non-orthogonal angles (depends on triangle geometry)
 * - Variable fold angles (not always 90°)
 * - Explicit net layout (patron cannot be computed from axis-aligned edges)
 */

import type { ShapeDefinition, FaceNode, FaceTransform, ShapeSize } from "./shape-system";
import { registerShape } from "./shape-system";

export type PyramidFaceId = "base" | "side1" | "side2" | "side3";

/**
 * Pyramid topology: base is root, three sides attach to base's edges
 */
const pyramidTopology: FaceNode[] = [
  { id: "base" },
  { id: "side1", parent: "base", attachEdge: "edge1" },
  { id: "side2", parent: "base", attachEdge: "edge2" },
  { id: "side3", parent: "base", attachEdge: "edge3" },
];

/**
 * Pyramid net layout: explicit 2D positioning
 * Base in center, three sides arranged around it
 * Normalized to unit spacing
 */
const pyramidNetLayout: Record<string, [number, number]> = {
  base: [0, 0],
  side1: [0, -1], // above base
  side2: [-0.866, 0.5], // bottom-left (120° rotation)
  side3: [0.866, 0.5], // bottom-right (120° rotation)
};

/**
 * Pyramid patron angles: all faces flat (0°)
 */
const pyramidPatronAngles: Record<string, number> = {
  base: 0,
  side1: 0,
  side2: 0,
  side3: 0,
};

/**
 * Pyramid folded angles
 * For a regular triangular pyramid:
 * - Each side face folds to form the slant edge
 * - Dihedral angle ≈ 70.5° (not 90°)
 * 
 * For simplicity, we use ~70.5° (arccos(1/3) ≈ 1.231 radians)
 * This is the dihedral angle of a regular tetrahedron
 */
const pyramidFoldedAngles: Record<string, number> = {
  base: 0, // root never folds
  side1: Math.acos(1 / 3), // ~70.5° dihedral angle
  side2: Math.acos(1 / 3),
  side3: Math.acos(1 / 3),
};

/**
 * Get transform for a pyramid face attached on an edge
 * 
 * Pyramid geometry differs from cube:
 * - Edges of triangular base are not axis-aligned
 * - Side faces fold inward at non-90° angles
 * 
 * For a regular triangle with side length s:
 * - Each edge acts as a hinge
 * - The fold angle depends on dihedral geometry
 */
function getPyramidTransform(
  edge: string,
  parentSize: [number, number],
  childSize: [number, number]
): FaceTransform {
  const [parentWidth, parentHeight] = parentSize;
  const [childWidth, childHeight] = childSize;

  /**
   * For a triangular base with vertices at:
   * - v1: (0, h) top
   * - v2: (-w/2, -h/2) bottom-left
   * - v3: (w/2, -h/2) bottom-right
   * 
   * Edges are:
   * - edge1: v1→v2 (left side)
   * - edge2: v2→v3 (bottom)
   * - edge3: v3→v1 (right side)
   */

  switch (edge) {
    case "edge1":
      // Left edge of triangle: from top to bottom-left
      // Pivot at midpoint of this edge
      // Child face folds outward
      return {
        pivot: [-parentWidth / 4, parentHeight / 4, 0],
        offset: [-childWidth / 2, 0, 0],
        rotationAxis: "z",
        rotationSign: 1,
      };

    case "edge2":
      // Bottom edge of triangle
      // Pivot at center of bottom
      return {
        pivot: [0, -parentHeight / 2, 0],
        offset: [0, -childHeight / 2, 0],
        rotationAxis: "x",
        rotationSign: 1,
      };

    case "edge3":
      // Right edge of triangle: from bottom-right to top
      // Pivot at midpoint of this edge
      return {
        pivot: [parentWidth / 4, parentHeight / 4, 0],
        offset: [childWidth / 2, 0, 0],
        rotationAxis: "z",
        rotationSign: -1,
      };

    default:
      throw new Error(`Unknown pyramid edge: ${edge}`);
  }
}

/**
 * Get fold angle for a pyramid face given progress
 * Interpolates between patron (flat) and folded (dihedral angle)
 */
function getPyramidFoldAngle(faceId: string, progress: number): number {
  const patron = pyramidPatronAngles[faceId] || 0;
  const folded = pyramidFoldedAngles[faceId] || 0;
  return patron + (folded - patron) * progress;
}

/**
 * Get 2D size of a pyramid face
 * For a regular triangular pyramid with characteristic size s:
 * - Base is equilateral triangle with side length s
 * - Side faces are isosceles triangles
 */
function getPyramidFaceSize(
  faceId: string,
  shapeSize: ShapeSize
): [number, number] {
  const size = shapeSize.size ?? shapeSize.width ?? shapeSize.height ?? shapeSize.depth ?? 1;
  const h = (size * Math.sqrt(3)) / 2; // height of equilateral triangle

  switch (faceId) {
    case "base":
      // Equilateral triangle
      return [size, h];

    case "side1":
    case "side2":
    case "side3":
      // Isosceles triangle (side face)
      // Base = size, height ≈ h * 0.866 (for regular pyramid)
      return [size, h * 0.866];

    default:
      return [size, h];
  }
}

/**
 * Pyramid shape definition
 */
const pyramidDefinition: ShapeDefinition = {
  shapeType: "pyramid",
  topology: pyramidTopology,
  netLayout: pyramidNetLayout,
  patronAngles: pyramidPatronAngles,
  foldedAngles: pyramidFoldedAngles,
  getTransform: getPyramidTransform,
  getFoldAngle: getPyramidFoldAngle,
  getFaceSize: getPyramidFaceSize,
};

/**
 * Register pyramid with the shape system
 */
registerShape(pyramidDefinition);

/**
 * Export for backward compatibility
 */
export { pyramidDefinition };
