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
  IndianRupee,
  FileQuestion,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";
import { AdminTable, createActionsColumn, type ActionMenuItem } from "@/components/admin-table";
import { UserDetailSheet } from "@/components/user-detail-sheet";

// Unified query row type
interface QueryRow {
  _id: string;
  queryType: "fee" | "test"; // Discriminator
  studentId: string;
  organizationId: string;
  type: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "rejected" | "closed";
  resolvedBy?: string;
  resolvedAt?: number;
  createdAt: number;
  studentName: string;
  studentEmail: string;
  studentBatchName?: string | null;
  resolverName: string | null;
  // Fee query specific
  feeId?: string;
  feeAmount?: number | null;
  feeDueDate?: number | null;
  feeDescription?: string | null;
  // Test query specific
  testId?: string;
  questionId?: string;
  testTitle?: string;
  questionText?: string;
  questionOptions?: string[];
  correctOptions?: number[];
  adminNote?: string;
}

const FEE_QUERY_TYPE_LABELS: Record<string, string> = {
  dispute: "Dispute",
  clarification: "Clarification",
  payment_issue: "Payment Issue",
  extension_request: "Extension Request",
  other: "Other",
};

const TEST_QUERY_TYPE_LABELS: Record<string, string> = {
  wrong_answer: "Wrong Answer",
  wrong_question: "Question Error",
  wrong_options: "Options Error",
  unclear_question: "Unclear Question",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
  closed: "Closed",
};

export function QueriesClient() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  const currentAdmin = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Fetch both types of queries
  const feeQueries = useQuery(api.feeQueries.getAllForOrg, {});
  const testQueries = useQuery(api.testQueries.getAllForOrg, {});

  // Mutations for both types
  const updateFeeQueryStatus = useMutation(api.feeQueries.updateStatus);
  const updateTestQueryStatus = useMutation(api.testQueries.updateStatus);
  const addFeeMessage = useMutation(api.feeQueries.addMessage);
  const addTestMessage = useMutation(api.testQueries.addMessage);

  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [selectedQueryType, setSelectedQueryType] = useState<"fee" | "test" | null>(null);
  const [newQueryStatus, setNewQueryStatus] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");
  const [isUpdatingQuery, startUpdatingQuery] = useTransition();

  // Thread view state
  const [selectedQueryForThread, setSelectedQueryForThread] = useState<string | null>(null);
  const [selectedThreadType, setSelectedThreadType] = useState<"fee" | "test" | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, startSendingReply] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Student detail sheet state
  const [studentSheetUserId, setStudentSheetUserId] = useState<string | null>(null);

  // Get messages for selected query
  const feeQueryMessages = useQuery(
    api.feeQueries.getMessages,
    selectedQueryForThread && selectedThreadType === "fee"
      ? { queryId: selectedQueryForThread as Id<"feeQueries"> }
      : "skip"
  );
  const testQueryMessages = useQuery(
    api.testQueries.getMessages,
    selectedQueryForThread && selectedThreadType === "test"
      ? { queryId: selectedQueryForThread as Id<"testQueries"> }
      : "skip"
  );
  const selectedFeeQueryData = useQuery(
    api.feeQueries.getById,
    selectedQueryForThread && selectedThreadType === "fee"
      ? { id: selectedQueryForThread as Id<"feeQueries"> }
      : "skip"
  );
  const selectedTestQueryData = useQuery(
    api.testQueries.getById,
    selectedQueryForThread && selectedThreadType === "test"
      ? { id: selectedQueryForThread as Id<"testQueries"> }
      : "skip"
  );

  const queryMessages = selectedThreadType === "fee" ? feeQueryMessages : testQueryMessages;
  const selectedQueryData = selectedThreadType === "fee" ? selectedFeeQueryData : selectedTestQueryData;

  // Combine and transform queries
  const combinedQueries = useMemo<QueryRow[]>(() => {
    const rows: QueryRow[] = [];

    // Transform fee queries
    if (feeQueries) {
      for (const q of feeQueries) {
        rows.push({
          _id: q._id,
          queryType: "fee",
          studentId: q.studentId,
          organizationId: q.organizationId,
          type: q.type,
          subject: q.subject,
          description: q.description,
          status: q.status,
          resolvedBy: q.resolvedBy,
          resolvedAt: q.resolvedAt,
          createdAt: q.createdAt,
          studentName: q.studentName,
          studentEmail: q.studentEmail,
          studentBatchName: q.studentBatchName,
          resolverName: q.resolverName,
          feeId: q.feeId,
          feeAmount: q.feeAmount,
          feeDueDate: q.feeDueDate,
          feeDescription: q.feeDescription,
        });
      }
    }

    // Transform test queries
    if (testQueries) {
      for (const q of testQueries) {
        rows.push({
          _id: q._id,
          queryType: "test",
          studentId: q.studentId,
          organizationId: q.organizationId,
          type: q.type,
          subject: q.subject,
          description: q.description,
          status: q.status,
          resolvedBy: q.resolvedBy,
          resolvedAt: q.resolvedAt,
          createdAt: q.createdAt,
          studentName: q.studentName,
          studentEmail: q.studentEmail,
          studentBatchName: q.studentBatchName,
          resolverName: q.resolverName,
          testId: q.testId,
          questionId: q.questionId,
          testTitle: q.testTitle,
          questionText: q.questionText,
          questionOptions: q.questionOptions,
          correctOptions: q.correctOptions,
          adminNote: q.adminNote,
        });
      }
    }

    // Sort by createdAt descending
    rows.sort((a, b) => b.createdAt - a.createdAt);

    return rows;
  }, [feeQueries, testQueries]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (queryMessages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [queryMessages]);

  const handleUpdateQueryStatus = () => {
    if (!selectedQuery || !newQueryStatus || !selectedQueryType) return;
    startUpdatingQuery(async () => {
      try {
        if (selectedQueryType === "fee") {
          await updateFeeQueryStatus({
            queryId: selectedQuery as Id<"feeQueries">,
            status: newQueryStatus as "open" | "in_progress" | "resolved" | "closed",
          });
        } else {
          await updateTestQueryStatus({
            queryId: selectedQuery as Id<"testQueries">,
            status: newQueryStatus as "open" | "in_progress" | "resolved" | "rejected" | "closed",
            adminNote: adminNote.trim() || undefined,
          });
        }
        toast({ title: "Query status updated" });
        setSelectedQuery(null);
        setSelectedQueryType(null);
        setNewQueryStatus("");
        setAdminNote("");
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
    if (!selectedQueryForThread || !replyMessage.trim() || !selectedThreadType) return;
    startSendingReply(async () => {
      try {
        if (selectedThreadType === "fee") {
          await addFeeMessage({
            queryId: selectedQueryForThread as Id<"feeQueries">,
            message: replyMessage.trim(),
          });
        } else {
          await addTestMessage({
            queryId: selectedQueryForThread as Id<"testQueries">,
            message: replyMessage.trim(),
          });
        }
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

  const openThreadView = (query: QueryRow) => {
    setSelectedQueryForThread(query._id);
    setSelectedThreadType(query.queryType);
  };

  const openStatusDialog = (query: QueryRow, status: string) => {
    setSelectedQuery(query._id);
    setSelectedQueryType(query.queryType);
    setNewQueryStatus(status);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (query: QueryRow) => {
    if (query.queryType === "fee") {
      return FEE_QUERY_TYPE_LABELS[query.type] || query.type;
    }
    return TEST_QUERY_TYPE_LABELS[query.type] || query.type;
  };

  const columns = useMemo<ColumnDef<QueryRow>[]>(() => [
    {
      accessorKey: "queryType",
      header: "Category",
      cell: ({ row }) => {
        const queryType = row.getValue("queryType") as string;
        return (
          <div className="flex items-center gap-1.5">
            {queryType === "fee" ? (
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            ) : (
              <FileQuestion className="h-4 w-4 text-blue-600" />
            )}
            <span className="text-xs font-medium">
              {queryType === "fee" ? "Fee" : "Test"}
            </span>
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
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
          {getTypeLabel(row.original)}
        </Badge>
      ),
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "context",
      header: "Context",
      cell: ({ row }) => {
        const query = row.original;
        if (query.queryType === "fee") {
          const feeDeleted = query.feeAmount === undefined || query.feeAmount === null;
          if (feeDeleted) {
            return (
              <span className="text-sm text-destructive italic">
                Fee deleted
              </span>
            );
          }
          return (
            <span className="font-mono text-sm">
              ₹{query.feeAmount!.toLocaleString("en-IN")}
            </span>
          );
        }
        const testDeleted = !query.testTitle || query.testTitle === "Unknown Test";
        if (testDeleted) {
          return (
            <span className="text-sm text-destructive italic">
              Test deleted
            </span>
          );
        }
        return (
          <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
            {query.testTitle}
          </span>
        );
      },
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
                status === "rejected" ? "border-red-500/50 text-red-600" :
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
          onClick: () => openThreadView(query),
        },
      ];

      if (query.status === "open" || query.status === "in_progress") {
        actions.push({
          label: "Mark Resolved",
          icon: <CheckCircle2 className="h-4 w-4" />,
          onClick: () => openStatusDialog(query, "resolved"),
        });
        if (query.queryType === "test") {
          actions.push({
            label: "Reject Query",
            icon: <XCircle className="h-4 w-4" />,
            onClick: () => openStatusDialog(query, "rejected"),
          });
        }
        actions.push({
          label: "Close Query",
          icon: <XCircle className="h-4 w-4" />,
          onClick: () => openStatusDialog(query, "closed"),
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
        { label: "Rejected", value: "rejected" },
        { label: "Closed", value: "closed" },
      ],
    },
    {
      columnId: "queryType",
      title: "Category",
      options: [
        { label: "Fee Queries", value: "fee" },
        { label: "Test Queries", value: "test" },
      ],
    },
  ], []);

  return (
    <>
      <AdminTable<QueryRow>
        columns={columns}
        data={combinedQueries}
        isLoading={feeQueries === undefined || testQueries === undefined}
        searchKey="studentName"
        searchPlaceholder="Search by student name..."
        title="Student Queries"
        description="Manage and respond to student queries about fees and test questions"
        emptyIcon={<MessageSquareText className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No queries yet"
        emptyDescription="Student queries will appear here"
        facetedFilters={facetedFilters}
        showColumnVisibility={true}
        showCard={false}
        onRowClick={(row) => openThreadView(row)}
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
            setSelectedQueryType(null);
            setNewQueryStatus("");
            setAdminNote("");
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
                  {selectedQueryType === "test" && (
                    <SelectItem value="rejected">Rejected</SelectItem>
                  )}
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedQueryType === "test" && (newQueryStatus === "resolved" || newQueryStatus === "rejected") && (
              <div className="space-y-2">
                <Label htmlFor="admin-note">Admin Note (optional)</Label>
                <Textarea
                  id="admin-note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note explaining the resolution or rejection..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isUpdatingQuery}
              onClick={() => {
                setSelectedQuery(null);
                setSelectedQueryType(null);
                setNewQueryStatus("");
                setAdminNote("");
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
            setSelectedThreadType(null);
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
                    onClick={() => {
                      setSelectedQueryForThread(null);
                      setSelectedThreadType(null);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base truncate flex items-center gap-2">
                      {selectedThreadType === "fee" ? (
                        <IndianRupee className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <FileQuestion className="h-4 w-4 text-blue-600 shrink-0" />
                      )}
                      {selectedQueryData.subject}
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      <button
                        type="button"
                        className="hover:underline cursor-pointer font-medium text-foreground/80"
                        onClick={() => setStudentSheetUserId(selectedQueryData.studentId)}
                      >
                        {selectedQueryData.studentName}
                      </button>
                      {(selectedQueryData as any).studentBatchName && (
                        <> • {(selectedQueryData as any).studentBatchName}</>
                      )}
                      {" • "}
                      {selectedThreadType === "fee"
                        ? FEE_QUERY_TYPE_LABELS[selectedQueryData.type]
                        : TEST_QUERY_TYPE_LABELS[selectedQueryData.type]}
                    </SheetDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${
                      selectedQueryData.status === "open" ? "border-amber-500/50 text-amber-600" :
                      selectedQueryData.status === "in_progress" ? "border-blue-500/50 text-blue-600" :
                      selectedQueryData.status === "resolved" ? "border-emerald-500/50 text-emerald-600" :
                      selectedQueryData.status === "rejected" ? "border-red-500/50 text-red-600" :
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
                  {selectedThreadType === "fee" && (
                    (selectedQueryData as any).feeAmount !== undefined && (selectedQueryData as any).feeAmount !== null ? (
                      <>
                        <span>Fee: ₹{(selectedQueryData as any).feeAmount?.toLocaleString("en-IN")}</span>
                        <span>•</span>
                        <span>Due: {(selectedQueryData as any).feeDueDate ? new Date((selectedQueryData as any).feeDueDate).toLocaleDateString("en-IN") : "N/A"}</span>
                      </>
                    ) : (
                      <span className="text-destructive italic">Fee record has been deleted</span>
                    )
                  )}
                  {selectedThreadType === "test" && (
                    (selectedQueryData as any).testTitle && (selectedQueryData as any).testTitle !== "Unknown Test" ? (
                      <span>Test: {(selectedQueryData as any).testTitle}</span>
                    ) : (
                      <span className="text-destructive italic">Test has been deleted</span>
                    )
                  )}
                  <span>•</span>
                  <span>Created: {new Date(selectedQueryData.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
                {/* Show question preview for test queries */}
                {selectedThreadType === "test" && (
                  <div className="mt-3 p-3 rounded-lg bg-background border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Question:</p>
                    {(selectedQueryData as any).questionText && (selectedQueryData as any).questionText !== "Unknown Question" ? (
                      <>
                        <p className="text-sm line-clamp-3">{(selectedQueryData as any).questionText}</p>
                        {(selectedQueryData as any).questionOptions && (selectedQueryData as any).questionOptions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {(selectedQueryData as any).questionOptions.map((opt: string, i: number) => (
                              <div
                                key={i}
                                className={`text-xs px-2 py-1 rounded ${
                                  (selectedQueryData as any).correctOptions?.includes(i)
                                    ? "bg-emerald-500/10 text-emerald-700"
                                    : "bg-muted"
                                }`}
                              >
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-destructive italic">Question has been deleted from the database</p>
                    )}
                  </div>
                )}
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
                          <button
                            type="button"
                            className="text-xs font-medium opacity-90 hover:underline cursor-pointer"
                            onClick={() => setStudentSheetUserId(selectedQueryData.studentId)}
                          >
                            {selectedQueryData.studentName}
                          </button>
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
                          {msg.senderRole === "admin" ? (
                            <span className="text-xs font-medium">Support (You)</span>
                          ) : (
                            <button
                              type="button"
                              className="text-xs font-medium opacity-90 hover:underline cursor-pointer"
                              onClick={() => setStudentSheetUserId(selectedQueryData!.studentId)}
                            >
                              {msg.senderName}
                            </button>
                          )}
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

                  {/* Admin note for resolved/rejected test queries */}
                  {selectedThreadType === "test" &&
                    (selectedQueryData.status === "resolved" || selectedQueryData.status === "rejected") &&
                    (selectedQueryData as any).adminNote && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg px-4 py-2 bg-muted border-l-4 border-primary">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Support Resolution Note
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{(selectedQueryData as any).adminNote}</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply input or status indicator */}
              <div className="px-6 py-4 border-t shrink-0">
                {selectedQueryData?.status === "resolved" ||
                selectedQueryData?.status === "rejected" ||
                selectedQueryData?.status === "closed" ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                    {selectedQueryData.status === "resolved" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>This query has been resolved</span>
                      </>
                    ) : selectedQueryData.status === "rejected" ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>This query has been rejected</span>
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
                        setSelectedQueryType(selectedThreadType);
                        setNewQueryStatus("resolved");
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Mark Resolved
                    </Button>
                    {selectedThreadType === "test" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedQuery(selectedQueryForThread);
                          setSelectedQueryType(selectedThreadType);
                          setNewQueryStatus("rejected");
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedQuery(selectedQueryForThread);
                        setSelectedQueryType(selectedThreadType);
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

      {/* Student Detail Sheet */}
      <UserDetailSheet
        userId={studentSheetUserId}
        open={!!studentSheetUserId}
        onOpenChange={(open) => {
          if (!open) setStudentSheetUserId(null);
        }}
      />
    </>
  );
}
