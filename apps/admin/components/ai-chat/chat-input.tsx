"use client";

import { useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useChatContext } from "./chat-provider";

export function ChatInput() {
  const { input, handleInputChange, handleSubmit, isLoading, stop } = useChatContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-end gap-2 rounded-3xl bg-background border p-2 shadow-sm">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nindo AI..."
            className="flex-1 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors"
            >
              <Square className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp className="h-5 w-5 text-primary-foreground" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
