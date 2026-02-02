"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClerkUser = any;

export function useCurrentUser(): {
  clerkUser: ClerkUser;
  dbUser: ReturnType<typeof useQuery<typeof api.users.getByClerkId>>;
  isLoading: boolean;
} {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  const dbUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const isLoading = !isClerkLoaded || (!!clerkUser && dbUser === undefined);

  return { clerkUser, dbUser, isLoading };
}
