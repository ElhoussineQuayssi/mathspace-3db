"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type CurrentUser = {
  role: "admin" | "student";
};

const publicRoutes = new Set(["/"]);

export default function AuthGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (publicRoutes.has(pathname)) return;

    let isMounted = true;

    fetch("/api/me")
      .then((response) => response.json())
      .then((data: { user: CurrentUser | null }) => {
        if (!isMounted) return;

        if (!data.user) {
          router.replace("/");
          return;
        }

        if (pathname.startsWith("/analytics") && data.user.role !== "admin") {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        if (isMounted) router.replace("/");
      });

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  return null;
}
