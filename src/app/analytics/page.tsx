import { BarChart3, BookOpenCheck, Brain, Clock3, LineChart, TrendingUp, Users } from "lucide-react";
import { getAnalyticsSummary, type AnalyticsStudent } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";

const shapeLabels: Record<string, string> = {
  cylinder: "Cylindre",
  cone: "Cone",
  rectangle: "Rectangle",
  "triangular-pyramid": "Pyramide",
};

export default async function Analytics() {
  await requireRole("admin");
  const summary = getAnalyticsSummary();

  return (
    <div className="relative min-h-full overflow-hidden bg-slate-950 px-5 py-6 text-white sm:px-8 lg:px-10">
      <div className="relative mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                <LineChart className="h-3.5 w-3.5" />
                Analyses
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                Engagement reel de la classe.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Les noms, les temps par forme, le temps passe sur les patrons et les notes de quiz viennent de la base SQLite locale.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              <Kpi icon={Users} label="Eleves" value={String(summary.studentCount)} />
              <Kpi icon={TrendingUp} label="Moyenne" value={`${summary.averageQuiz}%`} />
              <Kpi icon={Clock3} label="Formes" value={`${summary.totalShapeMinutes}m`} />
              <Kpi icon={BookOpenCheck} label="Patrons" value={`${summary.totalPatronMinutes}m`} />
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-12">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl xl:col-span-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Concepts</p>
                <h2 className="mt-1 text-xl font-bold">Maitrise par notion</h2>
              </div>
              <Brain className="h-5 w-5 text-violet-200" />
            </div>
            <div className="space-y-5">
              {summary.concepts.map((concept) => (
                <div key={concept.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{concept.label}</span>
                    <span className="text-slate-400">{concept.value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${concept.color}`}
                      style={{ width: `${concept.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl xl:col-span-7">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Classe</p>
                <h2 className="mt-1 text-xl font-bold">Suivi des eleves</h2>
              </div>
              <BarChart3 className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-5 py-4 font-semibold">Nom</th>
                    <th className="px-5 py-4 font-semibold">Module focus</th>
                    <th className="px-5 py-4 font-semibold">Temps formes</th>
                    <th className="px-5 py-4 font-semibold">Patron</th>
                    <th className="px-5 py-4 font-semibold">Quiz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {summary.students.length > 0 ? (
                    summary.students.map((student) => <StudentRow key={student.id} student={student} />)
                  ) : (
                    <tr>
                      <td className="px-5 py-8 text-sm text-slate-400" colSpan={5}>
                        Aucun etudiant enregistre pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StudentRow({ student }: { student: AnalyticsStudent }) {
  const totalMinutes = Math.round((student.totalSeconds / 60) * 10) / 10;
  const patronMinutes = Math.round((student.patronSeconds / 60) * 10) / 10;
  const focus = shapeLabels[student.focus] ?? student.focus;

  return (
    <tr className="text-sm text-slate-300">
      <td className="px-5 py-4 font-semibold text-white">{student.name}</td>
      <td className="px-5 py-4">{focus}</td>
      <td className="px-5 py-4">{totalMinutes} min</td>
      <td className="px-5 py-4">{patronMinutes} min</td>
      <td className="px-5 py-4 font-semibold text-emerald-100">
        {student.quizAttempts > 0 ? `${student.quizAverage}%` : "Aucun"}
      </td>
    </tr>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
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
