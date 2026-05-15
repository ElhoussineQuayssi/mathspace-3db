"use client";

import * as React from "react";
import * as THREE from "three";
import type { ShapeType } from "./geometry/shapes/shape-system";
import {
  getShapeTransform,
  getShapeFoldAngle,
} from "./geometry/shapes/shape-utils";

export type FaceSize = [number, number];

export interface CubeFaceProps {
  faceId: string;
  shapeType: ShapeType;
  edge?: string;
  parentSize?: FaceSize;
  size: FaceSize;
  color: string;
  foldProgress: number;
  children?: React.ReactNode;
  showDebug?: boolean;
}

/**
 * Universal face component for any shape
 * - Single geometry and material for all faces
 * - Transform pipeline computed from shape definition
 * - Group rotates, mesh only offsets
 * - Local-space hierarchy via React nesting
 * 
 * Supports:
 * - Cube: orthogonal axes, 90° folds
 * - Pyramid: non-orthogonal edges, variable angles
 */
export function CubeFace({
  faceId,
  shapeType,
  edge,
  parentSize,
  size,
  color,
  foldProgress,
  children,
  showDebug = false,
}: CubeFaceProps) {
  // Get transform from shape definition
  const transform =
    edge && parentSize
      ? getShapeTransform(shapeType, edge, parentSize, size)
      : null;

  // Get fold angle from shape definition (not always 90°)
  const foldAngle = getShapeFoldAngle(shapeType, faceId, foldProgress);

  // Convert fold angle to rotation vector
  // For cube-like shapes, this is based on rotation axis
  // For non-orthogonal shapes, the fold angle already accounts for geometry
  const rotation: [number, number, number] = transform
    ? (() => {
        const rot: [number, number, number] = [0, 0, 0];
        const angle = foldAngle * transform.rotationSign;

        switch (transform.rotationAxis) {
          case "x":
            rot[0] = angle;
            break;
          case "y":
            rot[1] = angle;
            break;
          case "z":
            rot[2] = angle;
            break;
        }
        return rot;
      })()
    : [0, 0, 0];

  return (
    <group
      position={transform ? transform.pivot : [0, 0, 0]}
      rotation={rotation}
      name={`face-${faceId}`}
    >
      <group position={transform ? transform.offset : [0, 0, 0]}>
        <mesh name={`mesh-${faceId}`}>
          <planeGeometry args={size} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.8}
            transmission={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Child faces attach in this face's center space. */}
        {children}
      </group>

      {showDebug && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#ff00ff" />
        </mesh>
      )}
      {showDebug && <axesHelper args={[0.4]} />}
    </group>
  );
}
