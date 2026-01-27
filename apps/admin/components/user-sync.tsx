"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@repo/database";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const upsertAsAdmin = useMutation(api.users.upsertAsAdmin);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !hasSynced.current) {
      hasSynced.current = true;
      upsertAsAdmin({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "Admin",
      }).catch((error) => {
        console.error("Admin sync error:", error);
        // If unauthorized, sign out and redirect
        if (error.message?.includes("Unauthorized")) {
          toast.error("You are not authorized to access the admin portal.");
          signOut().then(() => {
            router.push("/sign-in");
          });
        }
      });
    }
  }, [isLoaded, user, upsertAsAdmin, signOut, router]);

  return null;
}
