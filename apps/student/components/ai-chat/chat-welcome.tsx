"use client";

import { Sparkles } from "lucide-react";
import { useChatContext } from "./chat-provider";

export function ChatWelcome() {
  const { setInput } = useChatContext();

  const handleSuggestionClick = (question: string) => {
    setInput(question);
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    }, 10);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      {/* Animated Icon */}
      <div className="mb-6">
        <Sparkles className="h-12 w-12 text-orange-400" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h1 className="mb-8 text-center text-2xl font-normal text-stone-700 dark:text-stone-200">
        How can I help you<br />today?
      </h1>

      {/* Quick Suggestions - minimal pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {["My scores", "Weak subjects", "Leaderboard rank", "Study tips"].map((text) => (
          <button
            key={text}
            onClick={() => handleSuggestionClick(text)}
            className="rounded-full bg-white dark:bg-stone-800 px-4 py-2 text-sm text-stone-600 dark:text-stone-300 shadow-sm transition-all hover:shadow active:scale-95"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
