"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  BackButton,
  Button,
  Textarea,
  useToast,
} from "@repo/ui";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Send,
  Loader2,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";

function QueriesSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Skeleton className="mb-4 h-8 w-24" />
      <Skeleton className="mb-6 h-6 w-48" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function getQueryStatusIcon(status: string, size: "sm" | "md" = "sm") {
  const className = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  switch (status) {
    case "open":
      return <AlertCircle className={`${className} text-amber-500`} />;
    case "in_progress":
      return <Clock className={`${className} text-blue-500`} />;
    case "resolved":
      return <CheckCircle2 className={`${className} text-emerald-500`} />;
    case "closed":
      return <XCircle className={`${className} text-muted-foreground`} />;
    default:
      return null;
  }
}

function getQueryStatusLabel(status: string) {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

function getQueryTypeLabel(type: string) {
  const labels: Record<string, string> = {
    dispute: "Dispute",
    clarification: "Clarification",
    payment_issue: "Payment Issue",
    extension_request: "Extension Request",
    other: "Other",
  };
  return labels[type] || type;
}

export default function QueriesPage() {
  const { dbUser, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const feeQueries = useQuery(
    api.feeQueries.getByStudent,
    dbUser?._id ? {} : "skip"
  );

  const queryMessages = useQuery(
    api.feeQueries.getMessages,
    selectedQueryId ? { queryId: selectedQueryId as Id<"feeQueries"> } : "skip"
  );

  const addMessage = useMutation(api.feeQueries.addMessage);

  const selectedQuery = useMemo(() => {
    if (!selectedQueryId || !feeQueries) return null;
    return feeQueries.find((q) => q._id === selectedQueryId);
  }, [selectedQueryId, feeQueries]);

  const handleSendReply = async () => {
    if (!selectedQueryId || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      await addMessage({
        queryId: selectedQueryId as Id<"feeQueries">,
        message: replyMessage.trim(),
      });
      setReplyMessage("");
      toast({ title: "Reply sent" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  if (isLoading || feeQueries === undefined) {
    return <QueriesSkeleton />;
  }

  // Query Thread View
  if (selectedQueryId) {
    // Loading state for thread
    if (!selectedQuery) {
      return (
        <div className="mx-auto max-w-lg px-4 py-6 flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedQueryId(null)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{selectedQuery.subject}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {getQueryTypeLabel(selectedQuery.type)}
              </Badge>
              <span>•</span>
              <div className="flex items-center gap-1">
                {getQueryStatusIcon(selectedQuery.status)}
                <span className={
                  selectedQuery.status === "open" ? "text-amber-600" :
                  selectedQuery.status === "in_progress" ? "text-blue-600" :
                  selectedQuery.status === "resolved" ? "text-emerald-600" :
                  "text-muted-foreground"
                }>
                  {getQueryStatusLabel(selectedQuery.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Info */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedQuery.feeDescription || "Fee Payment"}
              </span>
              <span className="font-mono font-semibold">
                ₹{selectedQuery.feeAmount?.toLocaleString("en-IN")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {/* Initial query message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2">
              <p className="text-sm">{selectedQuery.description}</p>
              <p className="text-[10px] opacity-70 mt-1">
                {new Date(selectedQuery.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Thread messages */}
          {queryMessages?.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.senderRole === "student" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.senderRole === "student"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}
              >
                {msg.senderRole === "admin" && (
                  <p className="text-[10px] font-medium mb-1 opacity-70">
                    {msg.senderName}
                  </p>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.senderRole === "student" ? "opacity-70" : "text-muted-foreground"
                }`}>
                  {new Date(msg.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {queryMessages?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Waiting for instructor response...
            </div>
          )}
        </div>

        {/* Reply Input */}
        {(selectedQuery.status === "open" || selectedQuery.status === "in_progress") && (
          <div className="flex gap-2 pt-2 border-t">
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply..."
              rows={2}
              className="flex-1 resize-none"
              maxLength={1000}
            />
            <Button
              size="icon"
              className="h-auto"
              onClick={handleSendReply}
              disabled={!replyMessage.trim() || isSendingReply}
            >
              {isSendingReply ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {(selectedQuery.status === "resolved" || selectedQuery.status === "closed") && (
          <div className="text-center py-3 text-sm text-muted-foreground border-t">
            This query has been {selectedQuery.status}
          </div>
        )}
      </div>
    );
  }

  // Queries List View
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <BackButton href="/me" />

      <div className="mb-4 mt-4">
        <h1 className="text-xl font-semibold">My Queries</h1>
        <p className="text-sm text-muted-foreground">
          Track your fee-related queries and conversations
        </p>
      </div>

      {feeQueries && feeQueries.length > 0 ? (
        <div className="space-y-3">
          {feeQueries.map((query) => (
            <Card
              key={query._id}
              className={`overflow-hidden cursor-pointer transition-colors hover:bg-muted/50 ${
                query.status === "open" ? "border-amber-500/50" :
                query.status === "in_progress" ? "border-blue-500/50" :
                ""
              }`}
              onClick={() => setSelectedQueryId(query._id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getQueryStatusIcon(query.status, "md")}
                      <span className="font-medium text-sm truncate">
                        {query.subject}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {query.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {getQueryTypeLabel(query.type)}
                      </Badge>
                      <span>•</span>
                      <span>₹{query.feeAmount?.toLocaleString("en-IN")}</span>
                      <span>•</span>
                      <span>{new Date(query.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${
                      query.status === "open" ? "border-amber-500/50 text-amber-600" :
                      query.status === "in_progress" ? "border-blue-500/50 text-blue-600" :
                      query.status === "resolved" ? "border-emerald-500/50 text-emerald-600" :
                      ""
                    }`}
                  >
                    {getQueryStatusLabel(query.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            No queries yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Raise a query from your fees page if you need help
          </p>
        </div>
      )}
    </div>
  );
}
