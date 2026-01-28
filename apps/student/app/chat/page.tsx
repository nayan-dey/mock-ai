"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, cn } from "@repo/ui";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useUser } from "@clerk/nextjs";
import { ChatProvider, ChatThread } from "@/components/ai-chat";
import Link from "next/link";

export default function ChatPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect keyboard using visualViewport API
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const keyboardOpen = viewport.height < window.innerHeight * 0.75;
      setIsKeyboardOpen(keyboardOpen);
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  // Get Convex user
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const isLoading = !isClerkLoaded || (clerkUser && convexUser === undefined);

  if (isLoading) {
    return (
      <div className={cn("fixed inset-0 flex items-center justify-center", !isKeyboardOpen && "bottom-20")}>
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!convexUser) {
    return (
      <div className={cn("fixed inset-0 flex flex-col items-center justify-center p-4", !isKeyboardOpen && "bottom-20")}>
        <p className="text-stone-500">Unable to load user data</p>
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
      <div className={cn("fixed inset-0", !isKeyboardOpen && "bottom-20")}>
        <ChatThread />
      </div>
    </ChatProvider>
  );
}
