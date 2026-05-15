"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import Ruler from "@/app/playground/Ruler";
import * as THREE from "three";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const pyramidColors = {
  base: "#5eead4",
  face1: "#40e8d4",
  face2: "#2dd4bf",
  face3: "#14b8a6",
};

function PyramidLabels({
  base,
  depth,
  height,
  progress,
}: {
  base: number;
  depth: number;
  height: number;
  progress: number;
}) {
  const opacity = THREE.MathUtils.smoothstep(progress, 0.15, 0.95);

  return (
    <group>
      <Html
        position={[0, -depth / 3 - 0.2, 0.05]}
        center
        distanceFactor={8}
        style={{ opacity: 1 - opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-emerald-300 shadow-lg shadow-emerald-500/20">
          b = {base.toFixed(2)} m
        </div>
      </Html>
      <Html
        position={[base / 2 + 0.2, depth / 6, 0.05]}
        center
        distanceFactor={8}
        style={{ opacity: 1 - opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-violet-300 shadow-lg shadow-violet-500/20">
          w = {depth.toFixed(2)} m
        </div>
      </Html>
      <Html
        position={[0, 0, Math.max(0.05, height * progress)]}
        center
        distanceFactor={8}
        style={{ opacity: 1 - opacity, transition: "opacity 0.3s" }}
      >
        <div className="rounded-xl bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-cyan-300 shadow-lg shadow-cyan-500/20">
          h = {height.toFixed(2)} m
        </div>
      </Html>
    </group>
  );
}

type TriangleVertex = [number, number];

function distanceFromPointToLine(
  point: THREE.Vector2,
  start: THREE.Vector2,
  end: THREE.Vector2
) {
  const edge = new THREE.Vector2().subVectors(end, start);
  const toPoint = new THREE.Vector2().subVectors(point, start);
  return Math.abs(edge.x * toPoint.y - edge.y * toPoint.x) / edge.length();
}

function getApexDistance(vertex: THREE.Vector2, height: number) {
  return Math.hypot(vertex.x, vertex.y, height);
}

function usePyramidNet(base: number, depth: number, height: number) {
  return React.useMemo(() => {
    const a = new THREE.Vector2(-base / 2, -depth / 3);
    const b = new THREE.Vector2(base / 2, -depth / 3);
    const c = new THREE.Vector2(0, (2 * depth) / 3);
    const apexProjection = new THREE.Vector2(0, 0);

    const edges = [
      { id: "face1" as const, color: pyramidColors.face1, start: a, end: b },
      { id: "face2" as const, color: pyramidColors.face2, start: b, end: c },
      { id: "face3" as const, color: pyramidColors.face3, start: c, end: a },
    ];

    const sideFaces = edges.map((edge) => {
      const edgeVector = new THREE.Vector2().subVectors(edge.end, edge.start);
      const edgeLength = edgeVector.length();
      const startApexDistance = getApexDistance(edge.start, height);
      const endApexDistance = getApexDistance(edge.end, height);
      const apexX =
        (startApexDistance ** 2 - endApexDistance ** 2 + edgeLength ** 2) /
        (2 * edgeLength);
      const sideHeight = Math.sqrt(
        Math.max(0.0001, startApexDistance ** 2 - apexX ** 2)
      );
      const baseDistance = distanceFromPointToLine(
        apexProjection,
        edge.start,
        edge.end
      );

      return {
        id: edge.id,
        color: edge.color,
        start: edge.start,
        rotationZ: Math.atan2(edgeVector.y, edgeVector.x),
        edgeLength,
        apexX,
        sideHeight,
        foldAngle: Math.PI - Math.atan2(height, baseDistance),
      };
    });

    return {
      baseVertices: [
        [a.x, a.y],
        [b.x, b.y],
        [c.x, c.y],
      ] as TriangleVertex[],
      sideFaces,
    };
  }, [base, depth, height]);
}

function TriangleFace({
  id,
  vertices,
  color,
  label,
}: {
  id: string;
  vertices: TriangleVertex[];
  color: string;
  label?: string;
}) {
  const geometry = React.useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(vertices[0][0], vertices[0][1]);
    shape.lineTo(vertices[1][0], vertices[1][1]);
    shape.lineTo(vertices[2][0], vertices[2][1]);
    shape.lineTo(vertices[0][0], vertices[0][1]);

    const nextGeometry = new THREE.ShapeGeometry(shape);
    nextGeometry.computeVertexNormals();
    return nextGeometry;
  }, [vertices]);

  const edgeGeometry = React.useMemo(() => {
    const points = [
      new THREE.Vector3(vertices[0][0], vertices[0][1], 0),
      new THREE.Vector3(vertices[1][0], vertices[1][1], 0),
      new THREE.Vector3(vertices[1][0], vertices[1][1], 0),
      new THREE.Vector3(vertices[2][0], vertices[2][1], 0),
      new THREE.Vector3(vertices[2][0], vertices[2][1], 0),
      new THREE.Vector3(vertices[0][0], vertices[0][1], 0),
    ];

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [vertices]);

  const labelPosition = React.useMemo(
    () =>
      [
        (vertices[0][0] + vertices[1][0] + vertices[2][0]) / 3,
        (vertices[0][1] + vertices[1][1] + vertices[2][1]) / 3,
        0.05,
      ] as [number, number, number],
    [vertices]
  );

  return (
    <group name={`netface-${id}`}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.84}
          transmission={0.82}
          side={THREE.DoubleSide}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#ffffff" opacity={0.42} transparent />
      </lineSegments>
      {label && (
        <Html position={labelPosition} center distanceFactor={6}>
          <div className="rounded bg-slate-950/70 px-1.5 py-0.5 text-[8px] font-semibold text-white/60 shadow-lg">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function AnimatedPyramidNet({
  base,
  depth,
  height,
  progress,
}: {
  base: number;
  depth: number;
  height: number;
  progress: number;
}) {
  const { baseVertices, sideFaces } = usePyramidNet(base, depth, height);
  const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);

  return (
    <group>
      <TriangleFace
        id="base"
        vertices={baseVertices}
        color={pyramidColors.base}
        label="base"
      />

      {sideFaces.map((face) => (
        <group
          key={face.id}
          position={[face.start.x, face.start.y, 0]}
          rotation={[0, 0, face.rotationZ]}
        >
          <group rotation={[-face.foldAngle * easedProgress, 0, 0]}>
            <TriangleFace
              id={face.id}
              vertices={[
                [0, 0],
                [face.edgeLength, 0],
                [face.apexX, -face.sideHeight],
              ]}
              color={face.color}
              label={face.id}
            />
          </group>
        </group>
      ))}

      <PyramidLabels base={base} depth={depth} height={height} progress={progress} />
    </group>
  );
}

function PyramidSceneContent({
  base,
  depth,
  height,
  showNet,
}: {
  base: number;
  depth: number;
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

  return <AnimatedPyramidNet base={base} depth={depth} height={height} progress={progress} />;
}

export function TriangularPyramidNetScene({
  base,
  depth,
  height,
  showNet,
  showRuler,
  onRulerMeasure,
}: {
  base: number;
  depth: number;
  height: number;
  showNet: boolean;
  showRuler?: boolean;
  onRulerMeasure?: (d:number,a:THREE.Vector3,b:THREE.Vector3)=>void;
}) {
  const maxSize = Math.max(base, depth, height) * 2.6;
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

      <PyramidSceneContent base={base} depth={depth} height={height} showNet={showNet} />

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
