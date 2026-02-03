"use client";

import { useState } from "react";
import { Loader2, BotMessageSquare, Sparkles } from "lucide-react";
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useUser } from "@clerk/nextjs";
import { ChatProvider, ChatThread } from "@/components/ai-chat";
import ExtractQuestionsPage from "@/app/(dashboard)/questions/extract/page";
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!convexUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
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
    <Tabs defaultValue="ask" className="flex h-full flex-col">
      <div className="shrink-0 flex items-center justify-center pt-3 px-4">
        <TabsList>
          <TabsTrigger value="ask" className="gap-1.5">
            <BotMessageSquare className="h-3.5 w-3.5" />
            Ask AI
          </TabsTrigger>
          <TabsTrigger value="extract" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Extract
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="ask"
        forceMount
        className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
      >
        <ChatProvider userId={convexUser._id}>
          <div className="h-full">
            <ChatThread />
          </div>
        </ChatProvider>
      </TabsContent>
      <TabsContent
        value="extract"
        forceMount
        className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden"
      >
        <ExtractQuestionsPage />
      </TabsContent>
    </Tabs>
  );
}
