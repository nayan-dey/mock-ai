"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import {
  Button,
  Badge,
  SortableHeader,
  type ColumnDef,
  type FacetedFilterConfig,
  useToast,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  ScrollArea,
  formatDate,
} from "@repo/ui";
import {
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  ArrowLeft,
  User,
  MessageSquareText,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";
import { AdminTable, createActionsColumn, type ActionMenuItem } from "@/components/admin-table";

interface QueryRow {
  _id: string;
  feeId: string;
  studentId: string;
  organizationId: string;
  type: "dispute" | "clarification" | "payment_issue" | "extension_request" | "other";
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  resolvedBy?: string;
  resolvedAt?: number;
  createdAt: number;
  studentName: string;
  studentEmail: string;
  feeAmount: number;
  feeDueDate?: number;
  feeDescription?: string;
  resolverName: string | null;
}

const QUERY_TYPE_LABELS: Record<string, string> = {
  dispute: "Dispute",
  clarification: "Clarification",
  payment_issue: "Payment Issue",
  extension_request: "Extension Request",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function QueriesClient() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  const currentAdmin = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const feeQueries = useQuery(api.feeQueries.getAllForOrg, {});
  const updateQueryStatus = useMutation(api.feeQueries.updateStatus);

  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [newQueryStatus, setNewQueryStatus] = useState<string>("");
  const [isUpdatingQuery, startUpdatingQuery] = useTransition();

  // Thread view state
  const [selectedQueryForThread, setSelectedQueryForThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, startSendingReply] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for selected query
  const queryMessages = useQuery(
    api.feeQueries.getMessages,
    selectedQueryForThread ? { queryId: selectedQueryForThread as Id<"feeQueries"> } : "skip"
  );
  const selectedQueryData = useQuery(
    api.feeQueries.getById,
    selectedQueryForThread ? { id: selectedQueryForThread as Id<"feeQueries"> } : "skip"
  );
  const addMessage = useMutation(api.feeQueries.addMessage);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (queryMessages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [queryMessages]);

  const handleUpdateQueryStatus = () => {
    if (!selectedQuery || !newQueryStatus) return;
    startUpdatingQuery(async () => {
      try {
        await updateQueryStatus({
          queryId: selectedQuery as Id<"feeQueries">,
          status: newQueryStatus as "open" | "in_progress" | "resolved" | "closed",
        });
        toast({ title: "Query status updated" });
        setSelectedQuery(null);
        setNewQueryStatus("");
      } catch (err: any) {
        toast({
          title: "Error",
          description: "Failed to update query.",
          variant: "destructive",
        });
      }
    });
  };

  const handleSendReply = () => {
    if (!selectedQueryForThread || !replyMessage.trim()) return;
    startSendingReply(async () => {
      try {
        await addMessage({
          queryId: selectedQueryForThread as Id<"feeQueries">,
          message: replyMessage.trim(),
        });
        setReplyMessage("");
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to send message.",
          variant: "destructive",
        });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const columns = useMemo<ColumnDef<QueryRow>[]>(() => [
    {
      accessorKey: "studentName",
      header: ({ column }) => <SortableHeader column={column} title="Student" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{row.getValue("studentName")}</p>
          <p className="text-xs text-muted-foreground truncate">{row.original.studentEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">{row.getValue("subject")}</p>
          <p className="text-xs text-muted-foreground truncate">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {QUERY_TYPE_LABELS[row.getValue("type") as string] || row.getValue("type")}
        </Badge>
      ),
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "feeAmount",
      header: ({ column }) => <SortableHeader column={column} title="Fee" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          ₹{(row.getValue("feeAmount") as number).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="flex items-center gap-1.5">
            {getStatusIcon(status)}
            <Badge
              variant="outline"
              className={
                status === "open" ? "border-amber-500/50 text-amber-600" :
                status === "in_progress" ? "border-blue-500/50 text-blue-600" :
                status === "resolved" ? "border-emerald-500/50 text-emerald-600" :
                "border-muted-foreground/50 text-muted-foreground"
              }
            >
              {STATUS_LABELS[status] || status}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdAt") as number)}
        </span>
      ),
    },
    createActionsColumn<QueryRow>((query) => {
      const actions: ActionMenuItem[] = [
        {
          label: "View Thread",
          icon: <MessageSquare className="h-4 w-4" />,
          onClick: () => setSelectedQueryForThread(query._id),
        },
      ];

      if (query.status === "open" || query.status === "in_progress") {
        actions.push({
          label: "Mark Resolved",
          icon: <CheckCircle2 className="h-4 w-4" />,
          onClick: () => {
            setSelectedQuery(query._id);
            setNewQueryStatus("resolved");
          },
        });
        actions.push({
          label: "Close Query",
          icon: <XCircle className="h-4 w-4" />,
          onClick: () => {
            setSelectedQuery(query._id);
            setNewQueryStatus("closed");
          },
        });
      }

      return actions;
    }),
  ], []);

  const facetedFilters: FacetedFilterConfig[] = useMemo(() => [
    {
      columnId: "status",
      title: "Status",
      options: [
        { label: "Open", value: "open" },
        { label: "In Progress", value: "in_progress" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" },
      ],
    },
    {
      columnId: "type",
      title: "Type",
      options: [
        { label: "Dispute", value: "dispute" },
        { label: "Clarification", value: "clarification" },
        { label: "Payment Issue", value: "payment_issue" },
        { label: "Extension Request", value: "extension_request" },
        { label: "Other", value: "other" },
      ],
    },
  ], []);

  return (
    <>
      <AdminTable<QueryRow>
        columns={columns}
        data={(feeQueries as QueryRow[]) ?? []}
        isLoading={feeQueries === undefined}
        searchKey="studentName"
        searchPlaceholder="Search by student name..."
        title="Student Queries"
        description="Manage and respond to student fee queries"
        emptyIcon={<MessageSquareText className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No queries yet"
        emptyDescription="Student queries about fees will appear here"
        facetedFilters={facetedFilters}
        showColumnVisibility={true}
        showCard={false}
        onRowClick={(row) => setSelectedQueryForThread(row._id)}
        rowClassName={(row) =>
          row.status === "open" ? "bg-amber-500/5 hover:bg-amber-500/10" :
          row.status === "in_progress" ? "bg-blue-500/5 hover:bg-blue-500/10" :
          ""
        }
      />

      {/* Query Status Update Dialog */}
      <Dialog
        open={!!selectedQuery}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedQuery(null);
            setNewQueryStatus("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Query Status</DialogTitle>
            <DialogDescription>
              Change the status of this query. Use the thread view to send messages to the student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="query-status">New Status</Label>
              <Select value={newQueryStatus} onValueChange={setNewQueryStatus}>
                <SelectTrigger id="query-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isUpdatingQuery}
              onClick={() => {
                setSelectedQuery(null);
                setNewQueryStatus("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateQueryStatus}
              disabled={!newQueryStatus || isUpdatingQuery}
            >
              {isUpdatingQuery ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Query Thread Sheet */}
      <Sheet
        open={!!selectedQueryForThread}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQueryForThread(null);
            setReplyMessage("");
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
          {/* Loading State */}
          {selectedQueryForThread && !selectedQueryData && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Content when data is loaded */}
          {selectedQueryData && (
            <>
              <SheetHeader className="px-6 py-4 border-b shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedQueryForThread(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base truncate">
                      {selectedQueryData.subject}
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      {selectedQueryData.studentName} • {QUERY_TYPE_LABELS[selectedQueryData.type]}
                    </SheetDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${
                      selectedQueryData.status === "open" ? "border-amber-500/50 text-amber-600" :
                      selectedQueryData.status === "in_progress" ? "border-blue-500/50 text-blue-600" :
                      selectedQueryData.status === "resolved" ? "border-emerald-500/50 text-emerald-600" :
                      "border-muted-foreground/50 text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[selectedQueryData.status]}
                  </Badge>
                </div>
              </SheetHeader>

              {/* Query Details */}
              <div className="px-6 py-3 border-b bg-muted/30 shrink-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>Fee: ₹{selectedQueryData.feeAmount?.toLocaleString("en-IN")}</span>
                  <span>•</span>
                  <span>Due: {selectedQueryData.feeDueDate ? new Date(selectedQueryData.feeDueDate).toLocaleDateString("en-IN") : "N/A"}</span>
                  <span>•</span>
                  <span>Created: {new Date(selectedQueryData.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {/* Initial query message */}
              {selectedQueryData && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg px-4 py-2 bg-blue-500 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3" />
                      <span className="text-xs font-medium opacity-90">{selectedQueryData.studentName}</span>
                      <span className="text-xs opacity-75">
                        {new Date(selectedQueryData.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{selectedQueryData.description}</p>
                  </div>
                </div>
              )}

              {/* Thread messages */}
              {queryMessages?.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.senderRole === "admin" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      msg.senderRole === "admin"
                        ? "bg-muted"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3" />
                      <span className={`text-xs font-medium ${msg.senderRole === "admin" ? "" : "opacity-90"}`}>
                        {msg.senderName} {msg.senderRole === "admin" && "(You)"}
                      </span>
                      <span className={`text-xs ${msg.senderRole === "admin" ? "text-muted-foreground" : "opacity-75"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Reply input or status indicator */}
          <div className="px-6 py-4 border-t shrink-0">
            {selectedQueryData?.status === "resolved" || selectedQueryData?.status === "closed" ? (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                {selectedQueryData.status === "resolved" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>This query has been resolved</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>This query has been closed</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && replyMessage.trim()) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <Button
                  size="icon"
                  disabled={!replyMessage.trim() || isSendingReply}
                  onClick={handleSendReply}
                  className="shrink-0 self-end"
                >
                  {isSendingReply ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            {selectedQueryData && (selectedQueryData.status === "open" || selectedQueryData.status === "in_progress") && (
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedQuery(selectedQueryForThread);
                    setNewQueryStatus("resolved");
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Resolved
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedQuery(selectedQueryForThread);
                    setNewQueryStatus("closed");
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            )}
          </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
