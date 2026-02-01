"use client";

import { X, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@repo/ui";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { cn } from "@repo/ui";
import { useChatContext } from "./chat-provider";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ChatSidebar({ isOpen, onClose, userId }: ChatSidebarProps) {
  const { selectConversation, startNewChat, currentConversationId } = useChatContext();

  const conversations = useQuery(
    api.chat.getUserConversations,
    userId ? {} : "skip"
  );

  const deleteConversation = useMutation(api.chat.deleteConversation);

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    onClose();
  };

  const handleNewChat = () => {
    startNewChat();
    onClose();
  };

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // If we're deleting the current conversation, start a new chat
    if (conversationId === currentConversationId) {
      startNewChat();
    }
    await deleteConversation({ conversationId: conversationId as any });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-stone-800 shadow-xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-stone-200 dark:border-stone-700 px-4">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
            Chat History
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl border-stone-200 dark:border-stone-600"
            onClick={handleNewChat}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {conversations === undefined ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-colors",
                    currentConversationId === conv._id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-stone-100 dark:hover:bg-stone-700"
                  )}
                  onClick={() => handleSelectConversation(conv._id)}
                >
                  <MessageSquare className={cn(
                    "h-4 w-4 shrink-0",
                    currentConversationId === conv._id ? "text-primary" : "text-stone-400"
                  )} />
                  <span className={cn(
                    "flex-1 truncate text-sm",
                    currentConversationId === conv._id
                      ? "text-primary font-medium"
                      : "text-stone-600 dark:text-stone-300"
                  )}>
                    {conv.title || "New conversation"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(conv._id, e)}
                  >
                    <Trash2 className="h-3 w-3 text-stone-400 hover:text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
