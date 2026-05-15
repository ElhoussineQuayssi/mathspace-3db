import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type UserRole = "admin" | "student";

export type UserRecord = {
  id: number;
  name: string;
  role: UserRole;
  created_at: string;
  last_seen_at: string;
};

export type SessionRecord = {
  id: string;
  user_id: number;
  started_at: string;
  ended_at: string | null;
};

export type AnalyticsStudent = {
  id: number;
  name: string;
  lastSeenAt: string;
  totalSeconds: number;
  patronSeconds: number;
  quizAverage: number;
  quizAttempts: number;
  focus: string;
};

export type AnalyticsSummary = {
  studentCount: number;
  averageQuiz: number;
  totalShapeMinutes: number;
  totalPatronMinutes: number;
  students: AnalyticsStudent[];
  concepts: {
    label: string;
    value: number;
    color: string;
  }[];
};

export type LeaderboardEntry = {
  rank: number;
  id: number;
  name: string;
  quizAverage: number;
  quizAttempts: number;
  totalSeconds: number;
  patronSeconds: number;
  score: number;
};

const dbPath = path.join(process.cwd(), "data", "mathspace.sqlite");

declare global {
  var mathspaceDb: DatabaseSync | undefined;
}

function getDatabase() {
  if (!globalThis.mathspaceDb) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    globalThis.mathspaceDb = new DatabaseSync(dbPath);
    globalThis.mathspaceDb.exec("PRAGMA journal_mode = WAL;");
    globalThis.mathspaceDb.exec("PRAGMA foreign_keys = ON;");
    migrate(globalThis.mathspaceDb);
  }

  return globalThis.mathspaceDb;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS shape_time (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      shape_kind TEXT NOT NULL,
      seconds_total INTEGER NOT NULL DEFAULT 0,
      patron_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, session_id, shape_kind)
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      quiz_category TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      note INTEGER NOT NULL,
      completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function findOrCreateUser(name: string, role: UserRole) {
  const db = getDatabase();
  const trimmedName = name.trim();
  const existing = db
    .prepare("SELECT * FROM users WHERE name = ?")
    .get(trimmedName) as UserRecord | undefined;

  if (existing) {
    db.prepare("UPDATE users SET role = ?, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      role,
      existing.id
    );
    return { ...existing, role };
  }

  const result = db.prepare("INSERT INTO users (name, role) VALUES (?, ?)").run(trimmedName, role);
  return db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as UserRecord;
}

export function createSession(userId: number) {
  const db = getDatabase();
  const id = crypto.randomUUID();

  db.prepare("INSERT INTO sessions (id, user_id) VALUES (?, ?)").run(id, userId);
  return db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionRecord;
}

export function endSession(sessionId: string) {
  const db = getDatabase();
  db.prepare("UPDATE sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ? AND ended_at IS NULL").run(
    sessionId
  );
}

export function getUserBySession(sessionId: string | undefined) {
  if (!sessionId) return null;

  const db = getDatabase();
  const row = db
    .prepare(
      `
      SELECT users.*
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.id = ? AND sessions.ended_at IS NULL
    `
    )
    .get(sessionId) as UserRecord | undefined;

  if (!row) return null;

  db.prepare("UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?").run(row.id);
  return row;
}

export function recordShapeTime({
  userId,
  sessionId,
  shapeKind,
  seconds,
  patronSeconds,
}: {
  userId: number;
  sessionId: string;
  shapeKind: string;
  seconds: number;
  patronSeconds: number;
}) {
  const db = getDatabase();
  const cleanSeconds = Math.max(0, Math.min(60 * 60, Math.round(seconds)));
  const cleanPatronSeconds = Math.max(0, Math.min(cleanSeconds, Math.round(patronSeconds)));

  if (!shapeKind || cleanSeconds <= 0) return;

  db.prepare(
    `
    INSERT INTO shape_time (user_id, session_id, shape_kind, seconds_total, patron_seconds)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, session_id, shape_kind)
    DO UPDATE SET
      seconds_total = seconds_total + excluded.seconds_total,
      patron_seconds = patron_seconds + excluded.patron_seconds,
      updated_at = CURRENT_TIMESTAMP
  `
  ).run(userId, sessionId, shapeKind, cleanSeconds, cleanPatronSeconds);
}

export function recordQuizAttempt({
  userId,
  sessionId,
  quizCategory,
  score,
  totalQuestions,
  note,
}: {
  userId: number;
  sessionId: string;
  quizCategory: string;
  score: number;
  totalQuestions: number;
  note: number;
}) {
  const db = getDatabase();

  if (!quizCategory || totalQuestions <= 0) return;

  db.prepare(
    `
    INSERT INTO quiz_attempts (user_id, session_id, quiz_category, score, total_questions, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(
    userId,
    sessionId,
    quizCategory,
    Math.max(0, Math.round(score)),
    Math.max(1, Math.round(totalQuestions)),
    Math.max(0, Math.min(100, Math.round(note)))
  );
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const db = getDatabase();
  const studentCount =
    ((db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get() as { count: number })
      ?.count ?? 0);
  const averageQuiz =
    ((
      db
        .prepare(
          `
          SELECT AVG(quiz_attempts.note) AS average
          FROM quiz_attempts
          JOIN users ON users.id = quiz_attempts.user_id
          WHERE users.role = 'student'
        `
        )
        .get() as { average: number | null }
    )?.average ?? 0);
  const totals = db
    .prepare(
      `
      SELECT SUM(shape_time.seconds_total) AS seconds, SUM(shape_time.patron_seconds) AS patron
      FROM shape_time
      JOIN users ON users.id = shape_time.user_id
      WHERE users.role = 'student'
    `
    )
    .get() as { seconds: number | null; patron: number | null };

  const students = db
    .prepare(
      `
      SELECT
        users.id,
        users.name,
        users.last_seen_at AS lastSeenAt,
        COALESCE(shape_totals.totalSeconds, 0) AS totalSeconds,
        COALESCE(shape_totals.patronSeconds, 0) AS patronSeconds,
        COALESCE(quiz_totals.quizAverage, 0) AS quizAverage,
        COALESCE(quiz_totals.quizAttempts, 0) AS quizAttempts
      FROM users
      LEFT JOIN (
        SELECT
          user_id,
          SUM(seconds_total) AS totalSeconds,
          SUM(patron_seconds) AS patronSeconds
        FROM shape_time
        GROUP BY user_id
      ) AS shape_totals ON shape_totals.user_id = users.id
      LEFT JOIN (
        SELECT
          user_id,
          AVG(note) AS quizAverage,
          COUNT(*) AS quizAttempts
        FROM quiz_attempts
        GROUP BY user_id
      ) AS quiz_totals ON quiz_totals.user_id = users.id
      WHERE users.role = 'student'
      ORDER BY users.last_seen_at DESC
    `
    )
    .all() as Omit<AnalyticsStudent, "focus">[];

  const focusRows = db
    .prepare(
      `
      SELECT shape_kind AS shapeKind, SUM(seconds_total) AS seconds
      FROM shape_time
      JOIN users ON users.id = shape_time.user_id
      WHERE users.role = 'student'
      GROUP BY shape_kind
      ORDER BY seconds DESC
    `
    )
    .all() as { shapeKind: string; seconds: number }[];

  const conceptRows = db
    .prepare(
      `
      SELECT quiz_category AS category, AVG(note) AS average
      FROM quiz_attempts
      JOIN users ON users.id = quiz_attempts.user_id
      WHERE users.role = 'student'
      GROUP BY quiz_category
    `
    )
    .all() as { category: string; average: number }[];

  return {
    studentCount,
    averageQuiz: Math.round(averageQuiz),
    totalShapeMinutes: Math.round(((totals.seconds ?? 0) / 60) * 10) / 10,
    totalPatronMinutes: Math.round(((totals.patron ?? 0) / 60) * 10) / 10,
    students: students.map((student) => ({
      ...student,
      totalSeconds: Number(student.totalSeconds),
      patronSeconds: Number(student.patronSeconds),
      quizAverage: Math.round(Number(student.quizAverage)),
      quizAttempts: Number(student.quizAttempts),
      focus: getStudentFocus(student.id),
    })),
    concepts: [
      {
        label: "Patrons",
        value:
          totals.seconds && totals.seconds > 0
            ? Math.round(((totals.patron ?? 0) / totals.seconds) * 100)
            : 0,
        color: "from-cyan-300 to-blue-500",
      },
      {
        label: "Formes",
        value: focusRows.length ? Math.min(100, Math.round(focusRows.length * 25)) : 0,
        color: "from-emerald-300 to-teal-500",
      },
      {
        label: "Quiz",
        value: Math.round(averageQuiz),
        color: "from-violet-300 to-fuchsia-500",
      },
      {
        label: "Volumes",
        value: Math.round(
          conceptRows.find((row) => row.category === "volumes")?.average ?? averageQuiz
        ),
        color: "from-amber-300 to-orange-500",
      },
    ],
  };
}

export function getLeaderboardEntries(): LeaderboardEntry[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT
        users.id,
        users.name,
        COALESCE(quiz_totals.quizAverage, 0) AS quizAverage,
        COALESCE(quiz_totals.quizAttempts, 0) AS quizAttempts,
        COALESCE(shape_totals.totalSeconds, 0) AS totalSeconds,
        COALESCE(shape_totals.patronSeconds, 0) AS patronSeconds
      FROM users
      LEFT JOIN (
        SELECT
          user_id,
          AVG(note) AS quizAverage,
          COUNT(*) AS quizAttempts
        FROM quiz_attempts
        GROUP BY user_id
      ) AS quiz_totals ON quiz_totals.user_id = users.id
      LEFT JOIN (
        SELECT
          user_id,
          SUM(seconds_total) AS totalSeconds,
          SUM(patron_seconds) AS patronSeconds
        FROM shape_time
        GROUP BY user_id
      ) AS shape_totals ON shape_totals.user_id = users.id
      WHERE users.role = 'student'
    `
    )
    .all() as Omit<LeaderboardEntry, "rank" | "score">[];

  return rows
    .map((row) => {
      const quizAverage = Math.round(Number(row.quizAverage));
      const totalSeconds = Number(row.totalSeconds);
      const patronSeconds = Number(row.patronSeconds);
      const quizAttempts = Number(row.quizAttempts);
      const explorationBonus = Math.min(20, Math.round(totalSeconds / 60));

      return {
        ...row,
        quizAverage,
        quizAttempts,
        totalSeconds,
        patronSeconds,
        score: quizAttempts > 0 ? Math.min(100, Math.round(quizAverage * 0.8 + explorationBonus)) : explorationBonus,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.quizAverage !== a.quizAverage) return b.quizAverage - a.quizAverage;
      return b.totalSeconds - a.totalSeconds;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function getStudentFocus(userId: number) {
  const db = getDatabase();
  const row = db
    .prepare(
      `
      SELECT shape_kind AS shapeKind
      FROM shape_time
      WHERE user_id = ?
      GROUP BY shape_kind
      ORDER BY SUM(seconds_total) DESC
      LIMIT 1
    `
    )
    .get(userId) as { shapeKind: string } | undefined;

  return row?.shapeKind ?? "Aucun module";
}

export type UserDashboard = {
  totalShapes: number;
  overallProgress: number;
  averageQuizScore: number;
  lastShape: string;
  totalQuizAttempts: number;
  shapeProgress: Array<{
    kind: string;
    name: string;
    progress: number;
    quizScore: number;
  }>;
};

export function getUserDashboard(userId: number): UserDashboard {
  const db = getDatabase();

  const shapeData = db
    .prepare(
      `
      SELECT DISTINCT shape_kind AS kind
      FROM shape_time
      WHERE user_id = ?
    `
    )
    .all(userId) as { kind: string }[];

  const shapeProgresses = db
    .prepare(
      `
      SELECT
        shape_kind AS kind,
        SUM(seconds_total) AS totalSeconds,
        SUM(patron_seconds) AS patronSeconds
      FROM shape_time
      WHERE user_id = ?
      GROUP BY shape_kind
    `
    )
    .all(userId) as { kind: string; totalSeconds: number; patronSeconds: number }[];

  const quizData = db
    .prepare(
      `
      SELECT
        quiz_category AS category,
        AVG(note) AS average,
        COUNT(*) AS attempts
      FROM quiz_attempts
      WHERE user_id = ?
      GROUP BY quiz_category
    `
    )
    .all(userId) as { category: string; average: number; attempts: number }[];

  const overallQuizAverage = db
    .prepare(
      `
      SELECT AVG(note) AS average
      FROM quiz_attempts
      WHERE user_id = ?
    `
    )
    .get(userId) as { average: number | null };

  const lastShapeRow = db
    .prepare(
      `
      SELECT shape_kind AS kind
      FROM shape_time
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `
    )
    .get(userId) as { kind: string } | undefined;

  const totalQuizAttempts = db
    .prepare(`SELECT COUNT(*) AS count FROM quiz_attempts WHERE user_id = ?`)
    .get(userId) as { count: number };

  const shapeProgressList = shapeProgresses.map((shape) => {
    const patronSeconds = shape.patronSeconds || 0;
    const totalSeconds = shape.totalSeconds || 0;
    const explorationProgress = Math.min(
      100,
      Math.round((totalSeconds / (60 * 10)) * 100)
    );
    const quizForShape = quizData.find((q) =>
      q.category.toLowerCase().includes(shape.kind.toLowerCase())
    );
    const quizScore = quizForShape
      ? Math.round(quizForShape.average)
      : 0;

    return {
      kind: shape.kind,
      name: getShapeDisplayName(shape.kind),
      progress: explorationProgress,
      quizScore,
    };
  });

  const totalProgress = shapeProgressList.length > 0
    ? Math.round(
        shapeProgressList.reduce((sum, s) => sum + s.progress, 0) /
          shapeProgressList.length
      )
    : 0;

  return {
    totalShapes: shapeProgressList.length,
    overallProgress: totalProgress,
    averageQuizScore: Math.round(overallQuizAverage.average ?? 0),
    lastShape: getShapeDisplayName(lastShapeRow?.kind ?? ""),
    totalQuizAttempts: totalQuizAttempts.count,
    shapeProgress: shapeProgressList,
  };
}

function getShapeDisplayName(kind: string): string {
  const names: Record<string, string> = {
    cylinder: "Cylindre",
    cone: "Cone",
    rectangle: "Rectangle",
    "triangular-pyramid": "Pyramide triangulaire",
  };
  return names[kind] ?? kind;
}
