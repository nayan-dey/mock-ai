"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/database";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertFromClerk);
  const hasSynced = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && user && !hasSynced.current) {
      hasSynced.current = true;
      upsertUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
      }).catch(console.error);
    }
  }, [isLoaded, user, upsertUser]);

  // Redirect to onboarding if user has no batch
  useEffect(() => {
    // Skip if not loaded yet, or on auth pages, or on onboarding page
    if (!isLoaded || !user) return;
    if (pathname.startsWith("/sign-") || pathname === "/onboarding") return;
    if (pathname === "/") return; // Don't redirect from landing page

    // If db user exists and has no batch, redirect to onboarding
    if (dbUser && dbUser.role === "student" && !dbUser.batchId) {
      router.push("/onboarding");
    }
  }, [isLoaded, user, dbUser, pathname, router]);

  return null;
}
