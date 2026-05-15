"use client";

import { motion } from "framer-motion";
import { ArrowRight, LogIn, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Entrez votre nom pour continuer.");
      return;
    }

    setIsLoading(true);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cleanName }),
    });

    const data = (await response.json().catch(() => null)) as {
      redirectTo?: string;
      error?: string;
    } | null;

    setIsLoading(false);

    if (!response.ok) {
      setError(data?.error ?? "Connexion impossible pour le moment.");
      return;
    }

    router.push(data?.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.98),rgba(8,47,73,0.72),rgba(4,120,87,0.55)),url('/globe.svg')] bg-[length:cover,460px] bg-[position:center,right_8%_center] bg-no-repeat opacity-95" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.18),rgba(14,116,144,0.16),rgba(15,23,42,0.42))]" />

      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Bienvenue
          </p>
          <h1 className="mt-6 text-5xl font-black leading-[0.96] sm:text-6xl lg:text-7xl">
            MathSpace 3D
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            Entrez dans une plateforme de geometrie interactive pour explorer les solides, ouvrir les patrons et valider les acquis avec des quiz.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55 }}
          onSubmit={handleSubmit}
          className="w-full rounded-lg border border-white/10 bg-slate-950/72 p-5 shadow-2xl shadow-slate-950/45 backdrop-blur-xl sm:p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Connexion
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">Entrer dans la plateforme</h2>
            </div>
            <LogIn className="h-5 w-5 text-cyan-200" />
          </div>

          <label htmlFor="name" className="text-sm font-semibold text-slate-300">
            Nom
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 text-base font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/55 focus:bg-cyan-300/10"
            placeholder="Votre nom"
          />

          {error && (
            <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.form>
      </section>
    </main>
  );
}
