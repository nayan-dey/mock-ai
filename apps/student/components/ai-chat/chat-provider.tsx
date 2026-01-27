"use client";

import { useChat } from "ai/react";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { createContext, useContext, useMemo, type ReactNode } from "react";

interface ChatContextType {
  messages: ReturnType<typeof useChat>["messages"];
  input: string;
  handleInputChange: ReturnType<typeof useChat>["handleInputChange"];
  handleSubmit: ReturnType<typeof useChat>["handleSubmit"];
  isLoading: boolean;
  error: Error | undefined;
  reload: ReturnType<typeof useChat>["reload"];
  stop: ReturnType<typeof useChat>["stop"];
  setInput: ReturnType<typeof useChat>["setInput"];
  isContextLoading: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
  userId: string;
}

export function ChatProvider({ children, userId }: ChatProviderProps) {
  // Fetch student context using Convex React hook
  const studentContext = useQuery(
    api.chat.getStudentContext,
    userId ? { userId: userId as any } : "skip"
  );

  const isContextLoading = studentContext === undefined;

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setInput,
  } = useChat({
    api: "/api/chat",
    initialMessages: [],
    body: {
      studentContext,
    },
  });

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading: isLoading || isContextLoading,
        error,
        reload,
        stop,
        setInput,
        isContextLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
