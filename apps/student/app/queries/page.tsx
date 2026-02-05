"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
  useToast,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@repo/ui";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Headphones,
  IndianRupee,
  FileQuestion,
  Ban,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";

type QueryType = "fee" | "test";

interface SelectedQuery {
  id: string;
  type: QueryType;
}

function QueriesSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
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
    case "rejected":
      return <Ban className={`${className} text-red-500`} />;
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
    case "rejected":
      return "Rejected";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

function getFeeQueryTypeLabel(type: string) {
  const labels: Record<string, string> = {
    dispute: "Dispute",
    clarification: "Clarification",
    payment_issue: "Payment Issue",
    extension_request: "Extension Request",
    other: "Other",
  };
  return labels[type] || type;
}

function getTestQueryTypeLabel(type: string) {
  const labels: Record<string, string> = {
    wrong_answer: "Wrong Answer",
    wrong_question: "Question Error",
    wrong_options: "Options Error",
    unclear_question: "Unclear Question",
    other: "Other",
  };
  return labels[type] || type;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "open":
      return "border-amber-500/50 text-amber-600 bg-amber-500/10";
    case "in_progress":
      return "border-blue-500/50 text-blue-600 bg-blue-500/10";
    case "resolved":
      return "border-emerald-500/50 text-emerald-600 bg-emerald-500/10";
    case "rejected":
      return "border-red-500/50 text-red-600 bg-red-500/10";
    default:
      return "bg-muted";
  }
}

type SortOption = "newest" | "oldest" | "status";
type ViewMode = "card" | "list";

export default function QueriesPage() {
  const { dbUser, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [selectedQuery, setSelectedQuery] = useState<SelectedQuery | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fee queries
  const feeQueries = useQuery(
    api.feeQueries.getByStudent,
    dbUser?._id ? {} : "skip"
  );

  // Test queries
  const testQueries = useQuery(
    api.testQueries.getByStudent,
    dbUser?._id ? {} : "skip"
  );

  // Messages for selected query
  const feeQueryMessages = useQuery(
    api.feeQueries.getMessages,
    selectedQuery?.type === "fee" ? { queryId: selectedQuery.id as Id<"feeQueries"> } : "skip"
  );

  const testQueryMessages = useQuery(
    api.testQueries.getMessages,
    selectedQuery?.type === "test" ? { queryId: selectedQuery.id as Id<"testQueries"> } : "skip"
  );

  const addFeeMessage = useMutation(api.feeQueries.addMessage);
  const addTestMessage = useMutation(api.testQueries.addMessage);

  // Get selected query data
  const selectedFeeQuery = useMemo(() => {
    if (selectedQuery?.type !== "fee" || !feeQueries) return null;
    return feeQueries.find((q) => q._id === selectedQuery.id);
  }, [selectedQuery, feeQueries]);

  const selectedTestQuery = useMemo(() => {
    if (selectedQuery?.type !== "test" || !testQueries) return null;
    return testQueries.find((q) => q._id === selectedQuery.id);
  }, [selectedQuery, testQueries]);

  const queryMessages = selectedQuery?.type === "fee" ? feeQueryMessages : testQueryMessages;

  // Combined and filtered queries
  const allQueries = useMemo(() => {
    const combined: Array<{
      id: string;
      type: QueryType;
      subject: string;
      description: string;
      status: string;
      queryType: string;
      createdAt: number;
      subtitle: string;
      isDeleted?: boolean;
    }> = [];

    if (feeQueries) {
      feeQueries.forEach((q) => {
        const feeDeleted = q.feeAmount === null || q.feeAmount === undefined;
        combined.push({
          id: q._id,
          type: "fee",
          subject: q.subject,
          description: q.description,
          status: q.status,
          queryType: q.type,
          createdAt: q.createdAt,
          subtitle: feeDeleted
            ? "Fee record deleted"
            : `₹${q.feeAmount?.toLocaleString("en-IN")} • ${q.feeDescription || "Fee"}`,
          isDeleted: feeDeleted,
        });
      });
    }

    if (testQueries) {
      testQueries.forEach((q) => {
        const testDeleted = !q.testTitle || q.testTitle === "Unknown Test";
        const questionDeleted = !q.questionText || q.questionText === "Unknown Question";
        combined.push({
          id: q._id,
          type: "test",
          subject: q.subject,
          description: q.description,
          status: q.status,
          queryType: q.type,
          createdAt: q.createdAt,
          subtitle: testDeleted ? "Test deleted" : q.testTitle,
          isDeleted: testDeleted || questionDeleted,
        });
      });
    }

    // Sort based on selected option
    switch (sortBy) {
      case "oldest":
        combined.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "status":
        const statusOrder: Record<string, number> = { open: 0, in_progress: 1, resolved: 2, rejected: 3, closed: 4 };
        combined.sort((a, b) => {
          const diff = statusOrder[a.status] - statusOrder[b.status];
          if (diff !== 0) return diff;
          return b.createdAt - a.createdAt;
        });
        break;
      default: // newest
        combined.sort((a, b) => b.createdAt - a.createdAt);
    }

    return combined;
  }, [feeQueries, testQueries, sortBy]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [queryMessages]);

  const handleSendReply = async () => {
    if (!selectedQuery || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      if (selectedQuery.type === "fee") {
        await addFeeMessage({
          queryId: selectedQuery.id as Id<"feeQueries">,
          message: replyMessage.trim(),
        });
      } else {
        await addTestMessage({
          queryId: selectedQuery.id as Id<"testQueries">,
          message: replyMessage.trim(),
        });
      }
      setReplyMessage("");
      toast({ title: "Message sent" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (replyMessage.trim() && !isSendingReply) {
        handleSendReply();
      }
    }
  };

  if (isLoading || feeQueries === undefined || testQueries === undefined) {
    return <QueriesSkeleton />;
  }

  // Query Thread View
  if (selectedQuery) {
    const queryData = selectedQuery.type === "fee" ? selectedFeeQuery : selectedTestQuery;

    // Loading state for thread
    if (!queryData) {
      return (
        <div className="fixed inset-0 bottom-20 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const canSendMessage = queryData.status === "open" || queryData.status === "in_progress";

    return (
      <div className="fixed inset-0 bottom-20 flex flex-col bg-background">
        {/* Header */}
        <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSelectedQuery(null)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              {selectedQuery.type === "fee" ? (
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileQuestion className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold truncate">{queryData.subject}</h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {selectedQuery.type === "fee" && selectedFeeQuery && (
                  selectedFeeQuery.feeAmount !== null && selectedFeeQuery.feeAmount !== undefined ? (
                    <>
                      <span className="truncate">{selectedFeeQuery.feeDescription || "Fee Payment"}</span>
                      <span>•</span>
                      <span className="font-mono">₹{selectedFeeQuery.feeAmount?.toLocaleString("en-IN")}</span>
                    </>
                  ) : (
                    <span className="text-destructive italic">Fee record has been deleted</span>
                  )
                )}
                {selectedQuery.type === "test" && selectedTestQuery && (
                  selectedTestQuery.testTitle && selectedTestQuery.testTitle !== "Unknown Test" ? (
                    <span className="truncate">{selectedTestQuery.testTitle}</span>
                  ) : (
                    <span className="text-destructive italic">Test has been deleted</span>
                  )
                )}
              </div>
            </div>
            <Badge variant="outline" className={`shrink-0 text-[10px] ${getStatusBadgeClass(queryData.status)}`}>
              {getQueryStatusLabel(queryData.status)}
            </Badge>
          </div>

          {/* Question preview for test queries */}
          {selectedQuery.type === "test" && selectedTestQuery && (
            <div className="px-4 pb-3">
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <p className="font-medium text-muted-foreground mb-1">Question:</p>
                {selectedTestQuery.questionText && selectedTestQuery.questionText !== "Unknown Question" ? (
                  <p className="line-clamp-2">{selectedTestQuery.questionText}</p>
                ) : (
                  <p className="text-destructive italic">Question has been deleted from the database</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col justify-end p-4 space-y-3">
            {/* Initial query message */}
            <div className="flex justify-end">
              <div className="max-w-[80%]">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5">
                  <p className="text-[15px] leading-relaxed">{queryData.description}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right pr-1">
                  {new Date(queryData.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Admin note for test queries */}
            {selectedQuery.type === "test" && selectedTestQuery?.adminNote && (
              <div className="flex justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center mr-2 mt-1">
                  <Headphones className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="max-w-[80%]">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1 ml-1">
                    Support
                  </p>
                  <div className="rounded-2xl px-4 py-2.5 bg-muted rounded-bl-sm">
                    <p className="text-[15px] leading-relaxed">{selectedTestQuery.adminNote}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Thread messages */}
            {queryMessages?.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.senderRole === "student" ? "justify-end" : "justify-start"}`}
              >
                {msg.senderRole === "admin" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center mr-2 mt-1">
                    <Headphones className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.senderRole === "student" ? "" : "flex-1"}`}>
                  {msg.senderRole === "admin" && (
                    <p className="text-[11px] font-medium text-muted-foreground mb-1 ml-1">
                      Support
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      msg.senderRole === "student"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed">{msg.message}</p>
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${
                    msg.senderRole === "student" ? "text-right pr-1" : "pl-1"
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

            {queryMessages?.length === 0 && !selectedTestQuery?.adminNote && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Headphones className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Waiting for support response...</p>
                <p className="text-xs text-muted-foreground/70 mt-1">We'll get back to you soon</p>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        {canSendMessage ? (
          <div className="shrink-0 p-3 border-t bg-background">
            <div className="flex items-center gap-2 rounded-full bg-muted/50 border p-1.5 pl-4">
              <input
                ref={inputRef}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                maxLength={1000}
                disabled={isSendingReply}
              />
              <Button
                size="icon"
                className="h-9 w-9 rounded-full shrink-0"
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
          </div>
        ) : (
          <div className="shrink-0 p-4 border-t bg-muted/30">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              {queryData.status === "resolved" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>This query has been resolved</span>
                </>
              ) : queryData.status === "rejected" ? (
                <>
                  <Ban className="h-4 w-4 text-red-500" />
                  <span>This query has been rejected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>This query has been closed</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const totalCount = allQueries.length;

  // Queries List View
  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton href="/me" />
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold tracking-tight">My Queries</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount > 0 ? `${totalCount} quer${totalCount !== 1 ? "ies" : "y"}` : "No queries yet"}
            </p>
          </div>
        </div>

        {/* Controls */}
        {totalCount > 0 && (
          <div className="flex items-center gap-1">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "card" ? "bg-background shadow-sm" : "hover:bg-background/50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            {totalCount > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>
                    <SortDesc className="mr-2 h-3.5 w-3.5" />
                    Newest first
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                    <SortAsc className="mr-2 h-3.5 w-3.5" />
                    Oldest first
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("status")}>
                    <AlertCircle className="mr-2 h-3.5 w-3.5" />
                    By status (open first)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {allQueries.length > 0 ? (
        viewMode === "card" ? (
          // Card View
          <div className="space-y-3">
            {allQueries.map((query) => (
              <Card
                key={`${query.type}-${query.id}`}
                className={`overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${
                  query.status === "open" ? "border-amber-500/50" :
                  query.status === "in_progress" ? "border-blue-500/50" :
                  ""
                }`}
                onClick={() => setSelectedQuery({ id: query.id, type: query.type })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        query.type === "fee" ? "bg-emerald-500/10" : "bg-blue-500/10"
                      }`}>
                        {query.type === "fee" ? (
                          <IndianRupee className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <FileQuestion className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getQueryStatusIcon(query.status, "sm")}
                          <span className="font-medium text-sm truncate">
                            {query.subject}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                          {query.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {query.type === "fee"
                              ? getFeeQueryTypeLabel(query.queryType)
                              : getTestQueryTypeLabel(query.queryType)
                            }
                          </Badge>
                          <span className={`truncate ${query.isDeleted ? "text-destructive italic" : ""}`}>
                            {query.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${getStatusBadgeClass(query.status)}`}>
                      {getQueryStatusLabel(query.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View (compact)
          <div className="rounded-xl border bg-card divide-y">
            {allQueries.map((query) => (
              <div
                key={`${query.type}-${query.id}`}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted"
                onClick={() => setSelectedQuery({ id: query.id, type: query.type })}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  query.type === "fee" ? "bg-emerald-500/10" : "bg-blue-500/10"
                }`}>
                  {query.type === "fee" ? (
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <FileQuestion className="h-3.5 w-3.5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getQueryStatusIcon(query.status, "sm")}
                    <span className="font-medium text-sm truncate">{query.subject}</span>
                  </div>
                  <p className={`text-xs text-muted-foreground truncate ${query.isDeleted ? "text-destructive italic" : ""}`}>
                    {query.subtitle}
                  </p>
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${getStatusBadgeClass(query.status)}`}>
                  {getQueryStatusLabel(query.status)}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No queries yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70 max-w-[220px]">
            Raise queries from fees or test results pages
          </p>
        </div>
      )}
    </div>
  );
}
