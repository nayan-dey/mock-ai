"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useUser } from "@clerk/nextjs";
import { ChatProvider, ChatThread } from "@/components/ai-chat";
import Link from "next/link";

export default function AskAIPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const isLoading = !isClerkLoaded || (clerkUser && convexUser === undefined);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!convexUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Unable to load user data</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">
            Go Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ChatProvider userId={convexUser._id}>
      <div className="h-[calc(100vh-4rem)]">
        <ChatThread />
      </div>
    </ChatProvider>
  );
}
