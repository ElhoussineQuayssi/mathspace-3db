"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Html } from "@react-three/drei";
import Ruler from "@/app/playground/Ruler";
import * as THREE from "three";
import { CubeFace, type FaceSize } from "./CubeFace";
import type { ShapeType, FaceNode, ShapeSize } from "./geometry/shapes/shape-system";
import { getShapeDefinition } from "./geometry/shapes/shape-system";
// Import all shape definitions to trigger registration
import "./geometry/shapes/cube-definition";
import "./geometry/shapes/pyramid-definition";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function EdgeLabels({
  width,
  height,
  depth,
  progress,
}: {
  width: number;
  height: number;
  depth: number;
  progress: number;
}) {
  const opacity = 1 - THREE.MathUtils.smoothstep(progress, 0.15, 0.95);

  return (
    <group>
      <Html
        position={[0, height / 2 + 0.15, depth / 2]}
        center
        distanceFactor={8}
        style={{ opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-cyan-100 shadow-lg shadow-cyan-500/20">
          L = {width.toFixed(2)} m
        </div>
      </Html>
      <Html
        position={[width / 2 + 0.15, 0, 0]}
        center
        distanceFactor={8}
        style={{ opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-amber-100 shadow-lg shadow-amber-500/20">
          h = {height.toFixed(2)} m
        </div>
      </Html>
      <Html
        position={[0, -height / 2 - 0.15, 0]}
        center
        distanceFactor={8}
        style={{ opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-violet-100 shadow-lg shadow-violet-500/20">
          w = {depth.toFixed(2)} m
        </div>
      </Html>
    </group>
  );
}

/**
 * Face color palette
 */
const faceColorsCube: Record<string, string> = {
  front: "#8af5ff",
  back: "#75e6ff",
  top: "#4db0ff",
  bottom: "#67e9ff",
  left: "#69d9ff",
  right: "#5ec6ff",
};

const faceColorsPyramid: Record<string, string> = {
  base: "#8af5ff",
  side1: "#4db0ff",
  side2: "#67e9ff",
  side3: "#69d9ff",
};

function getFaceColor(shapeType: ShapeType, faceId: string): string {
  if (shapeType === "cube") {
    return faceColorsCube[faceId] || "#8af5ff";
  } else if (shapeType === "pyramid") {
    return faceColorsPyramid[faceId] || "#8af5ff";
  }
  return "#8af5ff";
}

/**
 * Build component tree from topology for any shape
 * Creates proper parent-child nesting via React
 * Each face attached to another becomes its child
 */
function renderFaceTree(
  shapeType: ShapeType,
  node: FaceNode,
  foldAngles: Record<string, number>,
  showDebug: boolean,
  shapeSize: ShapeSize,
  topology: FaceNode[],
  parentSize?: FaceSize
): React.ReactNode {
  const definition = getShapeDefinition(shapeType);
  const faceId = node.id;
  const size = definition.getFaceSize(faceId, shapeSize);
  const children = topology.filter((n) => n.parent === faceId);

  // Get fold angle in radians, then normalize to 0-1 progress
  const foldAngleRadians = foldAngles[faceId] || 0;
  const maxFoldAngle = Math.PI / 2; // Default max fold angle
  const foldProgress = foldAngleRadians / maxFoldAngle;

  return (
    <CubeFace
      key={faceId}
      faceId={faceId}
      shapeType={shapeType}
      edge={node.attachEdge}
      parentSize={parentSize}
      size={size}
      color={getFaceColor(shapeType, faceId)}
      foldProgress={foldProgress}
      showDebug={showDebug}
    >
      {children.map((child) =>
        renderFaceTree(
          shapeType,
          child,
          foldAngles,
          showDebug,
          shapeSize,
          topology,
          size
        )
      )}
    </CubeFace>
  );
}

function AnimatedCube({
  width,
  height,
  depth,
  shapeType,
  showNet,
  showDebug,
}: {
  width: number;
  height: number;
  depth: number;
  shapeType: ShapeType;
  showNet: boolean;
  showDebug: boolean;
}) {
  const [progress, setProgress] = React.useState(() => (showNet ? 0 : 1));
  const shapeSize =
    shapeType === "cube"
      ? { width, height, depth, size: width }
      : { size: Math.min(width, height, depth) };

  const definition = getShapeDefinition(shapeType);
  const { topology, patronAngles, foldedAngles } = definition;

  // Interpolate between patron and folded angles
  const foldAngles: Record<string, number> = {};
  Object.keys(patronAngles).forEach((faceId) => {
    const patron = patronAngles[faceId];
    const folded = foldedAngles[faceId];
    foldAngles[faceId] = patron + (folded - patron) * progress;
  });

  useFrame((_, delta) => {
    const targetProgress = showNet ? 0 : 1;
    const speed = 2.5;

    setProgress((current) => {
      const direction = targetProgress - current;

      if (Math.abs(direction) <= 0.001) {
        return targetProgress;
      }

      return clamp(
        current + Math.sign(direction) * delta * speed,
        Math.min(current, targetProgress),
        Math.max(current, targetProgress)
      );
    });
  });

  // Find root node (no parent)
  const rootNode = topology.find((n) => !n.parent);
  if (!rootNode) {
    throw new Error(`No root node found in ${shapeType} topology`);
  }

  return (
    <group position={[0, 0, 0]}>
      {renderFaceTree(
        shapeType,
        rootNode,
        foldAngles,
        showDebug,
        shapeSize,
        topology
      )}

      <EdgeLabels
        width={width}
        height={height}
        depth={depth}
        progress={progress}
      />
    </group>
  );
}

export function SmartCube({
  width,
  height,
  depth,
  shapeType = "cube",
  showNet,
  showRuler,
  onRulerMeasure,
}: {
  width: number;
  height: number;
  depth: number;
  shapeType?: ShapeType;
  showNet: boolean;
  showRuler?: boolean;
  onRulerMeasure?: (d:number,a:THREE.Vector3,b:THREE.Vector3)=>void;
}) {
  const maxSize = Math.max(width, height, depth) * 2.5;
  const cameraPosition = [maxSize, maxSize, maxSize] as [number, number, number];
  const showDebug = false; // Set to true to see pivot and axes

  return (
    <Canvas
      shadows
      camera={{ position: cameraPosition, fov: 40 }}
      className="h-full w-full rounded-3xl bg-slate-950"
    >
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[5, 6, 5]}
        intensity={1.2}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <OrbitControls
        makeDefault
        enablePan
        enableRotate
        enableZoom
      />

      <AnimatedCube
        width={width}
        height={height}
        depth={depth}
        shapeType={shapeType}
        showNet={showNet}
        showDebug={showDebug}
      />

      <Ruler enabled={!!showRuler} onMeasure={onRulerMeasure} />

      <ContactShadows
        position={[0, -height / 2 - 0.03, 0]}
        opacity={0.75}
        blur={2.4}
        far={4}
      />
    </Canvas>
  );
}
