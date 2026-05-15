import { Award, BarChart3, Medal, Sparkles, Trophy } from "lucide-react";
import { getLeaderboardEntries, type LeaderboardEntry } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

export default async function Leaderboard() {
  const user = await requireUser();
  const entries = getLeaderboardEntries();
  const topThree = entries.slice(0, 3);
  const currentEntry = entries.find((entry) => entry.id === user.id);

  return (
    <div className="relative min-h-full overflow-hidden bg-slate-950 px-5 py-6 text-white sm:px-8 lg:px-10">
      <div className="relative mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                <Trophy className="h-3.5 w-3.5" />
                Leaderboard
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                Classement de la classe.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Le score combine les notes de quiz et un bonus d&apos;exploration des formes. Les etudiants et l&apos;admin voient le meme classement.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Kpi icon={Medal} label="Votre rang" value={currentEntry ? `#${currentEntry.rank}` : "-"} />
              <Kpi icon={Award} label="Score" value={currentEntry ? `${currentEntry.score}%` : "-"} />
              <Kpi icon={BarChart3} label="Eleves" value={String(entries.length)} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          {topThree.map((entry) => (
            <PodiumCard key={entry.id} entry={entry} isCurrentUser={entry.id === user.id} />
          ))}
          {topThree.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400 backdrop-blur-xl lg:col-span-3">
              Aucun etudiant dans le classement pour le moment.
            </div>
          )}
        </section>

        <section className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Classement</p>
              <h2 className="mt-1 text-xl font-bold">Tous les etudiants</h2>
            </div>
            <Sparkles className="h-5 w-5 text-cyan-200" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-5 py-4 font-semibold">Rang</th>
                  <th className="px-5 py-4 font-semibold">Nom</th>
                  <th className="px-5 py-4 font-semibold">Score</th>
                  <th className="px-5 py-4 font-semibold">Quiz</th>
                  <th className="px-5 py-4 font-semibold">Exploration</th>
                  <th className="px-5 py-4 font-semibold">Patron</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <LeaderboardRow key={entry.id} entry={entry} isCurrentUser={entry.id === user.id} />
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-8 text-sm text-slate-400" colSpan={6}>
                      Terminez un quiz ou explorez une forme pour lancer le classement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function PodiumCard({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const rankLabel = entry.rank === 1 ? "Champion" : entry.rank === 2 ? "Deuxieme" : "Troisieme";

  return (
    <div
      className={`rounded-lg border p-5 backdrop-blur-xl ${
        isCurrentUser
          ? "border-cyan-300/50 bg-cyan-300/10"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{rankLabel}</p>
          <h3 className="mt-2 text-2xl font-black text-white">{entry.name}</h3>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-lg border border-amber-300/25 bg-amber-300/10 text-lg font-black text-amber-100">
          #{entry.rank}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <MiniMetric label="Score" value={`${entry.score}%`} />
        <MiniMetric label="Quiz" value={`${entry.quizAverage}%`} />
        <MiniMetric label="Temps" value={`${formatMinutes(entry.totalSeconds)}m`} />
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  return (
    <tr className={`text-sm ${isCurrentUser ? "bg-cyan-300/10 text-cyan-50" : "text-slate-300"}`}>
      <td className="px-5 py-4 font-black text-white">#{entry.rank}</td>
      <td className="px-5 py-4 font-semibold text-white">{entry.name}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-cyan-300" style={{ width: `${entry.score}%` }} />
          </div>
          <span className="font-bold text-amber-100">{entry.score}%</span>
        </div>
      </td>
      <td className="px-5 py-4">{entry.quizAttempts > 0 ? `${entry.quizAverage}% (${entry.quizAttempts})` : "Aucun"}</td>
      <td className="px-5 py-4">{formatMinutes(entry.totalSeconds)} min</td>
      <td className="px-5 py-4">{formatMinutes(entry.patronSeconds)} min</td>
    </tr>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Medal;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-20 rounded-lg border border-white/10 bg-slate-950/45 p-3">
      <Icon className="h-4 w-4 text-cyan-200" />
      <p className="mt-2 text-[11px] text-slate-500">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function formatMinutes(seconds: number) {
  return String(Math.round((seconds / 60) * 10) / 10);
}
