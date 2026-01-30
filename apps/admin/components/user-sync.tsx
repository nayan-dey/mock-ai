"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/database";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const upsertAsAdmin = useMutation(api.users.upsertAsAdmin);
  const hasSynced = useRef(false);

  const organization = useQuery(
    api.organizations.getByAdminClerkId,
    user?.id ? { adminClerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && user && !hasSynced.current) {
      hasSynced.current = true;
      upsertAsAdmin({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "Admin",
      }).catch((error) => {
        console.error("Admin sync error:", error);
        if (error.message?.includes("Unauthorized")) {
          toast.error("You are not authorized to access the admin portal.");
          signOut().then(() => {
            router.push("/sign-in");
          });
        }
      });
    }
  }, [isLoaded, user, upsertAsAdmin, signOut, router]);

  // Organization onboarding check
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (organization === undefined) return;

    if (pathname.startsWith("/sign-")) return;

    if (!organization && pathname !== "/onboarding") {
      router.push("/onboarding");
    } else if (organization && pathname === "/onboarding") {
      router.push("/dashboard");
    }
  }, [isLoaded, user, organization, pathname, router]);

  return null;
}
