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

  // Sync user to database on first load
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

  // CRITICAL: Check for suspended users and redirect - runs on every render
  useEffect(() => {
    // Skip if auth not loaded or no user
    if (!isLoaded || !user) return;

    // Skip auth pages
    if (pathname.startsWith("/sign-")) return;

    // Wait for db data
    if (dbUser === undefined) return;

    // If user is suspended and NOT on suspended page, redirect immediately
    if (dbUser?.isSuspended === true) {
      if (pathname !== "/suspended") {
        router.replace("/suspended");
      }
      return; // Don't run other checks for suspended users
    }

    // If user is NOT suspended but is on suspended page, redirect to home
    if (dbUser && !dbUser.isSuspended && pathname === "/suspended") {
      router.replace("/");
      return;
    }

    // Onboarding check - only for non-suspended students
    if (
      pathname !== "/onboarding" &&
      dbUser &&
      dbUser.role === "student" &&
      !dbUser.batchId
    ) {
      // Preserve ref param if present in current URL
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get("ref");
      const onboardingUrl = ref ? `/onboarding?ref=${ref}` : "/onboarding";
      router.push(onboardingUrl);
    }
  }, [isLoaded, user, dbUser, pathname, router]);

  return null;
}
