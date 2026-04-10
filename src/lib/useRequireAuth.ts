"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRequireAuth(redirectTo = "/sign-in") {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) router.replace(redirectTo);
  }, [isLoaded, userId, router, redirectTo]);

  return {
    isLoaded,
    isSignedIn: Boolean(userId),
  };
}
