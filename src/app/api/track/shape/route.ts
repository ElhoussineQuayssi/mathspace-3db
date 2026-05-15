import { NextResponse } from "next/server";
import { recordShapeTime } from "@/lib/db";
import { getCurrentSessionId, getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [sessionId, user] = await Promise.all([getCurrentSessionId(), getCurrentUser()]);

  if (!sessionId || !user) {
    return new Response(null, { status: 204 });
  }

  const body = (await request.json().catch(() => null)) as {
    shapeKind?: string;
    seconds?: number;
    patronSeconds?: number;
  } | null;

  recordShapeTime({
    userId: user.id,
    sessionId,
    shapeKind: body?.shapeKind ?? "",
    seconds: Number(body?.seconds ?? 0),
    patronSeconds: Number(body?.patronSeconds ?? 0),
  });

  return NextResponse.json({ ok: true });
}
