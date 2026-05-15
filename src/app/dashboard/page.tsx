"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Clock3, Medal, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { type MouseEvent, useRef, useState, useEffect } from "react";
import type { Group, Mesh } from "three";
import { shapeDefinitions, type ShapeDefinition, type ShapeKind } from "@/lib/shape-data";
import { getUserDashboard, type UserDashboard } from "@/lib/db";
import { useRouter } from "next/navigation";

const shapes = shapeDefinitions;

const titleLetters = "MathSpace 3D".split("");

export default function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<UserDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          router.push("/");
          return;
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [router]);

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="relative min-h-full overflow-hidden bg-slate-950 px-5 py-6 text-white sm:px-8 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-12 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute right-[8%] top-44 h-80 w-80 rounded-full bg-violet-500/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-500/8 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-5">
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-xl sm:p-8 xl:col-span-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_88%_78%,rgba(168,85,247,0.16),transparent_30%)]" />
            <div className="absolute inset-y-0 right-0 w-full opacity-90 md:w-[48%]">
              <HeroScene />
            </div>

            <div className="relative z-10 flex h-full max-w-2xl flex-col justify-between gap-10">
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.45 }}
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Studio geometrique
                </motion.p>
                <motion.h1
                  aria-label="MathSpace 3D"
                  className="flex flex-wrap text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl"
                >
                  {titleLetters.map((letter, index) => (
                    <motion.span
                      key={`${letter}-${index}`}
                      initial={{ opacity: 0, y: 34, rotateX: -70 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{
                        delay: 0.18 + index * 0.035,
                        duration: 0.55,
                        ease: "easeOut",
                      }}
                      className={letter === " " ? "w-4 sm:w-5" : ""}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.68, duration: 0.45 }}
                  className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg"
                >
                  Un tableau de bord immersif pour suivre la progression, revenir aux formes importantes et entrer dans les modeles 3D en un geste.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.82, duration: 0.45 }}
                className="grid max-w-xl grid-cols-3 gap-3"
              >
                <Metric label="Formes" value={`${dashboardData.totalShapes}`} />
                <Metric label="Progression" value={`${dashboardData.overallProgress}%`} />
                <Metric label="Score moyen" value={`${dashboardData.averageQuizScore}%`} />
              </motion.div>
            </div>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
            <ProgressPanel
              icon={Trophy}
              label="Derniere forme"
              value={dashboardData.lastShape}
              detail={dashboardData.totalShapes > 0 ? `${dashboardData.overallProgress}% explore` : "Aucune forme commencée"}
              accent="text-cyan-200"
            />
            <ProgressPanel
              icon={BadgeCheck}
              label="Objectif du jour"
              value={`${dashboardData.totalQuizAttempts} quiz`}
              detail={dashboardData.totalQuizAttempts > 0 ? "Quiz en cours" : "Commencer un quiz"}
              accent="text-emerald-200"
            />
            <Link
              href="/leaderboard"
              className="group relative min-h-[170px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-amber-300/40 hover:bg-amber-300/10"
            >
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-300/10 blur-2xl transition group-hover:bg-cyan-300/15" />
              <Medal className="h-6 w-6 text-amber-200" />
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Leaderboard</p>
              <p className="mt-2 text-3xl font-black text-white">Classement</p>
              <p className="mt-2 text-sm text-slate-400">Voir le rang de la classe</p>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
            {dashboardData.shapeProgress.length > 0 ? (
              dashboardData.shapeProgress.map((shapeData, index) => {
                const shapeDefn = shapes.find((s) => s.kind === (shapeData.kind as ShapeKind));
                if (!shapeDefn) return null;
                return (
                  <ShapeCard
                    key={shapeData.kind}
                    shape={{
                      ...shapeDefn,
                      progress: shapeData.progress,
                      quizScore: shapeData.quizScore,
                    }}
                    index={index}
                  />
                );
              })
            ) : (
              <div className="col-span-full rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
                <p className="text-slate-400">Aucune forme commencée. Rendez-vous au terrain de jeu pour débuter!</p>
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:col-span-4"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Progression</p>
                <h2 className="mt-1 text-xl font-bold text-white">Parcours actuel</h2>
              </div>
              <Clock3 className="h-5 w-5 text-violet-200" />
            </div>
            <div className="space-y-4">
              {dashboardData.shapeProgress.length > 0 ? (
                dashboardData.shapeProgress.map((shapeData) => (
                  <div key={shapeData.kind}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-200">{shapeData.name}</span>
                      <span className="text-slate-400">{shapeData.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${shapeData.progress}%` }}
                        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${
                          shapes.find((s) => s.kind === (shapeData.kind as ShapeKind))?.accent ||
                          "from-cyan-300 to-blue-500"
                        }`}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucune progression à afficher</p>
              )}
            </div>
            <Link
              href="/quiz"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-200/40 hover:bg-cyan-300/10"
            >
              Ouvrir les quiz
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </section>
      </div>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 px-4 py-3 backdrop-blur-md">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ProgressPanel({
  icon: Icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="relative min-h-[170px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
    >
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl" />
      <Icon className={`h-6 w-6 ${accent}`} />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </motion.div>
  );
}

function ShapeCard({ shape, index }: { shape: ShapeDefinition; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });

  function handleMouseMove(event: MouseEvent<HTMLAnchorElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    rotateX.set(y * -10);
    rotateY.set(x * 10);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.1, duration: 0.5 }}
      style={{ perspective: 900 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
      >
        <Link
          href={`/playground?shape=${shape.kind}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="group relative block min-h-[380px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-slate-950/35 backdrop-blur-xl transition duration-300 hover:border-cyan-200/40"
        >
          <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${shape.accent} opacity-15 blur-3xl transition group-hover:opacity-25`} />
          <div className="relative h-44 overflow-hidden rounded-lg border border-white/10 bg-slate-950/55">
            <ShapePreview kind={shape.kind} active={isHovered} />
          </div>

          <div className="relative mt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Module 3D</p>
                <h3 className="mt-1 text-2xl font-bold text-white">{shape.name}</h3>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:text-cyan-200" />
            </div>
            <p className="mt-3 min-h-14 text-sm leading-6 text-slate-400">{shape.description}</p>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
              <span>Exploration</span>
              <span>{shape.progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${shape.progress}%` }}
                transition={{ delay: 0.35 + index * 0.1, duration: 0.75, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${shape.accent}`}
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2">
              <span className="text-xs text-slate-500">Quiz</span>
              <span className="text-sm font-semibold text-slate-100">{shape.quizScore}%</span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

function HeroScene() {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 5.2], fov: 45 }}>
      <PerspectiveCamera makeDefault position={[0, 0, 5.2]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 5, 5]} intensity={2.2} />
      <pointLight position={[-3, -2, 3]} intensity={3} color="#22d3ee" />
      <Float speed={1.7} rotationIntensity={0.75} floatIntensity={1.4}>
        <HeroGeometry />
      </Float>
    </Canvas>
  );
}

function HeroGeometry() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.18;
    meshRef.current.rotation.y += delta * 0.28;
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1.15, 0.32, 120, 16]} />
      <meshStandardMaterial color="#7dd3fc" metalness={0.5} roughness={0.22} emissive="#312e81" emissiveIntensity={0.38} />
    </mesh>
  );
}

function ShapePreview({ kind, active }: { kind: ShapeKind; active: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.1, 4.4], fov: 42 }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <pointLight position={[-2.5, 2, 2]} intensity={1.6} color="#a78bfa" />
      <Float speed={active ? 3 : 1.1} rotationIntensity={active ? 1.4 : 0.45} floatIntensity={active ? 1 : 0.45}>
        <PreviewGeometry kind={kind} active={active} />
      </Float>
    </Canvas>
  );
}

function PreviewGeometry({ kind, active }: { kind: ShapeKind; active: boolean }) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * (active ? 1.25 : 0.38);
    groupRef.current.rotation.x += delta * (active ? 0.34 : 0.08);
  });

  return (
    <group ref={groupRef}>
      {kind === "cylinder" && (
        <mesh>
          <cylinderGeometry args={[0.82, 0.82, 1.75, 64]} />
          <meshStandardMaterial color="#67e8f9" metalness={0.32} roughness={0.23} emissive="#155e75" emissiveIntensity={active ? 0.42 : 0.18} />
        </mesh>
      )}
      {kind === "cone" && (
        <mesh>
          <coneGeometry args={[1, 1.85, 64]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.28} roughness={0.25} emissive="#7f1d1d" emissiveIntensity={active ? 0.38 : 0.15} />
        </mesh>
      )}
      {kind === "rectangle" && <RectangularPrism active={active} />}
      {kind === "triangular-pyramid" && (
        <mesh rotation={[0, Math.PI / 5, 0]}>
          <coneGeometry args={[1.08, 1.85, 3]} />
          <meshStandardMaterial color="#5eead4" metalness={0.35} roughness={0.24} emissive="#064e3b" emissiveIntensity={active ? 0.42 : 0.18} />
        </mesh>
      )}
    </group>
  );
}

function RectangularPrism({ active }: { active: boolean }) {
  const gap = active ? 0.18 : 0.02;
  const width = 1.55;
  const height = 1.15;
  const depthSize = 1.05;
  const depth = 0.035;

  return (
    <group>
      <mesh position={[0, 0, depthSize / 2 + gap]}>
        <boxGeometry args={[width, height, depth]} />
        <CubeFaceMaterial active={active} />
      </mesh>
      <mesh position={[0, 0, -depthSize / 2 - gap]}>
        <boxGeometry args={[width, height, depth]} />
        <CubeFaceMaterial active={active} />
      </mesh>
      <mesh position={[width / 2 + gap, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[depthSize, height, depth]} />
        <CubeFaceMaterial active={active} />
      </mesh>
      <mesh position={[-width / 2 - gap, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[depthSize, height, depth]} />
        <CubeFaceMaterial active={active} />
      </mesh>
      <mesh position={[0, height / 2 + gap, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[width, depthSize, depth]} />
        <CubeFaceMaterial active={active} />
      </mesh>
      <mesh position={[0, -height / 2 - gap, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[width, depthSize, depth]} />
        <CubeFaceMaterial active={active} />
      </mesh>
    </group>
  );
}

function CubeFaceMaterial({ active }: { active: boolean }) {
  return (
    <meshStandardMaterial
      color="#67e8f9"
      metalness={0.35}
      roughness={0.24}
      emissive="#155e75"
      emissiveIntensity={active ? 0.45 : 0.2}
    />
  );
}
