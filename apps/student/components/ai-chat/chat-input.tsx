"use client";

import { useRef } from "react";
import { ArrowUp, Square, AlertCircle } from "lucide-react";
import { useChatContext } from "./chat-provider";

export function ChatInput() {
  const { input, handleInputChange, handleSubmit, isLoading, stop, dailyLimit } = useChatContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const hasReachedLimit = dailyLimit?.hasReachedLimit ?? false;
  const remaining = dailyLimit?.remaining ?? 3;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && !hasReachedLimit) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (hasReachedLimit) {
      e.preventDefault();
      return;
    }
    handleSubmit(e);
  };

  return (
    <form onSubmit={onSubmit} className="p-4">
      <div className="mx-auto max-w-2xl">
        {/* Daily limit warning */}
        {hasReachedLimit ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">You've reached your daily limit of 3 messages. Come back tomorrow!</p>
          </div>
        ) : dailyLimit && remaining <= 2 ? (
          <div className="mb-2 text-center">
            <p className="text-xs text-stone-400">
              {remaining} message{remaining !== 1 ? "s" : ""} remaining today
            </p>
          </div>
        ) : null}

        <div className="flex items-end gap-2 rounded-3xl bg-white dark:bg-stone-800 p-2 shadow-sm">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={hasReachedLimit ? "Daily limit reached" : "Message Nindo AI..."}
            className="flex-1 bg-transparent px-3 py-2 text-base text-stone-700 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed"
            disabled={isLoading || hasReachedLimit}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-600 transition-colors"
            >
              <Square className="h-4 w-4 text-stone-600 dark:text-stone-300" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || hasReachedLimit}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-800 dark:bg-stone-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp className="h-5 w-5 text-white dark:text-stone-800" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
