"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Loader2 } from "lucide-react";
import { Button } from "@repo/ui";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useUser } from "@clerk/nextjs";
import { ChatProvider, ChatThread } from "@/components/ai-chat";
import { ChatSidebar } from "@/components/ai-chat/chat-sidebar";

export default function ChatPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  // Get Convex user
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const isLoading = !isClerkLoaded || (clerkUser && convexUser === undefined);

  const handleClose = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-100 dark:bg-stone-900">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!convexUser) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-900 p-4">
        <p className="text-stone-500">Unable to load user data</p>
        <Button variant="outline" onClick={handleClose} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <ChatProvider userId={convexUser._id}>
      <div className="fixed inset-0 z-[60] flex bg-stone-100 dark:bg-stone-900">
        {/* Sidebar */}
        <ChatSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userId={convexUser._id}
        />

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="flex h-14 shrink-0 items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-10 w-10 rounded-full bg-white dark:bg-stone-800 shadow-sm"
            >
              <Menu className="h-5 w-5 text-stone-600 dark:text-stone-300" />
              <span className="sr-only">Open menu</span>
            </Button>

            <span className="text-base font-medium text-stone-700 dark:text-stone-200">
              MockTest AI
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-10 w-10 rounded-full bg-white dark:bg-stone-800 shadow-sm"
            >
              <X className="h-5 w-5 text-stone-600 dark:text-stone-300" />
              <span className="sr-only">Close chat</span>
            </Button>
          </header>

          {/* Chat Thread */}
          <main className="flex-1 overflow-hidden">
            <ChatThread />
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}
