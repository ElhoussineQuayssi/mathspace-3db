import { NextResponse } from "next/server";
import { createSession, findOrCreateUser, type UserRole } from "@/lib/db";
import { sessionCookieName } from "@/lib/session";

export const runtime = "nodejs";

const adminName = "PROF2121@";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 });
  }

  const role: UserRole = name === adminName ? "admin" : "student";
  const user = findOrCreateUser(name, role);
  const session = createSession(user.id);
  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    redirectTo: role === "admin" ? "/analytics" : "/dashboard",
  });

  response.cookies.set(sessionCookieName, session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
