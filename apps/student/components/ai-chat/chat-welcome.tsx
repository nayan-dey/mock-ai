"use client";

import { useCallback } from "react";
import { DraftingCompass, Sparkles } from "lucide-react";
import { useChatContext } from "./chat-provider";

export function ChatWelcome() {
  const { submitMessage } = useChatContext();

  const handleSuggestionClick = useCallback((question: string) => {
    submitMessage(question);
  }, [submitMessage]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      {/* Animated Icon */}
      <div className="mb-3">
        <DraftingCompass className="h-12 w-12 text-primary" strokeWidth={1.5} />
      </div>

      {/* Nindo AI Title */}
      <h2 className="mb-6 text-lg font-serif font-medium text-foreground">
        Nindo AI
      </h2>

      {/* Subtitle */}
      <h1 className="mb-8 text-center text-lg font-normal text-foreground">
        How can I help you<br />today?
      </h1>

      {/* Quick Suggestions - minimal pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {["My scores", "Weak subjects", "Leaderboard rank", "Study tips"].map((text) => (
          <button
            key={text}
            onClick={() => handleSuggestionClick(text)}
            className="rounded-full bg-background border px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-muted active:scale-95"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
