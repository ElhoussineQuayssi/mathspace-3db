/**
 * Generic Net Transform Functions
 * Computes pivot, offset, and rotation for net face attachments
 * Reuses the same edge-based logic as cube-transforms but works with any dimensions
 */

import type { NetEdge } from "./net-topology";

export interface NetFaceTransform {
  pivot: [number, number, number];
  offset: [number, number, number];
  rotationAxis: "x" | "y" | "z";
  rotationSign: 1 | -1;
}

export interface RectDimensions {
  width: number;
  height: number;
}

export interface CircleDimensions {
  radius: number;
}

/**
 * Get transform for a child face attached to a parent's edge
 * For rectangular child faces
 */
export function getRectFaceTransform(
  edge: NetEdge,
  parentWidth: number,
  parentHeight: number,
  childWidth: number,
  childHeight: number
): NetFaceTransform {
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
  }
}

/**
 * Get transform for a circular face attached to a parent rect's edge
 * The circle centers on the midpoint of the edge
 */
export function getCircleFaceTransform(
  edge: NetEdge,
  parentWidth: number,
  parentHeight: number,
  childRadius: number
): NetFaceTransform {
  // For circles, offset moves to the edge midpoint then out by radius
  // The pivot is at the edge midpoint on the parent
  switch (edge) {
    case "top":
      return {
        pivot: [0, parentHeight / 2, 0],
        offset: [0, childRadius, 0],
        rotationAxis: "x",
        rotationSign: -1,
      };
    case "bottom":
      return {
        pivot: [0, -parentHeight / 2, 0],
        offset: [0, -childRadius, 0],
        rotationAxis: "x",
        rotationSign: 1,
      };
    case "left":
      return {
        pivot: [-parentWidth / 2, 0, 0],
        offset: [-childRadius, 0, 0],
        rotationAxis: "y",
        rotationSign: -1,
      };
    case "right":
      return {
        pivot: [parentWidth / 2, 0, 0],
        offset: [childRadius, 0, 0],
        rotationAxis: "y",
        rotationSign: 1,
      };
  }
}

/**
 * Get the rotation for a given axis and fold progress
 * progress: 0 = flat (patron), 1 = folded (90 degrees)
 */
export function getNetRotation(
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

/**
 * Recursively build face transforms for the net hierarchy
 */
export function buildNetTransforms(
  nodes: Array<{
    id: string;
    parent?: string;
    attachEdge?: NetEdge;
    shape: string;
    dimensions: Record<string, number>;
  }>,
  parentId: string,
  parentDims: { width?: number; height?: number; radius?: number },
  parentPosition: [number, number, number],
  parentRotation: [number, number, number],
  progress: number
): Record<
  string,
  {
    position: [number, number, number];
    rotation: [number, number, number];
    shape: string;
    dimensions: Record<string, number>;
  }
> {
  const result: Record<
    string,
    {
      position: [number, number, number];
      rotation: [number, number, number];
      shape: string;
      dimensions: Record<string, number>;
    }
  > = {};

  const children = nodes.filter((n) => n.parent === parentId);

  for (const child of children) {
    const edge = child.attachEdge!;
    let childPos: [number, number, number];
    let childRot: [number, number, number];

    if (child.shape === "circle" || child.shape === "triangle") {
      // For non-rect children attaching to a rect parent
      const transform = getCircleFaceTransform(
        edge,
        parentDims.width ?? parentDims.radius ?? 1,
        parentDims.height ?? parentDims.radius ?? 1,
        child.dimensions.radius ?? child.dimensions.base ?? 1
      );

      const rot = getNetRotation(transform.rotationAxis, progress, transform.rotationSign);

      // Transform pivot point considering parent rotation
      childPos = [
        parentPosition[0] + transform.pivot[0],
        parentPosition[1] + transform.pivot[1],
        parentPosition[2] + transform.pivot[2],
      ] as [number, number, number];

      childRot = rot;
    } else {
      // Rect child
      const transform = getRectFaceTransform(
        edge,
        parentDims.width ?? 1,
        parentDims.height ?? 1,
        child.dimensions.width ?? 1,
        child.dimensions.height ?? 1
      );

      const rot = getNetRotation(transform.rotationAxis, progress, transform.rotationSign);

      childPos = [
        parentPosition[0] + transform.pivot[0],
        parentPosition[1] + transform.pivot[1],
        parentPosition[2] + transform.pivot[2],
      ] as [number, number, number];

      childRot = rot;
    }

    result[child.id] = {
      position: childPos,
      rotation: childRot,
      shape: child.shape,
      dimensions: child.dimensions,
    };

    // Recursively process children of this child
    const grandChildren = buildNetTransforms(
      nodes,
      child.id,
      child.dimensions,
      childPos,
      childRot,
      progress
    );

    Object.assign(result, grandChildren);
  }

  return result;
}