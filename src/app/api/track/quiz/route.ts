import { NextResponse } from "next/server";
import { recordQuizAttempt } from "@/lib/db";
import { getCurrentSessionId, getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [sessionId, user] = await Promise.all([getCurrentSessionId(), getCurrentUser()]);

  if (!sessionId || !user) {
    return new Response(null, { status: 204 });
  }

  const body = (await request.json().catch(() => null)) as {
    quizCategory?: string;
    score?: number;
    totalQuestions?: number;
    note?: number;
  } | null;

  recordQuizAttempt({
    userId: user.id,
    sessionId,
    quizCategory: body?.quizCategory ?? "",
    score: Number(body?.score ?? 0),
    totalQuestions: Number(body?.totalQuestions ?? 0),
    note: Number(body?.note ?? 0),
  });

  return NextResponse.json({ ok: true });
}
