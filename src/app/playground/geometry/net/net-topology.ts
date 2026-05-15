/**
 * Net Topology Definitions
 * Defines how faces connect in the unfolded (patron) state
 * Each shape has a root face with child faces attached at edges
 */

export type NetEdge = "top" | "bottom" | "left" | "right";

export interface NetFaceNode {
  id: string;
  parent?: string;
  attachEdge?: NetEdge;
  shape: "rect" | "circle" | "triangle";
  // For rect: [width, height]
  // For circle: radius
  // For triangle: [base, height] or [base, side] depending on type
  dimensions: Record<string, number>;
}

/**
 * Cylinder Net
 * - Rectangle (side face) is the root
 * - Top circle attaches to top edge of rectangle
 * - Bottom circle attaches to bottom edge of rectangle
 */
export const cylinderNet: NetFaceNode[] = [
  { id: "side", shape: "rect", dimensions: { width: 1, height: 1 } },
  { id: "top", parent: "side", attachEdge: "top", shape: "circle", dimensions: { radius: 0.5 } },
  { id: "bottom", parent: "side", attachEdge: "bottom", shape: "circle", dimensions: { radius: 0.5 } },
];

/**
 * Cone Net
 * - Circle (base) is the root
 * - Sector (side) attaches to the circle
 */
export const coneNet: NetFaceNode[] = [
  { id: "base", shape: "circle", dimensions: { radius: 1 } },
  { id: "side", parent: "base", attachEdge: "right", shape: "rect", dimensions: { width: 1, height: 1 } },
];

/**
 * Triangular Pyramid Net
 * - Base triangle is the root
 * - 3 side triangles attach to each edge of the base
 */
export const triangularPyramidNet: NetFaceNode[] = [
  { id: "base", shape: "triangle", dimensions: { base: 1, height: 0.866 } },
  { id: "face1", parent: "base", attachEdge: "top", shape: "triangle", dimensions: { base: 1, height: 0.866 } },
  { id: "face2", parent: "base", attachEdge: "left", shape: "triangle", dimensions: { base: 1, height: 0.866 } },
  { id: "face3", parent: "base", attachEdge: "right", shape: "triangle", dimensions: { base: 1, height: 0.866 } },
];