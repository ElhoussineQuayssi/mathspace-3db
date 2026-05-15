/**
 * Cube Animation Hook
 * Manages progress state and animation loop
 */

import { useState } from "react";
import { useFrame } from "@react-three/fiber";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function useCubeAnimation(shouldExpand: boolean) {
  const [progress, setProgress] = useState(() => (shouldExpand ? 1 : 0));

  useFrame((_, delta) => {
    const targetProgress = shouldExpand ? 1 : 0;
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

  return progress;
}
