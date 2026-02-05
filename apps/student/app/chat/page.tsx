"use client";

import { Loader2 } from "lucide-react";
import { Button, cn } from "@repo/ui";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ChatProvider, ChatThread } from "@/components/ai-chat";
import Link from "next/link";
import { useKeyboardOpen } from "@/hooks/use-keyboard-open";

export default function ChatPage() {
  const { dbUser: convexUser, isLoading } = useCurrentUser();
  const isKeyboardOpen = useKeyboardOpen();

  if (isLoading) {
    return (
      <div className={cn("fixed inset-0 flex items-center justify-center", !isKeyboardOpen && "bottom-20")}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!convexUser) {
    return (
      <div className={cn("fixed inset-0 flex flex-col items-center justify-center p-4", !isKeyboardOpen && "bottom-20")}>
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
      <div className={cn("fixed inset-0", !isKeyboardOpen && "bottom-20")}>
        <ChatThread />
      </div>
    </ChatProvider>
  );
}
