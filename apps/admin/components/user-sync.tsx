"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@repo/database";
import { useEffect, useRef } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const upsertAsAdmin = useMutation(api.users.upsertAsAdmin);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !hasSynced.current) {
      hasSynced.current = true;
      upsertAsAdmin({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "Admin",
      }).catch(console.error);
    }
  }, [isLoaded, user, upsertAsAdmin]);

  return null;
}
