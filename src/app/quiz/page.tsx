"use client";

import { motion } from "framer-motion";
import { Award, CheckCircle2, Clock3, HelpCircle, Target, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { categories, getQuestionsByCategory, type QuizCategory, type QuizQuestion } from "@/lib/quiz-data";

export default function Quiz() {
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory>("shapes");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, string>>({});

  const questions = getQuestionsByCategory(selectedCategory);
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answersByQuestion[currentQuestion.id] ?? null : null;
  const selected = currentQuestion?.answers.find((answer) => answer.id === selectedAnswer);
  const categoryInfo = categories.find((c) => c.id === selectedCategory);
  const scores = useMemo(() => {
    return categories.reduce(
      (acc, category) => {
        const categoryQuestions = getQuestionsByCategory(category.id);
        const total = categoryQuestions.filter((question) => answersByQuestion[question.id]).length;
        const correct = categoryQuestions.reduce((count, question) => {
          const answerId = answersByQuestion[question.id];
          const answer = question.answers.find((item) => item.id === answerId);
          return count + (answer?.isCorrect ? 1 : 0);
        }, 0);

        acc[category.id] = { correct, total };
        return acc;
      },
      {} as Record<QuizCategory, { correct: number; total: number }>
    );
  }, [answersByQuestion]);

  function handleAnswer(answerId: string) {
    if (!currentQuestion || answersByQuestion[currentQuestion.id]) return;

    const nextAnswers = {
      ...answersByQuestion,
      [currentQuestion.id]: answerId,
    };

    setAnswersByQuestion(nextAnswers);

    const categoryQuestions = getQuestionsByCategory(selectedCategory);
    const answeredCount = categoryQuestions.filter((question) => nextAnswers[question.id]).length;

    if (answeredCount !== categoryQuestions.length) return;

    const correct = categoryQuestions.reduce((count, question) => {
      const savedAnswer = nextAnswers[question.id];
      const answer = question.answers.find((item) => item.id === savedAnswer);
      return count + (answer?.isCorrect ? 1 : 0);
    }, 0);
    const note = Math.round((correct / categoryQuestions.length) * 100);

    fetch("/api/track/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizCategory: selectedCategory,
        score: correct,
        totalQuestions: categoryQuestions.length,
        note,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCategoryChange = (category: QuizCategory) => {
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
  };

  const categoryScore = scores[selectedCategory];
  const totalQuestions = questions.length;
  const answeredQuestions = categoryScore.total;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="relative min-h-full overflow-hidden bg-slate-950 px-5 py-6 text-white sm:px-8 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-16 top-10 h-72 w-72 rounded-full bg-violet-500/12 blur-3xl" />
        <div className="absolute bottom-10 left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-5 xl:grid-cols-12">
        {/* Category Navigation */}
        <div className="xl:col-span-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid gap-3 sm:grid-cols-3"
          >
            {categories.map((category, index) => {
              const isSelected = selectedCategory === category.id;
              const navScore = scores[category.id];
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.35 }}
                  onClick={() => handleCategoryChange(category.id)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden rounded-lg border backdrop-blur-xl transition ${
                    isSelected
                      ? "border-cyan-300/60 shadow-lg shadow-cyan-500/20"
                      : "border-white/10 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-white/10"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                          backgroundClip: "padding-box",
                        }
                      : {}
                  }
                >
                  {/* Gradient background overlay for selected state */}
                  {isSelected && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-85 -z-10`}
                    />
                  )}
                  <div className="relative z-10 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="text-left flex-1">
                        <p className={`font-bold text-sm ${isSelected ? "text-white drop-shadow-md" : "text-white"}`}>
                          {category.name}
                        </p>
                        <p className={`text-xs ${isSelected ? "text-white/80" : "text-slate-300"}`}>
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className={`mt-3 text-right text-xs font-semibold ${isSelected ? "text-white drop-shadow-md" : "text-cyan-200"}`}>
                      {navScore.correct}/{navScore.total} réponses
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Main Quiz Section */}
        <motion.section
          key={`${selectedCategory}-${currentQuestionIndex}`}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8 xl:col-span-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-100">
                <HelpCircle className="h-3.5 w-3.5" />
                {categoryInfo?.name || "Quiz"}
              </p>
              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                {categoryInfo?.description}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Question {currentQuestionIndex + 1} sur {totalQuestions}
              </p>
            </div>
            <div className="grid min-w-48 grid-cols-2 gap-3">
              <Stat
                icon={Target}
                label="Précision"
                value={categoryScore.total > 0 ? `${Math.round((categoryScore.correct / categoryScore.total) * 100)}%` : "—"}
              />
              <Stat icon={Clock3} label="Répondus" value={`${answeredQuestions}/${totalQuestions}`} />
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-white/10 bg-slate-950/55 p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Question {currentQuestionIndex + 1}</p>
                <h2 className="mt-2 text-2xl font-bold">{currentQuestion?.question}</h2>
              </div>
              <Award className="h-6 w-6 text-cyan-200" />
            </div>

            <div className="grid gap-3">
              {currentQuestion?.answers.map((answer) => {
                const isSelected = selectedAnswer === answer.id;
                const showCorrect = isSelected && answer.isCorrect;
                const showWrong = isSelected && !answer.isCorrect;

                return (
                  <motion.button
                    key={answer.id}
                    type="button"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAnswer(answer.id)}
                    disabled={selectedAnswer !== null}
                    className={`flex items-center justify-between rounded-lg border px-4 py-4 text-left transition ${
                      showCorrect
                        ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-50"
                        : showWrong
                          ? "border-rose-300/50 bg-rose-300/10 text-rose-50"
                          : isSelected
                            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-50"
                            : "border-white/10 bg-white/[0.035] text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-300/10"
                    } ${selectedAnswer !== null ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="text-sm font-semibold sm:text-base">{answer.label}</span>
                    {showCorrect && <CheckCircle2 className="h-5 w-5" />}
                    {showWrong && <XCircle className="h-5 w-5" />}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-5 min-h-12 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-slate-300">
              {selected ? (
                selected.isCorrect ? (
                  <span className="text-emerald-200">✓ {currentQuestion?.feedback.correct}</span>
                ) : (
                  <span className="text-rose-200">✗ {currentQuestion?.feedback.incorrect}</span>
                )
              ) : (
                "Choisissez une réponse pour obtenir un feedback immédiat."
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-6 flex gap-3">
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </motion.button>
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null || currentQuestionIndex === questions.length - 1}
                className="ml-auto flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <section className="grid gap-5 xl:col-span-4">
          {categories.map((category, index) => {
            const categoryStats = scores[category.id];
            const percentage =
              categoryStats.total > 0 ? Math.round((categoryStats.correct / categoryStats.total) * 100) : 0;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.45 }}
                className={`rounded-lg border p-5 transition ${
                  selectedCategory === category.id
                    ? "border-cyan-300/50 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.04]"
                } backdrop-blur-xl`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{category.name}</p>
                    <h3 className="mt-1 font-bold text-white">{category.description}</h3>
                  </div>
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Progression</span>
                      <span className="font-semibold text-white">{percentage}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.25 + index * 0.1, duration: 0.75, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${category.color}`}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-cyan-200">
                    {categoryStats.correct}/{categoryStats.total}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </section>
      </div>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
      <Icon className="h-5 w-5 text-cyan-200" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
