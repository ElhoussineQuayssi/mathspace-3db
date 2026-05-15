import { NextResponse } from "next/server";
import { endSession } from "@/lib/db";
import { getCurrentSessionId, sessionCookieName } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const sessionId = await getCurrentSessionId();

  if (sessionId) {
    endSession(sessionId);
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.delete(sessionCookieName);

  return response;
}
