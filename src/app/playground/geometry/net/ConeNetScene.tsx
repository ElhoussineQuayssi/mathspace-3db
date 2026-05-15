"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import Ruler from "@/app/playground/Ruler";
import * as THREE from "three";
import { NetFace } from "./NetFace";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const coneColors = {
  base: "#d97706",
  side: "#fbbf24",
};

function ConeLabels({
  radius,
  height,
  progress,
}: {
  radius: number;
  height: number;
  progress: number;
}) {
  const opacity = THREE.MathUtils.smoothstep(progress, 0.15, 0.95);
  const slantHeight = Math.sqrt(radius * radius + height * height);

  return (
    <group>
      <Html
        position={[0, -height / 2 - 0.2, radius + 0.15]}
        center
        distanceFactor={8}
        style={{ opacity: 1 - opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-amber-300 shadow-lg shadow-amber-500/20">
          r = {radius.toFixed(2)} m
        </div>
      </Html>
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={8}
        style={{ opacity: 1 - opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-amber-300 shadow-lg shadow-amber-500/20">
          l = {slantHeight.toFixed(2)} m
        </div>
      </Html>
      <Html
        position={[radius + 0.22, -height / 2, 0]}
        center
        distanceFactor={8}
        style={{ opacity: 1 - opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-amber-300 shadow-lg shadow-amber-500/20">
          h = {height.toFixed(2)} m
        </div>
      </Html>
    </group>
  );
}

function AnimatedConeNet({
  radius,
  height,
  progress,
}: {
  radius: number;
  height: number;
  progress: number;
}) {
  const slantHeight = Math.sqrt(radius * radius + height * height);
  const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);
  const basePosition = [
    0,
    THREE.MathUtils.lerp(slantHeight / 2 + radius, -height / 2, easedProgress),
    0,
  ] as [number, number, number];
  const baseRotation = [easedProgress * Math.PI / 2, 0, 0] as [number, number, number];

  return (
    <group>
      <ConeLateralSurface
        radius={radius}
        height={height}
        progress={easedProgress}
        color={coneColors.side}
      />

      <NetFace
        id="base"
        shape="circle"
        dimensions={{ radius }}
        color={coneColors.base}
        position={basePosition}
        rotation={baseRotation}
      />

      <ConeLabels radius={radius} height={height} progress={progress} />
    </group>
  );
}

function ConeLateralSurface({
  radius,
  height,
  progress,
  color,
}: {
  radius: number;
  height: number;
  progress: number;
  color: string;
}) {
  const geometry = React.useMemo(() => {
    const radialSegments = 16;
    const arcSegments = 96;
    const slantHeight = Math.sqrt(radius * radius + height * height);
    const sectorAngle = (2 * Math.PI * radius) / slantHeight;
    const flatOffsetY = -slantHeight / 2;
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let radialIndex = 0; radialIndex <= radialSegments; radialIndex += 1) {
      const radialRatio = radialIndex / radialSegments;
      const flatRadius = radialRatio * slantHeight;
      const foldedRadius = radialRatio * radius;
      const foldedY = height / 2 - radialRatio * height;

      for (let arcIndex = 0; arcIndex <= arcSegments; arcIndex += 1) {
        const arcRatio = arcIndex / arcSegments;
        const sectorTheta = -sectorAngle / 2 + sectorAngle * arcRatio;
        const coneTheta = -Math.PI + 2 * Math.PI * arcRatio;

        const flatX = flatRadius * Math.sin(sectorTheta);
        const flatY = flatRadius * Math.cos(sectorTheta) + flatOffsetY;
        const flatZ = 0;

        const foldedX = foldedRadius * Math.sin(coneTheta);
        const foldedZ = foldedRadius * Math.cos(coneTheta);

        vertices.push(
          THREE.MathUtils.lerp(flatX, foldedX, progress),
          THREE.MathUtils.lerp(flatY, foldedY, progress),
          THREE.MathUtils.lerp(flatZ, foldedZ, progress)
        );
      }
    }

    const rowLength = arcSegments + 1;
    for (let radialIndex = 0; radialIndex < radialSegments; radialIndex += 1) {
      for (let arcIndex = 0; arcIndex < arcSegments; arcIndex += 1) {
        const a = radialIndex * rowLength + arcIndex;
        const b = a + 1;
        const c = a + rowLength;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [radius, height, progress]);

  const boundaryGeometry = React.useMemo(() => {
    const arcSegments = 96;
    const slantHeight = Math.sqrt(radius * radius + height * height);
    const sectorAngle = (2 * Math.PI * radius) / slantHeight;
    const flatOffsetY = -slantHeight / 2;
    const points: THREE.Vector3[] = [];

    const getPoint = (radialRatio: number, arcRatio: number) => {
      const flatRadius = radialRatio * slantHeight;
      const foldedRadius = radialRatio * radius;
      const sectorTheta = -sectorAngle / 2 + sectorAngle * arcRatio;
      const coneTheta = -Math.PI + 2 * Math.PI * arcRatio;

      return new THREE.Vector3(
        THREE.MathUtils.lerp(
          flatRadius * Math.sin(sectorTheta),
          foldedRadius * Math.sin(coneTheta),
          progress
        ),
        THREE.MathUtils.lerp(
          flatRadius * Math.cos(sectorTheta) + flatOffsetY,
          height / 2 - radialRatio * height,
          progress
        ),
        THREE.MathUtils.lerp(0, foldedRadius * Math.cos(coneTheta), progress)
      );
    };

    for (let index = 0; index < arcSegments; index += 1) {
      points.push(getPoint(1, index / arcSegments), getPoint(1, (index + 1) / arcSegments));
    }
    points.push(getPoint(0, 0), getPoint(1, 0));
    points.push(getPoint(0, 1), getPoint(1, 1));

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius, height, progress]);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.84}
          transmission={0.8}
          side={THREE.DoubleSide}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>
      <lineSegments geometry={boundaryGeometry}>
        <lineBasicMaterial color="#ffffff" opacity={0.42} transparent />
      </lineSegments>
    </group>
  );
}

function ConeSceneContent({
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

  return <AnimatedConeNet radius={radius} height={height} progress={progress} />;
}

export function ConeNetScene({
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

      <ConeSceneContent radius={radius} height={height} showNet={showNet} />

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
