"use client";

import { useEffect, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useChatContext } from "./chat-provider";
import { ChatMessage } from "./chat-message";
import { ChatWelcome } from "./chat-welcome";
import { ChatInput } from "./chat-input";

export function ChatThread() {
  const { messages, isLoading, error, isContextLoading } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  if (isContextLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col">
          {!hasMessages ? (
            <ChatWelcome />
          ) : (
            <div className="flex-1 py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role as "user" | "assistant"}
                  content={message.content}
                />
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                      <Sparkles className="h-5 w-5 animate-pulse text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mx-4 my-2 rounded-2xl bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error.message || "Something went wrong. Please try again."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  );
}
