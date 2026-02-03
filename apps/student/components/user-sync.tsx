"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/database";
import { useEffect, useRef, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/sign-");
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary motion-reduce:animate-none" />
    </div>
  );
}

export function UserSync({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const upsertUser = useMutation(api.users.upsertFromClerk);
  const hasSynced = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Reset sync flag on logout
  useEffect(() => {
    if (!user) {
      hasSynced.current = false;
    }
  }, [user]);

  // Sync user to database on first load
  useEffect(() => {
    if (isLoaded && user && !hasSynced.current) {
      hasSynced.current = true;
      upsertUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
      }).catch((error) => {
        console.error("Student sync error:", error);
        if (error.message?.includes("admin")) {
          toast.error("This account is registered as an admin. You cannot use the student portal.");
          signOut({ redirectUrl: "/sign-in" });
        }
      });
    }
  }, [isLoaded, user, upsertUser, signOut]);

  // Redirect logged-out users away from protected routes
  useEffect(() => {
    if (isLoaded && !user && !isPublicPath(pathname)) {
      router.replace("/sign-in");
    }
  }, [isLoaded, user, pathname, router]);

  // CRITICAL: Check for suspended users and redirect - runs on every render
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (isPublicPath(pathname)) return;
    if (dbUser === undefined) return;

    // If user is suspended and NOT on suspended page, redirect immediately
    if (dbUser?.isSuspended === true) {
      if (pathname !== "/suspended") {
        router.replace("/suspended");
      }
      return;
    }

    // If user is NOT suspended but is on suspended page, redirect to dashboard
    if (dbUser && !dbUser.isSuspended && pathname === "/suspended") {
      router.replace("/dashboard");
      return;
    }

    // Onboarding check - only for non-suspended students
    if (
      pathname !== "/onboarding" &&
      dbUser &&
      dbUser.role === "student" &&
      !dbUser.batchId
    ) {
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get("ref");
      const org = searchParams.get("org");
      const params = new URLSearchParams();
      if (org) params.set("org", org);
      if (ref) params.set("ref", ref);
      const qs = params.toString();
      const onboardingUrl = qs ? `/onboarding?${qs}` : "/onboarding";
      router.replace(onboardingUrl);
    }
  }, [isLoaded, user, dbUser, pathname, router]);

  // Allow public pages, onboarding, and suspended to render immediately
  if (isPublicPath(pathname) || pathname === "/onboarding" || pathname === "/suspended") {
    return <>{children}</>;
  }

  // Show spinner while Clerk auth is loading
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  // User signed out on a protected route — spinner while redirect fires
  if (!user) {
    return <LoadingSpinner />;
  }

  // Wait for DB user to load
  if (dbUser === undefined) {
    return <LoadingSpinner />;
  }

  // User has no batch — spinner while redirect to onboarding fires
  if (dbUser && dbUser.role === "student" && !dbUser.batchId) {
    return <LoadingSpinner />;
  }

  // Suspended user — spinner while redirect fires
  if (dbUser?.isSuspended) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
