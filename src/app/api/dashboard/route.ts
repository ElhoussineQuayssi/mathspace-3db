import { getCurrentUser } from "@/lib/session";
import { getUserDashboard } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const dashboardData = getUserDashboard(user.id);

  return new Response(JSON.stringify(dashboardData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
