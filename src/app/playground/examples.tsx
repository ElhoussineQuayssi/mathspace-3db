/**
 * Example: Using the Multi-Shape System
 * 
 * This file demonstrates how to use the new architecture with different shapes.
 * Import SmartCube or UniversalNetScene with the shapeType parameter.
 */

import { SmartCube } from "@/app/playground/SmartCube";
import { UniversalNetScene } from "@/app/playground/geometry/net/UniversalNetScene";

/**
 * Example 1: Render a folding cube
 */
export function CubeExample() {
  return (
    <div className="h-96 w-full">
      <SmartCube
        shapeType="cube"
        width={2}
        height={2}
        depth={2}
        showNet={false}
      />
    </div>
  );
}

/**
 * Example 2: Render a folding pyramid
 */
export function PyramidExample() {
  return (
    <div className="h-96 w-full">
      <SmartCube
        shapeType="pyramid"
        width={2}
        height={2}
        depth={2}
        showNet={false}
      />
    </div>
  );
}

/**
 * Example 3: Render cube net (unfolded patron)
 */
export function CubeNetExample() {
  return (
    <div className="h-96 w-full">
      <UniversalNetScene
        shapeType="cube"
        shapeSize={{
          width: 1,
          height: 1,
          depth: 1,
        }}
        showNet={true}
      />
    </div>
  );
}

/**
 * Example 4: Render pyramid net (unfolded patron)
 */
export function PyramidNetExample() {
  return (
    <div className="h-96 w-full">
      <UniversalNetScene
        shapeType="pyramid"
        shapeSize={{
          size: 1,
        }}
        showNet={true}
      />
    </div>
  );
}

/**
 * Example 5: Interactive shape selector
 * 
 * You can add this to a page to let users switch between shapes.
 */
import { useState } from "react";

export function InteractiveShapeViewer() {
  const [shapeType, setShapeType] = useState<"cube" | "pyramid">("cube");
  const [showNet, setShowNet] = useState(false);

  const shapeSize: Record<string, number> = shapeType === "cube"
    ? { width: 2, height: 2, depth: 2 }
    : { size: 2 };

  return (
    <div className="flex flex-col gap-4 h-screen">
      <div className="p-4 bg-slate-900 rounded-lg">
        <div className="flex gap-4 items-center">
          <label className="text-white">Shape:</label>
          <select
            value={shapeType}
            onChange={(e) => setShapeType(e.target.value as "cube" | "pyramid")}
            className="px-3 py-2 bg-slate-800 text-white rounded"
          >
            <option value="cube">Cube</option>
            <option value="pyramid">Pyramid</option>
          </select>

          <label className="text-white ml-6">
            <input
              type="checkbox"
              checked={showNet}
              onChange={(e) => setShowNet(e.target.checked)}
              className="mr-2"
            />
            Show Net (Unfolded)
          </label>
        </div>
      </div>

      <div className="flex-1">
        {showNet ? (
          <UniversalNetScene
            shapeType={shapeType}
            shapeSize={shapeSize}
            showNet={true}
          />
        ) : (
          <SmartCube
            shapeType={shapeType}
            width={shapeSize.width || 2}
            height={shapeSize.height || 2}
            depth={shapeSize.depth || 2}
            showNet={false}
          />
        )}
      </div>

      <div className="p-4 bg-slate-900 rounded-lg text-white text-sm">
        <p className="mb-2">
          <strong>Current Shape:</strong> {shapeType}
        </p>
        <p className="mb-2">
          <strong>View Mode:</strong> {showNet ? "Net (Unfolded)" : "3D (Folded)"}
        </p>
        <p className="text-slate-400">
          {shapeType === "cube"
            ? "A cube has 6 rectangular faces that fold at 90° angles."
            : "A triangular pyramid has 4 triangular faces that fold at ~70.5° dihedral angles."}
        </p>
      </div>
    </div>
  );
}

/**
 * Example 6: Checking registered shapes programmatically
 */
export function ShapeRegistry() {
  // This is a server component that can access the registry
  // Note: The registry is populated by importing shape definitions

  return (
    <div className="p-4 bg-slate-900 text-white rounded-lg">
      <h3 className="text-lg font-bold mb-2">Available Shapes</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Cube</strong>: 6 rectangular faces, 90° orthogonal folds
        </li>
        <li>
          <strong>Pyramid</strong>: 4 triangular faces, ~70.5° dihedral folds
        </li>
        <li>
          <strong>Cylinder</strong>: 1 rectangular side + 2 circular bases (coming soon)
        </li>
        <li>
          <strong>Cone</strong>: 1 circular base + 1 sector side (coming soon)
        </li>
      </ul>
    </div>
  );
}

export default InteractiveShapeViewer;
