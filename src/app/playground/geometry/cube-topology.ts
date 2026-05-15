/**
 * Cube Topology Graph
 * Defines the cube as a connected graph of rigid faces
 * Each face owns local orientation, hinge relation to parent, and fold angle
 */

export type FaceId =
  | "front"
  | "back"
  | "left"
  | "right"
  | "top"
  | "bottom";

export type Edge = "top" | "bottom" | "left" | "right";

export interface FaceNode {
  id: FaceId;
  parent?: FaceId;
  attachEdge?: Edge;
}

/**
 * Cube net topology
 * Front is the root face
 * Top, Bottom, Left, Right attach to front's edges
 * Back attaches to top's top edge
 */
export const cubeNet: FaceNode[] = [
  { id: "front" },

  // Four faces attach to front's edges
  { id: "top", parent: "front", attachEdge: "top" },
  { id: "bottom", parent: "front", attachEdge: "bottom" },
  { id: "left", parent: "front", attachEdge: "left" },
  { id: "right", parent: "front", attachEdge: "right" },

  // Back attaches to top
  { id: "back", parent: "top", attachEdge: "top" },
];
