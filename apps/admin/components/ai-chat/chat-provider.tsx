"use client";

import { useChat, type Message } from "ai/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { toast } from "sonner";

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
  submitMessage: (text: string) => void;
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

  const consumeChatLimit = useMutation(api.chat.consumeChatLimit);

  const isContextLoading = adminContext === undefined;
  const isMessagesLoading = currentConversationId !== null && conversationMessages === undefined;

  // Memoize body to avoid unstable reference
  const chatBody = useMemo(() => ({ adminContext }), [adminContext]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setInput,
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages,
    body: chatBody,
  });

  // Wrap handleSubmit to check rate limit first
  const handleSubmit = useCallback(async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    try {
      const result = await consumeChatLimit();
      if (!result.allowed) {
        toast.error(`Daily chat limit reached (${result.limit} messages/day). Try again tomorrow.`);
        return;
      }
    } catch {
      // If rate limit check fails, allow the message (fail open)
    }
    originalHandleSubmit(e as any);
  }, [consumeChatLimit, originalHandleSubmit]);

  // Convert Convex messages to AI SDK format and sync into useChat in a single effect
  useEffect(() => {
    if (currentConversationId && conversationMessages !== undefined) {
      const formattedMessages: Message[] = conversationMessages.map((msg, index) => ({
        id: msg._id || `msg-${index}`,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      }));
      setInitialMessages(formattedMessages);
      setMessages(formattedMessages);
    } else if (!currentConversationId) {
      setInitialMessages([]);
      setMessages([]);
    }
  }, [conversationMessages, currentConversationId, setMessages]);

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

  const submitMessage = useCallback((text: string) => {
    setInput(text);
    handleSubmit(new Event("submit") as any);
  }, [setInput, handleSubmit]);

  const contextValue = useMemo(() => ({
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
    submitMessage,
  }), [messages, input, handleInputChange, handleSubmit, isLoading, isContextLoading, error, reload, stop, setInput, currentConversationId, selectConversation, startNewChat, submitMessage]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}
