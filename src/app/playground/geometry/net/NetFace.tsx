/**
 * Net Face Component
 * Renders individual flat faces in the patron (unfolded net) view
 * Supports rectangles, circles (discs), and triangles
 */
"use client";

import * as React from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

type NetShape = "rect" | "circle" | "triangle";

interface NetFaceProps {
  id: string;
  shape: NetShape;
  dimensions: Record<string, number>;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  opacity?: number;
  label?: string;
}

// Module-level cache for geometries to avoid re-creation each render
const geometryCache = new Map<string, THREE.BufferGeometry>();
const edgesGeometryCache = new Map<string, THREE.BufferGeometry>();

function getGeometryKey(shape: NetShape, dims: Record<string, number>): string {
  return `${shape}_${JSON.stringify(dims)}`;
}

function createGeometry(shape: NetShape, dimensions: Record<string, number>): THREE.BufferGeometry {
  const key = getGeometryKey(shape, dimensions);
  const cached = geometryCache.get(key);
  if (cached) return cached;

  let geom: THREE.BufferGeometry;
  switch (shape) {
    case "rect":
      geom = new THREE.PlaneGeometry(dimensions.width ?? 1, dimensions.height ?? 1);
      break;
    case "circle":
      geom = new THREE.CircleGeometry(dimensions.radius ?? 1, 64);
      break;
    case "triangle": {
      const base = dimensions.base ?? 1;
      const height = dimensions.height ?? 1;
      const shapePath = new THREE.Shape();
      shapePath.moveTo(-base / 2, -height / 2);
      shapePath.lineTo(base / 2, -height / 2);
      shapePath.lineTo(0, height / 2);
      shapePath.lineTo(-base / 2, -height / 2);
      geom = new THREE.ShapeGeometry(shapePath);
      break;
    }
  }

  geometryCache.set(key, geom);
  return geom;
}

function getOrCreateEdgesGeometry(shape: NetShape, dimensions: Record<string, number>): THREE.BufferGeometry {
  const key = `edges_${getGeometryKey(shape, dimensions)}`;
  const cached = edgesGeometryCache.get(key);
  if (cached) return cached;

  const geom = createGeometry(shape, dimensions);
  const edges = new THREE.EdgesGeometry(geom);
  edgesGeometryCache.set(key, edges);
  return edges;
}

export function NetFace({
  id,
  shape,
  dimensions,
  color,
  position,
  rotation,
  opacity = 0.82,
  label,
}: NetFaceProps) {
  const geometry = React.useMemo(() => createGeometry(shape, dimensions), [shape, dimensions]);
  const edgesGeom = React.useMemo(() => getOrCreateEdgesGeometry(shape, dimensions), [shape, dimensions]);

  return (
    <group position={position} rotation={rotation} name={`netface-${id}`}>
      {/* Main face mesh */}
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          transmission={0.85}
          side={THREE.DoubleSide}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      {/* Edge outline using EdgesGeometry with LineSegments */}
      <lineSegments geometry={edgesGeom}>
        <lineBasicMaterial color="#ffffff" opacity={0.35} transparent linewidth={1.5} />
      </lineSegments>

      {/* Label */}
      {label && (
        <Html position={[0, 0, 0.05]} center distanceFactor={6}>
          <div className="rounded bg-slate-950/70 px-1.5 py-0.5 text-[8px] font-semibold text-white/60 shadow-lg">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}