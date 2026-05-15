"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import Ruler from "@/app/playground/Ruler";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { ShapeKind } from "@/lib/shape-data";

type SolidShapeSceneProps = {
  shape: Exclude<ShapeKind, "rectangle">;
  radius: number;
  base: number;
  depth: number;
  height: number;
};

const shapeMaterial: Record<SolidShapeSceneProps["shape"], { color: string; emissive: string }> = {
  cylinder: { color: "#67e8f9", emissive: "#155e75" },
  cone: { color: "#fbbf24", emissive: "#7f1d1d" },
  "triangular-pyramid": { color: "#5eead4", emissive: "#064e3b" },
};

export function SolidShapeScene({ shape, radius, base, depth, height, showRuler, onRulerMeasure }: SolidShapeSceneProps & { showRuler?: boolean; onRulerMeasure?: (d:number,a:THREE.Vector3,b:THREE.Vector3)=>void }) {
  const maxSize = Math.max(radius * 2, base, depth, height) * 2.6;
  const cameraPosition = [maxSize, maxSize * 0.85, maxSize] as [number, number, number];

  return (
    <Canvas
      shadows
      camera={{ position: cameraPosition, fov: 40 }}
      className="h-full w-full rounded-3xl bg-slate-950"
    >
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.58} />
      <directionalLight
        castShadow
        position={[5, 6, 5]}
        intensity={1.25}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, 3, 3]} intensity={1.5} color="#a78bfa" />
      <OrbitControls makeDefault enablePan enableRotate enableZoom />

      <AnimatedSolid shape={shape} radius={radius} base={base} depth={depth} height={height} />

      <Ruler enabled={!!showRuler} onMeasure={onRulerMeasure} />

      <ContactShadows
        position={[0, -height / 2 - 0.03, 0]}
        opacity={0.72}
        blur={2.5}
        far={5}
      />
    </Canvas>
  );
}

function AnimatedSolid({ shape, radius, base, depth, height }: SolidShapeSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = shapeMaterial[shape];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.28;
  });

  return (
    <group ref={groupRef}>
      {shape === "cylinder" && (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 72]} />
          <meshStandardMaterial color={material.color} metalness={0.32} roughness={0.22} emissive={material.emissive} emissiveIntensity={0.22} />
        </mesh>
      )}

      {shape === "cone" && (
        <mesh castShadow receiveShadow>
          <coneGeometry args={[radius, height, 72]} />
          <meshStandardMaterial color={material.color} metalness={0.28} roughness={0.24} emissive={material.emissive} emissiveIntensity={0.2} />
        </mesh>
      )}

      {shape === "triangular-pyramid" && (
        <mesh castShadow receiveShadow>
          <TriangularPyramidGeometry base={base} depth={depth} height={height} />
          <meshStandardMaterial color={material.color} metalness={0.34} roughness={0.25} emissive={material.emissive} emissiveIntensity={0.22} side={THREE.DoubleSide} />
        </mesh>
      )}

      <SolidLabels shape={shape} radius={radius} base={base} depth={depth} height={height} />
    </group>
  );
}

function SolidLabels({ shape, radius, base, depth, height }: SolidShapeSceneProps) {
  if (shape === "triangular-pyramid") {
    return (
      <>
        <SceneLabel position={[0, -height / 2 - 0.14, depth / 3]} color="text-emerald-100">
          b = {base.toFixed(2)} m
        </SceneLabel>
        <SceneLabel position={[base / 2 + 0.2, -height / 2, 0]} color="text-violet-100">
          w = {depth.toFixed(2)} m
        </SceneLabel>
        <SceneLabel position={[0, 0, 0]} color="text-cyan-100">
          h = {height.toFixed(2)} m
        </SceneLabel>
      </>
    );
  }

  return (
    <>
      <SceneLabel position={[radius + 0.22, -height / 2, 0]} color="text-cyan-100">
        r = {radius.toFixed(2)} m
      </SceneLabel>
      <SceneLabel position={[0, 0, radius + 0.24]} color="text-violet-100">
        h = {height.toFixed(2)} m
      </SceneLabel>
    </>
  );
}

function SceneLabel({
  position,
  color,
  children,
}: {
  position: [number, number, number];
  color: string;
  children: ReactNode;
}) {
  return (
    <Html position={position} center distanceFactor={8}>
      <div className={`rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold ${color} shadow-lg shadow-cyan-500/15`}>
        {children}
      </div>
    </Html>
  );
}

function TriangularPyramidGeometry({
  base,
  depth,
  height,
}: {
  base: number;
  depth: number;
  height: number;
}) {
  const geometry = useMemo(() => {
    const halfBase = base / 2;
    const floor = -height / 2;
    const apexY = height / 2;

    const vertices = new Float32Array([
      -halfBase,
      floor,
      -depth / 3,
      halfBase,
      floor,
      -depth / 3,
      0,
      floor,
      (2 * depth) / 3,
      0,
      apexY,
      0,
    ]);

    const indices = [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0];
    const nextGeometry = new THREE.BufferGeometry();

    nextGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    nextGeometry.setIndex(indices);
    nextGeometry.computeVertexNormals();

    return nextGeometry;
  }, [base, depth, height]);

  return <primitive object={geometry} attach="geometry" />;
}
