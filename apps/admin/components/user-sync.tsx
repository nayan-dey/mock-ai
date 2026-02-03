"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/database";
import { useEffect, useRef, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/sign-");
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary motion-reduce:animate-none" />
    </div>
  );
}

export function UserSync({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const upsertAsAdmin = useMutation(api.users.upsertAsAdmin);
  const hasSynced = useRef(false);

  // Step 1: Check if user exists in Convex DB
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Step 2: Query org in parallel (uses clerkId, no need to wait for convexUser)
  const organization = useQuery(
    api.organizations.getByAdminClerkId,
    user?.id ? { adminClerkId: user.id } : "skip"
  );

  // Reset sync flag on logout
  useEffect(() => {
    if (!user) {
      hasSynced.current = false;
    }
  }, [user]);

  // Sync admin user to Convex
  useEffect(() => {
    if (isLoaded && user && !hasSynced.current) {
      hasSynced.current = true;
      upsertAsAdmin({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "Admin",
      }).catch((error) => {
        console.error("Admin sync error:", error);
        if (error.message?.includes("student")) {
          toast.error(
            "This account is registered as a student. You cannot use the admin portal."
          );
          signOut({ redirectUrl: "/sign-in" });
        }
      });
    }
  }, [isLoaded, user, upsertAsAdmin, signOut, router]);

  // Redirect logged-out users away from protected routes
  useEffect(() => {
    if (isLoaded && !user && !isPublicPath(pathname)) {
      router.replace("/sign-in");
    }
  }, [isLoaded, user, pathname, router]);

  // Organization onboarding check — no need to wait for convexUser
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (organization === undefined) return; // still loading
    if (isPublicPath(pathname)) return;

    if (!organization && pathname !== "/onboarding") {
      // No org — redirect to onboarding immediately
      router.replace("/onboarding");
    } else if (organization && pathname === "/onboarding") {
      // Has org — redirect away from onboarding
      router.replace("/dashboard");
    }
  }, [isLoaded, user, organization, pathname, router]);

  // Allow public pages and onboarding to render immediately
  if (isPublicPath(pathname) || pathname === "/onboarding") {
    return <>{children}</>;
  }

  // Show spinner while Clerk auth is loading
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  // User signed out on a protected route
  if (!user) {
    return <LoadingSpinner />;
  }

  // Wait for org query to resolve
  if (organization === undefined) {
    return <LoadingSpinner />;
  }

  // No org exists — spinner while redirect to /onboarding fires
  if (!organization) {
    return <LoadingSpinner />;
  }

  // Org exists but Convex user still syncing — wait for it
  if (!convexUser) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
