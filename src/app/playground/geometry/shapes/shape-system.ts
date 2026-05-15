/**
 * Multi-Shape Topology System
 * Separates shape-specific logic (topology, transforms, folding, net layout)
 * from generic rendering pipeline
 */

export type ShapeType = "cube" | "pyramid" | "cylinder" | "cone";

export type ShapeSize = {
  size?: number;
  width?: number;
  height?: number;
  depth?: number;
  [key: string]: number | undefined;
};

/**
 * Generic face node for any shape's topology graph
 */
export interface FaceNode {
  id: string;
  parent?: string;
  attachEdge?: string;
}

/**
 * 2D net layout: explicit positioning for each face in the patron (unfolded) view
 * [x, y] coordinates in normalized space
 */
export interface NetLayout {
  [faceId: string]: [number, number];
}

/**
 * Transform for a face in 3D space
 * Defines hinge pivot, offset to child center, and rotation axis
 */
export interface FaceTransform {
  pivot: [number, number, number];
  offset: [number, number, number];
  rotationAxis: "x" | "y" | "z";
  rotationSign: 1 | -1;
}

/**
 * Fold angles for a shape: maps faceId to angle in radians
 */
export interface FoldAngles {
  [faceId: string]: number;
}

/**
 * Complete shape definition: topology, transforms, folding, and net layout
 */
export interface ShapeDefinition {
  shapeType: ShapeType;
  topology: FaceNode[];
  netLayout: NetLayout;
  patronAngles: FoldAngles; // All faces flat (0°)
  foldedAngles: FoldAngles; // Fully folded state
  /**
   * Get transform for a face attached on an edge
   * Args: (attachEdge, parentSize, childSize)
   */
  getTransform: (
    edge: string,
    parentSize: [number, number],
    childSize: [number, number]
  ) => FaceTransform;
  /**
   * Get fold angle for a face given progress (0 = patron, 1 = folded)
   */
  getFoldAngle: (faceId: string, progress: number) => number;
  /**
   * Get face size for a given faceId
   * Args: (faceId, shapeSize)
   */
  getFaceSize: (faceId: string, shapeSize: ShapeSize) => [number, number];
}

/**
 * Shape registry: maps shape type to its definition
 */
const shapeRegistry: Map<ShapeType, ShapeDefinition> = new Map();

/**
 * Register a shape definition
 */
export function registerShape(definition: ShapeDefinition): void {
  shapeRegistry.set(definition.shapeType, definition);
}

/**
 * Get a shape definition by type
 */
export function getShapeDefinition(shapeType: ShapeType): ShapeDefinition {
  const definition = shapeRegistry.get(shapeType);
  if (!definition) {
    throw new Error(
      `Shape type "${shapeType}" not registered. Available: ${Array.from(shapeRegistry.keys()).join(", ")}`
    );
  }
  return definition;
}

/**
 * Get all registered shapes
 */
export function getRegisteredShapes(): ShapeType[] {
  return Array.from(shapeRegistry.keys());
}
