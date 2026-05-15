"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import Ruler from "@/app/playground/Ruler";
import * as THREE from "three";
import { NetFace } from "./NetFace";
import {
  getCylinderPatronAngles,
  getCylinderFoldedAngles,
  getNetFoldAngles,
} from "./net-fold";
import { getCircleFaceTransform, getNetRotation } from "./net-transforms";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const cylinderColors = {
  side: "#67e8f9",
  top: "#4db0ff",
  bottom: "#69d9ff",
};

function CylinderLabels({
  radius,
  height,
  progress,
}: {
  radius: number;
  height: number;
  progress: number;
}) {
  const opacity = THREE.MathUtils.smoothstep(progress, 0.15, 0.95);

  return (
    <group>
      <Html
        position={[0, -height / 2 - 0.2, radius + 0.15]}
        center
        distanceFactor={8}
        style={{ opacity: 1 - opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-cyan-100 shadow-lg shadow-cyan-500/20">
          r = {radius.toFixed(2)} m
        </div>
      </Html>
      <Html
        position={[0, height / 2 + 0.2, 0]}
        center
        distanceFactor={8}
        style={{ opacity: 1 - opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-cyan-100 shadow-lg shadow-cyan-500/20">
          h = {height.toFixed(2)} m
        </div>
      </Html>
    </group>
  );
}

function AnimatedCylinderNet({
  radius,
  height,
  progress,
}: {
  radius: number;
  height: number;
  progress: number;
}) {
  const foldAngles = getNetFoldAngles(
    getCylinderPatronAngles(),
    getCylinderFoldedAngles(),
    progress
  );

  const sideCircumference = 2 * Math.PI * radius;
  const topTransform = getCircleFaceTransform(
    "top",
    sideCircumference,
    height,
    radius
  );
  const bottomTransform = getCircleFaceTransform(
    "bottom",
    sideCircumference,
    height,
    radius
  );

  const topRotation = getNetRotation(
    topTransform.rotationAxis,
    foldAngles.top,
    topTransform.rotationSign
  );
  const bottomRotation = getNetRotation(
    bottomTransform.rotationAxis,
    foldAngles.bottom,
    bottomTransform.rotationSign
  );

  return (
    <group>
      <NetFace
        id="side"
        shape="rect"
        dimensions={{ width: sideCircumference, height }}
        color={cylinderColors.side}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />

      <group
        position={topTransform.pivot as [number, number, number]}
        rotation={topRotation}
      >
        <group position={topTransform.offset as [number, number, number]}>
          <NetFace
            id="top"
            shape="circle"
            dimensions={{ radius }}
            color={cylinderColors.top}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
          />
        </group>
      </group>

      <group
        position={bottomTransform.pivot as [number, number, number]}
        rotation={bottomRotation}
      >
        <group position={bottomTransform.offset as [number, number, number]}>
          <NetFace
            id="bottom"
            shape="circle"
            dimensions={{ radius }}
            color={cylinderColors.bottom}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
          />
        </group>
      </group>

      <CylinderLabels radius={radius} height={height} progress={progress} />
    </group>
  );
}

function CylinderSolid({
  radius,
  height,
  progress,
}: {
  radius: number;
  height: number;
  progress: number;
}) {
  const groupRef = React.useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.28;
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 72]} />
        <meshStandardMaterial
          color={cylinderColors.side}
          metalness={0.32}
          roughness={0.22}
          emissive="#155e75"
          emissiveIntensity={0.22}
        />
      </mesh>

      <CylinderLabels radius={radius} height={height} progress={progress} />
    </group>
  );
}

function CylinderSceneContent({
  radius,
  height,
  showNet,
}: {
  radius: number;
  height: number;
  showNet: boolean;
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

      return clamp(
        current + Math.sign(direction) * delta * speed,
        Math.min(current, targetProgress),
        Math.max(current, targetProgress)
      );
    });
  });

  return progress < 0.99 ? (
    <AnimatedCylinderNet radius={radius} height={height} progress={progress} />
  ) : (
    <CylinderSolid radius={radius} height={height} progress={progress} />
  );
}

export function CylinderNetScene({
  radius,
  height,
  showNet,
  showRuler,
  onRulerMeasure,
}: {
  radius: number;
  height: number;
  showNet: boolean;
  showRuler?: boolean;
  onRulerMeasure?: (d:number,a:THREE.Vector3,b:THREE.Vector3)=>void;
}) {
  const maxSize = Math.max(radius * 2, height) * 2.6;
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

      <CylinderSceneContent radius={radius} height={height} showNet={showNet} />

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