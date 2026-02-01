"use client";

import { NindoLogo } from "./nindo-logo";
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
      <div className="mb-3">
        <NindoLogo className="h-12 w-12 text-primary" />
      </div>

      <h2 className="mb-6 text-lg font-serif font-medium text-foreground">
        Nindo AI
      </h2>

      <h1 className="mb-8 text-center text-2xl font-normal text-foreground">
        How can I help you<br />today?
      </h1>

      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {[
          "Students with due fees",
          "Top performers",
          "Test completion rate",
          "Batch overview",
        ].map((text) => (
          <button
            key={text}
            onClick={() => handleSuggestionClick(text)}
            className="rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
