"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Home,
  LogOut,
  Medal,
  Play,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SidebarItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  detail: string;
  adminOnly?: boolean;
};

type CurrentUser = {
  id: number;
  name: string;
  role: "admin" | "student";
};

const sidebarItems: SidebarItem[] = [
  { name: "Tableau de bord", href: "/dashboard", icon: Home, detail: "Vue generale" },
  { name: "Terrain de jeu", href: "/playground", icon: Play, detail: "Solides interactifs" },
  { name: "Zone de quiz", href: "/quiz", icon: BookOpen, detail: "Defis rapides" },
  { name: "Leaderboard", href: "/leaderboard", icon: Medal, detail: "Classement" },
  { name: "Analyses", href: "/analytics", icon: BarChart3, detail: "Suivi de classe", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/me")
      .then((response) => response.json())
      .then((data: { user: CurrentUser | null }) => {
        if (isMounted) setUser(data.user);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const visibleItems = useMemo(
    () => sidebarItems.filter((item) => !item.adminOnly || user?.role === "admin"),
    [user?.role]
  );

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (pathname === "/" || !user) {
    return null;
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 84 : 292 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="relative z-20 flex min-h-screen shrink-0 flex-col overflow-hidden border-r border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-slate-950/60 backdrop-blur-xl md:translate-y-0 md:static"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-16 right-0 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative flex items-center justify-between gap-3 p-4">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setIsCollapsed(false)}
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
            <Sparkles className="h-5 w-5 text-cyan-200" />
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                className="min-w-0"
              >
                <p className="text-lg font-black leading-tight">MathSpace 3D</p>
                <p className="text-xs text-slate-500">Studio de geometrie</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>


        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsCollapsed((value) => !value)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-slate-200 shadow-lg shadow-slate-950/30 transition hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100"
          aria-label={isCollapsed ? "Ouvrir la sidebar" : "Masquer la sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </motion.button>
      </div>

      <nav className="relative flex-1 px-3 py-3">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`relative flex min-h-14 items-center overflow-hidden rounded-lg px-3 transition-colors duration-200 ${
                    isActive ? "text-cyan-50" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  } ${isCollapsed ? "justify-center" : "gap-3"}`}
                >
                  {isActive && (
                    <>
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-lg border border-cyan-300/15 bg-cyan-300/10"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                      <motion.div
                        layoutId="sidebar-active-rail"
                        className="absolute bottom-2 left-0 top-2 w-1 rounded-r bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.65)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    </>
                  )}
                  <item.icon className="relative z-10 h-5 w-5 shrink-0" />
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="relative z-10 min-w-0"
                      >
                        <span className="block truncate text-sm font-semibold">{item.name}</span>
                        <span className="block truncate text-xs text-slate-500">{item.detail}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative p-3">
        <AnimatePresence initial={false} mode="wait">
          {isCollapsed ? (
            <motion.div
              key="compact"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="grid gap-2"
            >
              <MiniStat icon={Activity} value="64%" />
              <MiniStat icon={GraduationCap} value="12" />
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Session</p>
                  <p className="mt-1 text-lg font-bold">{user.name}</p>
                  <p className="text-xs text-slate-500">
                    {user.role === "admin" ? "Administrateur" : "Etudiant"}
                  </p>
                </div>
                <GraduationCap className="h-5 w-5 text-emerald-200" />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "64%" }}
                  transition={{ duration: 0.75, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Role</p>
                  <p className="font-bold text-cyan-100">
                    {user.role === "admin" ? "Prof" : "Eleve"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Session</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-bold text-emerald-100 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-50 active:scale-95"
                  >
                    <LogOut className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                    Deconnexion
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

function MiniStat({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div className="grid h-14 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-center">
      <Icon className="h-4 w-4 text-cyan-200" />
      <span className="text-[10px] font-semibold text-slate-400">{value}</span>
    </div>
  );
}
