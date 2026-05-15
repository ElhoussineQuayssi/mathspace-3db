"use client";

import { motion } from "framer-motion";
import { Box, Layers3, Minus, Plus, Ruler } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SmartCube } from "@/app/playground/SmartCube";
import { SolidShapeScene } from "@/app/playground/SolidShapeScene";
import {
  getShapeDefinition,
  shapeDefinitions,
  shapeTags,
  type ShapeKind,
} from "@/lib/shape-data";

// Net scene imports
import { CylinderNetScene } from "@/app/playground/geometry/net/CylinderNetScene";
import { ConeNetScene } from "@/app/playground/geometry/net/ConeNetScene";
import { TriangularPyramidNetScene } from "@/app/playground/geometry/net/TriangularPyramidNetScene";

type DimensionKey = "length" | "width" | "height";
type Accent = "cyan" | "violet" | "emerald";

type DimensionConfig = {
  key: DimensionKey;
  label: string;
  axis: string;
  accent: Accent;
};

const dimensionControls: Record<ShapeKind, DimensionConfig[]> = {
  cylinder: [
    { key: "length", label: "Rayon", axis: "r", accent: "cyan" },
    { key: "height", label: "Hauteur", axis: "h", accent: "emerald" },
  ],
  cone: [
    { key: "length", label: "Rayon", axis: "r", accent: "cyan" },
    { key: "height", label: "Hauteur", axis: "h", accent: "emerald" },
  ],
  rectangle: [
    { key: "length", label: "Longueur", axis: "L", accent: "cyan" },
    { key: "width", label: "Profondeur", axis: "w", accent: "violet" },
    { key: "height", label: "Hauteur", axis: "h", accent: "emerald" },
  ],
  "triangular-pyramid": [
    { key: "length", label: "Base", axis: "b", accent: "cyan" },
    { key: "width", label: "Largeur base", axis: "w", accent: "violet" },
    { key: "height", label: "Hauteur", axis: "h", accent: "emerald" },
  ],
};

function clampDimension(value: number) {
  return Math.min(100, Math.max(10, value));
}

export function PlaygroundClient({ selectedShape }: { selectedShape?: string }) {
  const [lengthValue, setLengthValue] = useState(50);
  const [widthValue, setWidthValue] = useState(40);
  const [heightValue, setHeightValue] = useState(30);
  const [showNet, setShowNet] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);

  const shape = useMemo(() => getShapeDefinition(selectedShape), [selectedShape]);
  const trackingSegmentRef = useRef({
    startedAt: 0,
    shapeKind: shape.kind,
    patronActive: showNet,
  });
  const controls = dimensionControls[shape.kind];
  const isRectangle = shape.kind === "rectangle";

  const length = useMemo(() => Number((lengthValue / 25).toFixed(2)), [lengthValue]);
  const width = useMemo(() => Number((widthValue / 25).toFixed(2)), [widthValue]);
  const height = useMemo(() => Number((heightValue / 25).toFixed(2)), [heightValue]);
  const metrics = useMemo(
    () => getShapeMetrics(shape.kind, length, width, height),
    [shape.kind, length, width, height]
  );

  const controlState = {
    length: { value: lengthValue, meters: length, setValue: setLengthValue },
    width: { value: widthValue, meters: width, setValue: setWidthValue },
    height: { value: heightValue, meters: height, setValue: setHeightValue },
  };

  const sendShapeTime = useCallback((
    payload: { shapeKind: ShapeKind; seconds: number; patronSeconds: number },
    useBeacon = false
  ) => {
    if (payload.seconds < 1) return;

    const body = JSON.stringify(payload);

    if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/track/shape", new Blob([body], { type: "application/json" }));
      return;
    }

    fetch("/api/track/shape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  const flushTrackingSegment = useCallback((useBeacon = false) => {
    const now = Date.now();
    const segment = trackingSegmentRef.current;

    if (segment.startedAt === 0) {
      trackingSegmentRef.current = {
        ...segment,
        startedAt: now,
      };
      return;
    }

    const seconds = Math.round((now - segment.startedAt) / 1000);

    sendShapeTime(
      {
        shapeKind: segment.shapeKind,
        seconds,
        patronSeconds: segment.patronActive ? seconds : 0,
      },
      useBeacon
    );

    trackingSegmentRef.current = {
      ...segment,
      startedAt: now,
    };
  }, [sendShapeTime]);

  useEffect(() => {
    const now = Date.now();
    const previous = trackingSegmentRef.current;
    
    if (previous.startedAt === 0) {
      trackingSegmentRef.current = {
        startedAt: now,
        shapeKind: shape.kind,
        patronActive: showNet,
      };
      return;
    }

    const seconds = Math.round((now - previous.startedAt) / 1000);

    sendShapeTime({
      shapeKind: previous.shapeKind,
      seconds,
      patronSeconds: previous.patronActive ? seconds : 0,
    });

    trackingSegmentRef.current = {
      startedAt: now,
      shapeKind: shape.kind,
      patronActive: showNet,
    };
  }, [shape.kind, showNet, sendShapeTime]);

  useEffect(() => {
    const interval = window.setInterval(() => flushTrackingSegment(), 10000);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushTrackingSegment(true);
      }
    }

    function handleBeforeUnload() {
      flushTrackingSegment(true);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushTrackingSegment(true);
    };
  }, [flushTrackingSegment]);

  /**
   * Render the appropriate 3D scene based on shape kind and net toggle
   */
  function renderScene() {
    if (shape.kind === "rectangle") {
      // Cube has its own SmartCube implementation
      return (
        <SmartCube
          width={length}
          height={height}
          depth={width}
          showNet={showNet}
          showRuler={showRuler}
          onRulerMeasure={(d) => setMeasuredDistance(d)}
        />
      );
    }

    // Keep patron-capable scenes mounted so they can animate like the cube.
    if (shape.kind === "cylinder") {
      return (
        <CylinderNetScene
          radius={length}
          height={height}
          showNet={showNet}
          showRuler={showRuler}
          onRulerMeasure={(d) => setMeasuredDistance(d)}
        />
      );
    }
    if (shape.kind === "cone") {
      return (
        <ConeNetScene
          radius={length}
          height={height}
          showNet={showNet}
          showRuler={showRuler}
          onRulerMeasure={(d) => setMeasuredDistance(d)}
        />
      );
    }
    if (shape.kind === "triangular-pyramid") {
      return (
        <TriangularPyramidNetScene
          base={length}
          depth={width}
          height={height}
          showNet={showNet}
          showRuler={showRuler}
          onRulerMeasure={(d) => setMeasuredDistance(d)}
        />
      );
    }

    // Default: solid shape scene
    return (
      <SolidShapeScene
        shape={shape.kind}
        radius={length}
        base={length}
        depth={width}
        height={height}
        showRuler={showRuler}
        onRulerMeasure={(d) => setMeasuredDistance(d)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative h-full overflow-hidden bg-slate-950 text-white lg:flex"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-[520px] flex-1 flex-col p-4 sm:p-6">
        {/* Header section */}
        <div className="mb-4 flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              <Box className="h-3.5 w-3.5" />
              Terrain de jeu
            </p>
            <h1 className="mt-2 text-2xl font-black text-white">{shape.name} interactif</h1>
          </div>

          {/* Enhanced Shape Selector Buttons with refined styling */}
          <div className="flex flex-wrap gap-2.5">
            {shapeDefinitions.map((item) => (
              <Link
                key={item.kind}
                href={`/playground?shape=${item.kind}`}
                className={`
                  relative inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold
                  transition-all duration-300 ease-out overflow-hidden
                  border backdrop-blur-sm
                  ${
                    item.kind === shape.kind
                      ? "border-cyan-400/60 bg-gradient-to-br from-cyan-300/20 to-cyan-400/10 text-cyan-50 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-300/40"
                      : "border-white/15 bg-white/[0.05] text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/[0.08] hover:shadow-md hover:shadow-cyan-500/10 hover:scale-105"
                  }
                  group
                `}
              >
                {/* Animated background for active state */}
                {item.kind === shape.kind && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatType: "loop" }}
                    style={{ pointerEvents: "none" }}
                  />
                )}
                
                <span
                  className={`
                    h-2 w-2 rounded-full transition-all duration-300 flex-shrink-0
                    ${
                      item.kind === shape.kind
                        ? "bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                        : "bg-slate-500 group-hover:bg-cyan-400/70"
                    }
                  `}
                />
                <span className="relative z-10">{item.shortName}</span>
              </Link>
            ))}
          </div>

          {/* Shape Tags with enhanced styling */}
          <div className="flex gap-2 text-xs text-slate-400">
            {shapeTags[shape.kind].map((tag) => (
              <span
                key={tag}
                className="
                  rounded-xl border bg-slate-950/45 px-3 py-2
                  transition-all duration-300
                  border-slate-700/70 backdrop-blur-sm
                "
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 3D Scene Container */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-slate-950/50 backdrop-blur-sm">
          {renderScene()}
        </div>
      </div>

      {/* Controls Panel */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative w-full overflow-y-auto border-t border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl lg:w-[22rem] lg:border-l lg:border-t-0"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Parametres
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">Contrôles</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowRuler((s) => !s)}
            aria-pressed={showRuler}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
              showRuler ? "bg-cyan-400/10 border-cyan-300" : "bg-white/[0.03] border-white/10"
            }`}
            title="Toggle ruler tool"
          >
            <svg className="h-4 w-4 text-cyan-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21l18-18" />
              <path d="M7 3v4" />
              <path d="M11 3v2" />
              <path d="M15 3v3" />
              <path d="M19 3v1" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {controls.map((control) => {
            const state = controlState[control.key];

            return (
              <DimensionControl
                key={control.key}
                label={control.label}
                axis={control.axis}
                value={state.value}
                meters={state.meters}
                onChange={state.setValue}
                accent={control.accent}
              />
            );
          })}

          {/* Unified Patron/Net Toggle Button - available for all shapes */}
          {(isRectangle || shape.kind === "cylinder" || shape.kind === "cone" || shape.kind === "triangular-pyramid") && (
            <motion.button
              type="button"
              onClick={() => setShowNet((prev) => !prev)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className={`
                relative w-full overflow-hidden rounded-lg p-4 text-sm font-semibold
                transition-all duration-500 ease-out
                border backdrop-blur-sm
                group
                ${
                  showNet
                    ? "bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border-emerald-400/50 text-emerald-100 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-300/40"
                    : "border-white/15 bg-white/[0.05] text-slate-300 hover:border-emerald-400/40 hover:bg-emerald-500/5 hover:text-emerald-100 hover:shadow-lg hover:shadow-emerald-500/10"
                }
              `}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: showNet ? 360 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                >
                  {showNet ? (
                    <Layers3 className="h-4 w-4" />
                  ) : (
                    <Box className="h-4 w-4" />
                  )}
                </motion.div>
                <span>{showNet ? "Masquer le patron" : "Afficher le patron"}</span>
              </div>
              
              {/* Animated shimmer effect on active state */}
              {showNet && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                  style={{ pointerEvents: "none" }}
                />
              )}
            </motion.button>
          )}

          {/* Formula Card - Enhanced Design */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative overflow-hidden rounded-xl border border-cyan-500/25 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-0 shadow-2xl shadow-cyan-500/15 backdrop-blur-lg"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 opacity-30">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10"
                animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 p-5">
              {/* Header */}
              <div className="mb-5 flex items-center justify-between gap-3 pb-4 border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/50">
                    <motion.svg
                      className="h-4 w-4 text-cyan-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, repeatType: "loop" }}
                    >
                      <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" />
                    </motion.svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">
                      Formules Mathématiques
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-400">Calculs en direct</p>
                  </div>
                </div>
                <motion.div
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 ring-1 ring-emerald-400/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-200">Actif</span>
                </motion.div>
              </div>

              {/* Main Formulas */}
              <div className="mb-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Équations</p>
                <div className="space-y-2">
                  {metrics.formulas.map((formula, idx) => (
                    <motion.div
                      key={formula}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="rounded-lg border border-cyan-500/15 bg-slate-950/40 px-3.5 py-2.5 font-mono text-base text-cyan-100 backdrop-blur-sm"
                      style={{ textShadow: "0 0 8px rgba(34,211,238,0.25)" }}
                    >
                      {formula}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Variables */}
              <div className="mb-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Variables</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {metrics.variables.map((variable, idx) => (
                    <motion.div
                      key={variable}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + idx * 0.08 }}
                      className="rounded-md bg-gradient-to-r from-slate-800/50 to-slate-950/50 px-3 py-1.5 font-mono text-xs text-slate-200"
                    >
                      {variable}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Derivation */}
              {metrics.derivation && (
                <div className="mb-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Dérivation</p>
                  <div className="space-y-2 rounded-lg border border-violet-500/15 bg-slate-950/40 p-3 backdrop-blur-sm">
                    {metrics.derivation.map((line, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
                        className="font-mono text-xs leading-relaxed text-violet-100"
                      >
                        {line}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ruler Measurement - Enhanced */}
              {measuredDistance !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="mb-4 overflow-hidden rounded-lg border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-400/5 p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-orange-500/15">
                    <Ruler className="h-4 w-4 text-orange-300" />
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-300">Mesure</p>
                  </div>
                  <p className="mt-2 font-mono text-sm text-orange-100">
                    <span className="text-slate-300">Distance = </span>
                    <span className="font-bold text-orange-300">{measuredDistance.toFixed(3)} m</span>
                  </p>
                </motion.div>
              )}

              {/* Results - Volume and Surface */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Résultats</p>
                <div className="grid gap-2.5">
                  {/* Volume */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-400/5 p-3.5 backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
                      />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">Volume</p>
                      <p className="font-mono text-lg font-bold text-cyan-300">
                        {metrics.volume.toFixed(3)} <span className="text-xs text-slate-400">m³</span>
                      </p>
                    </div>
                  </motion.div>

                  {/* Surface */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-400/5 p-3.5 backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-300/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", delay: 0.5 }}
                      />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">Surface</p>
                      <p className="font-mono text-lg font-bold text-violet-300">
                        {metrics.surface.toFixed(3)} <span className="text-xs text-slate-400">m²</span>
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getShapeMetrics(kind: ShapeKind, length: number, width: number, height: number) {
  if (kind === "cylinder") {
    return {
      volume: Math.PI * length ** 2 * height,
      surface: 2 * Math.PI * length * (length + height),
      formulas: ["V = π × r² × h", "S = 2πr(r + h)"],
      variables: [`r = ${length.toFixed(2)} m`, `h = ${height.toFixed(2)} m`],
      derivation: [
        `V = π × r² × h = π × (${length.toFixed(2)})² × (${height.toFixed(2)}) = ${(Math.PI * length ** 2 * height).toFixed(3)} m³`,
        `S = 2πr(r + h) = 2π × (${length.toFixed(2)}) × (${(length + height).toFixed(2)}) = ${(2 * Math.PI * length * (length + height)).toFixed(3)} m²`,
      ],
    };
  }

  if (kind === "cone") {
    const slantHeight = Math.sqrt(length ** 2 + height ** 2);

    return {
      volume: (Math.PI * length ** 2 * height) / 3,
      surface: Math.PI * length * (length + slantHeight),
      formulas: ["V = (π × r² × h) / 3", "S = πr(r + s)"],
      variables: [`r = ${length.toFixed(2)} m`, `h = ${height.toFixed(2)} m`, `s = ${slantHeight.toFixed(2)} m`],
      derivation: [
        `V = (π × r² × h) / 3 = (π × (${length.toFixed(2)})² × (${height.toFixed(2)})) / 3 = ${(Math.PI * length ** 2 * height / 3).toFixed(3)} m³`,
        `s = √(r² + h²) = √(${length.toFixed(2)}² + ${height.toFixed(2)}²) = ${slantHeight.toFixed(3)} m`,
        `S = πr(r + s) = π × (${length.toFixed(2)}) × (${(length + slantHeight).toFixed(2)}) = ${(Math.PI * length * (length + slantHeight)).toFixed(3)} m²`,
      ],
    };
  }

  if (kind === "triangular-pyramid") {
    const baseArea = (length * width) / 2;
    const surface = getTriangularPyramidSurface(length, width, height);

    return {
      volume: (baseArea * height) / 3,
      surface,
      formulas: ["A_base = (b × w) / 2", "V = (A_base × h) / 3"],
      variables: [`b = ${length.toFixed(2)} m`, `w = ${width.toFixed(2)} m`, `h = ${height.toFixed(2)} m`],
      derivation: [
        `A_base = (b × w) / 2 = (${length.toFixed(2)}) × (${width.toFixed(2)}) / 2 = ${baseArea.toFixed(3)} m²`,
        `V = (A_base × h) / 3 = (${baseArea.toFixed(3)}) × (${height.toFixed(2)}) / 3 = ${((baseArea * height) / 3).toFixed(3)} m³`,
        `Surface (approx) = ${surface.toFixed(3)} m²`,
      ],
    };
  }

  return {
    volume: length * width * height,
    surface: 2 * (length * width + length * height + width * height),
    formulas: ["V = L × w × h", "S = 2(L × w + L × h + w × h)"],
    variables: [`L = ${length.toFixed(2)} m`, `w = ${width.toFixed(2)} m`, `h = ${height.toFixed(2)} m`],
    derivation: [
      `V = L × w × h = ${length.toFixed(2)} × ${width.toFixed(2)} × ${height.toFixed(2)} = ${(length * width * height).toFixed(3)} m³`,
      `S = 2(L × w + L × h + w × h) = 2(${(length * width).toFixed(3)} + ${(length * height).toFixed(3)} + ${(width * height).toFixed(3)}) = ${(2 * (length * width + length * height + width * height)).toFixed(3)} m²`,
    ],
  };
}

function getTriangularPyramidSurface(base: number, depth: number, height: number) {
  const a = [-base / 2, -height / 2, -depth / 3] as const;
  const b = [base / 2, -height / 2, -depth / 3] as const;
  const c = [0, -height / 2, (2 * depth) / 3] as const;
  const apex = [0, height / 2, 0] as const;

  return (
    triangleArea(a, b, c) +
    triangleArea(a, apex, b) +
    triangleArea(b, apex, c) +
    triangleArea(c, apex, a)
  );
}

function triangleArea(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  c: readonly [number, number, number]
) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cross = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];

  return Math.hypot(cross[0], cross[1], cross[2]) / 2;
}

function DimensionControl({
  label,
  axis,
  value,
  meters,
  onChange,
  accent,
}: {
  label: string;
  axis: string;
  value: number;
  meters: number;
  onChange: (value: number) => void;
  accent: Accent;
}) {
  const accentClasses = {
    cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    violet: "border-violet-300/25 bg-violet-300/10 text-violet-100",
    emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  }[accent];

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="rounded-xl border border-white/10 bg-slate-950/55 px-4 py-3.5 shadow-lg shadow-slate-950/25 backdrop-blur-sm"
    >
      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => onChange(clampDimension(value - 5))}
          className={`
            grid h-10 w-10 place-items-center rounded-lg border transition
            ${accent.replace("text-", "border-").replace("-100", "-25/70")} 
            bg-white/[0.04] text-slate-200 
            hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100
          `}
          aria-label={`Reduce ${label.toLowerCase()}`}
        >
          <Minus className="h-4 w-4" />
        </motion.button>

        <div className="min-w-0 text-center">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`rounded-md border px-2 py-1 text-[11px] font-black tracking-wide ${accentClasses}`}
            >
              {axis}
            </span>
            <span className="truncate text-sm font-semibold text-slate-300">{label}</span>
          </div>
          <div className="mt-1 flex items-end justify-center gap-1">
            <span className="text-2xl font-black leading-none text-white">{meters.toFixed(2)}</span>
            <span className="pb-0.5 text-xs font-semibold text-slate-400">m</span>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => onChange(clampDimension(value + 5))}
          className={`
            grid h-10 w-10 place-items-center rounded-lg border transition
            ${accent.replace("text-", "border-").replace("-100", "-25/70")} 
            bg-white/[0.04] text-slate-200 
            hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100
          `}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
