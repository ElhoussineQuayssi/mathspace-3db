"use client";

import * as React from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";

export default function Ruler({
  enabled,
  onMeasure,
}: {
  enabled: boolean;
  onMeasure?: (distance: number, a: THREE.Vector3, b: THREE.Vector3) => void;
}) {
  const { gl, camera, scene, size } = useThree();
  const raycaster = React.useMemo(() => new THREE.Raycaster(), []);
  const [points, setPoints] = React.useState<THREE.Vector3[]>([]);
  const lineRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!enabled) {
      setPoints([]);
      if (onMeasure) onMeasure(0, new THREE.Vector3(), new THREE.Vector3());
    }
  }, [enabled, onMeasure]);

  React.useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!enabled) return;
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length === 0) return;
      const point = intersects[0].point.clone();

      setPoints((prev) => {
        const next = [...prev, point].slice(-2);
        if (next.length === 2) {
          const dist = next[0].distanceTo(next[1]);
          if (onMeasure) onMeasure(dist, next[0].clone(), next[1].clone());
        }
        return next;
      });
    }

    gl.domElement.addEventListener("pointerdown", onPointerDown);
    return () => gl.domElement.removeEventListener("pointerdown", onPointerDown);
  }, [enabled, gl, raycaster, camera, scene, onMeasure]);

  useFrame(() => {
    if (!lineRef.current?.geometry) return;
    const geometry = lineRef.current.geometry as THREE.BufferGeometry;
    const pts = geometry.attributes?.position as THREE.BufferAttribute | undefined;
    if (!pts) return;
    if (!points[0] || !points[1]) {
      pts.setXYZ(0, 0, 0, 0);
      pts.setXYZ(1, 0, 0, 0);
      pts.needsUpdate = true;
      return;
    }
    pts.setXYZ(0, points[0].x, points[0].y, points[0].z);
    pts.setXYZ(1, points[1].x, points[1].y, points[1].z);
    pts.needsUpdate = true;
  });

  const midpoint = points.length === 2 ? points[0].clone().add(points[1]).multiplyScalar(0.5) : null;
  const distance = points.length === 2 ? points[0].distanceTo(points[1]) : 0;

  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach={"position"}
            args={[new Float32Array([0, 0, 0, 0, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={enabled ? "#38bdf8" : "#ffffff"} linewidth={2} transparent opacity={0.95} />
      </line>

      {midpoint && (
        <Html position={midpoint as any} center distanceFactor={8}>
          <div className="rounded-md bg-slate-900/95 px-2 py-1 text-xs font-semibold text-cyan-200 shadow-lg">
            {distance.toFixed(3)} m
          </div>
        </Html>
      )}
    </group>
  );
}
