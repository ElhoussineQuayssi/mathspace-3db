/**
 * Universal Net Scene Component
 * Renders the patron (unfolded net) for any shape
 * Replaces shape-specific scene components with a generic, parameterized approach
 */

"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { NetFace } from "./NetFace";
import type { ShapeType } from "../shapes/shape-system";
import { getShapeDefinition } from "../shapes/shape-system";
// Import shape definitions to trigger registration
// (Quiz spatial questions currently use cube, but keep this comprehensive.)
import "../shapes/cube-definition";
import "../shapes/pyramid-definition";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Get face color for a shape
 */
function getFaceColor(shapeType: ShapeType, faceId: string): string {
  const colorMap: Record<ShapeType, Record<string, string>> = {
    cube: {
      front: "#8af5ff",
      back: "#75e6ff",
      top: "#4db0ff",
      bottom: "#67e9ff",
      left: "#69d9ff",
      right: "#5ec6ff",
    },
    pyramid: {
      base: "#5eead4",
      side1: "#40e8d4",
      side2: "#2dd4bf",
      side3: "#14b8a6",
    },
    cylinder: {
      side: "#8af5ff",
      top: "#4db0ff",
      bottom: "#67e9ff",
    },
    cone: {
      base: "#8af5ff",
      side: "#4db0ff",
    },
  };

  return colorMap[shapeType]?.[faceId] || "#8af5ff";
}

/**
 * Get shape geometry type for a face
 */
function getFaceGeometryType(
  shapeType: ShapeType,
  faceId: string
): "rect" | "circle" | "triangle" {
  if (shapeType === "cube") {
    return "rect";
  } else if (shapeType === "pyramid") {
    return faceId === "base" ? "triangle" : "triangle";
  } else if (shapeType === "cylinder") {
    return faceId === "side" ? "rect" : "circle";
  } else if (shapeType === "cone") {
    return faceId === "base" ? "circle" : "rect";
  }
  return "rect";
}

interface UniversalNetSceneProps {
  shapeType: ShapeType;
  shapeSize: Record<string, number>;
  showNet: boolean;
  onProgress?: (progress: number) => void;
}

function AnimatedNet({
  shapeType,
  shapeSize,
  showNet,
  onProgress,
}: {
  shapeType: ShapeType;
  shapeSize: Record<string, number>;
  showNet: boolean;
  onProgress?: (progress: number) => void;
}) {
  const [progress, setProgress] = React.useState(() => (showNet ? 0 : 1));

  useFrame((_, delta) => {
    const targetProgress = showNet ? 0 : 1;
    const speed = 2.5;

    setProgress((current) => {
      const direction = targetProgress - current;

      if (Math.abs(direction) <= 0.001) {
        return targetProgress;
      }

      const newProgress = clamp(
        current + Math.sign(direction) * delta * speed,
        Math.min(current, targetProgress),
        Math.max(current, targetProgress)
      );

      if (onProgress) {
        onProgress(newProgress);
      }

      return newProgress;
    });
  });

  // Shape definitions are registered via module side-effects (see imports below).
  // Still, guard against unexpected/unregistered shape types to avoid crashing the whole page.
  const definition = (() => {
    try {
      return getShapeDefinition(shapeType);
    } catch {
      return null;
    }
  })();

  if (!definition) {
    return (
      <group>
        {/* Fallback: render nothing instead of crashing */}
      </group>
    );
  }

  const { topology, netLayout, patronAngles, foldedAngles, getFaceSize } =
    definition;

  // Compute fold angles for all faces
  const foldAngles: Record<string, number> = {};
  Object.keys(patronAngles).forEach((faceId) => {
    const patron = patronAngles[faceId];
    const folded = foldedAngles[faceId];
    foldAngles[faceId] = patron + (folded - patron) * progress;
  });

  return (
    <group>
      {topology.map((node) => {
        const faceId = node.id;
        const [x, y] = netLayout[faceId] || [0, 0];
        const faceSize = getFaceSize(faceId, shapeSize);
        const [width, height] = faceSize;
        const geometryType = getFaceGeometryType(shapeType, faceId);

        let dimensions: Record<string, number>;
        if (geometryType === "rect") {
          dimensions = { width, height };
        } else if (geometryType === "circle") {
          dimensions = { radius: width / 2 };
        } else {
          dimensions = { base: width, height };
        }

        return (
          <NetFace
            key={faceId}
            id={faceId}
            shape={geometryType}
            dimensions={dimensions}
            color={getFaceColor(shapeType, faceId)}
            position={[x * 1.2, y * 1.2, 0]} // Slight spacing
            rotation={[0, 0, 0]}
            opacity={0.9}
            label={faceId}
          />
        );
      })}
    </group>
  );
}

export function UniversalNetScene({
  shapeType,
  shapeSize,
  showNet,
  onProgress,
}: UniversalNetSceneProps) {
  const maxSize =
    Math.max(
      shapeSize.width || shapeSize.size || 1,
      shapeSize.height || shapeSize.size || 1,
      shapeSize.depth || shapeSize.size || 1
    ) * 2.5;
  const cameraPosition = [maxSize, maxSize, maxSize] as [number, number, number];

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
      <OrbitControls makeDefault enablePan enableRotate enableZoom />

      <AnimatedNet
        shapeType={shapeType}
        shapeSize={shapeSize}
        showNet={showNet}
        onProgress={onProgress}
      />

      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.75}
        blur={2.4}
        far={4}
      />
    </Canvas>
  );
}
