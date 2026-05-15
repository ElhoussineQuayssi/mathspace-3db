import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserBySession, type UserRecord, type UserRole } from "@/lib/db";

export const sessionCookieName = "mathspace_session";

export type CurrentUser = Pick<UserRecord, "id" | "name" | "role">;

export async function getCurrentSessionId() {
  return (await cookies()).get(sessionCookieName)?.value;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sessionId = await getCurrentSessionId();
  const user = getUserBySession(sessionId);

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();

  if (user.role !== role) redirect("/dashboard");

  return user;
}
