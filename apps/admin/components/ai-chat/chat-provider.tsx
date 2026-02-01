"use client";

import { useChat, type Message } from "ai/react";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

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
  currentConversationId: string | null;
  selectConversation: (conversationId: string | null) => void;
  startNewChat: () => void;
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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  // Fetch admin context using Convex React hook
  const adminContext = useQuery(
    api.chat.getAdminContext,
    userId ? {} : "skip"
  );

  // Fetch messages for current conversation
  const conversationMessages = useQuery(
    api.chat.getMessages,
    currentConversationId ? { conversationId: currentConversationId as any } : "skip"
  );

  const isContextLoading = adminContext === undefined;
  const isMessagesLoading = currentConversationId !== null && conversationMessages === undefined;

  // Convert Convex messages to AI SDK format when conversation changes
  useEffect(() => {
    if (currentConversationId && conversationMessages !== undefined) {
      const formattedMessages: Message[] = conversationMessages.map((msg, index) => ({
        id: msg._id || `msg-${index}`,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      }));
      setInitialMessages(formattedMessages);
    } else if (!currentConversationId) {
      setInitialMessages([]);
    }
  }, [conversationMessages, currentConversationId]);

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
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages,
    body: {
      adminContext,
    },
  });

  useEffect(() => {
    if (!isMessagesLoading) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages, isMessagesLoading]);

  const selectConversation = useCallback((conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    if (!conversationId) {
      setMessages([]);
    }
  }, [setMessages]);

  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
  }, [setMessages]);

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
        currentConversationId,
        selectConversation,
        startNewChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
