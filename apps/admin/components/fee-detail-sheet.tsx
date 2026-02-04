"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Input,
  ScrollArea,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  Progress,
} from "@repo/ui";
import {
  IndianRupee,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  X,
  Calendar,
  TrendingUp,
  Clock,
  CircleCheck,
  CircleAlert,
  Loader2,
  Users,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  History,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";
import { ConfirmDialog } from "./confirm-dialog";
import { getInitials } from "@/lib/utils";

interface FeeDetailSheetProps {
  studentId: string | null;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Fee {
  _id: string;
  studentId: string;
  amount: number;
  status: "paid" | "due";
  dueDate: number;
  paidDate?: number;
  description?: string;
  createdBy: string;
  createdAt: number;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function getMonthLabel(timestamp: number): string {
  const d = new Date(timestamp);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function getDaysOverdue(dueDate: number): number {
  const now = Date.now();
  if (dueDate >= now) return 0;
  return Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
}

export function FeeDetailSheet({
  studentId,
  studentName,
  open,
  onOpenChange,
}: FeeDetailSheetProps) {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  // Fee form state
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [feeStatus, setFeeStatus] = useState<"paid" | "due">("due");
  const [paidDate, setPaidDate] = useState("");
  const [description, setDescription] = useState("");

  // Action states
  const [deleteFeeId, setDeleteFeeId] = useState<string | null>(null);
  const [markPaidFeeId, setMarkPaidFeeId] = useState<string | null>(null);
  const [markPaidDate, setMarkPaidDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  // Queries
  const currentAdmin = useQuery(
    api.users.getByClerkId,
    open && clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const userData = useQuery(
    api.users.getById,
    open && studentId ? { id: studentId as Id<"users"> } : "skip"
  );
  const user = userData as any;
  const batch = useQuery(
    api.batches.getById,
    user?.batchId ? { id: user.batchId } : "skip"
  );
  const fees = useQuery(
    api.fees.getByStudent,
    open && studentId ? { studentId: studentId as Id<"users"> } : "skip"
  );
  const feeQueries = useQuery(
    api.feeQueries.getByStudent,
    open && studentId ? { studentId: studentId as Id<"users"> } : "skip"
  );

  // Group fee queries by fee ID
  const queriesByFeeId = useMemo(() => {
    if (!feeQueries) return new Map<string, typeof feeQueries>();
    const map = new Map<string, typeof feeQueries>();
    for (const query of feeQueries) {
      const existing = map.get(query.feeId) || [];
      existing.push(query);
      map.set(query.feeId, existing);
    }
    return map;
  }, [feeQueries]);

  const getQueryStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case "in_progress":
        return <Clock className="h-3 w-3 text-blue-500" />;
      case "resolved":
        return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case "closed":
        return <XCircle className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  // Mutations
  const createFee = useMutation(api.fees.create);
  const updateFee = useMutation(api.fees.update);
  const markAsPaid = useMutation(api.fees.markAsPaid);
  const removeFee = useMutation(api.fees.remove);

  // Computed values
  const stats = useMemo(() => {
    if (!fees) return { totalDue: 0, totalPaid: 0, dueCount: 0, paidCount: 0, paymentRate: 0 };

    const dueFees = fees.filter((f) => f.status === "due");
    const paidFees = fees.filter((f) => f.status === "paid");
    const totalDue = dueFees.reduce((s, f) => s + f.amount, 0);
    const totalPaid = paidFees.reduce((s, f) => s + f.amount, 0);
    const total = totalDue + totalPaid;
    const paymentRate = total > 0 ? Math.round((totalPaid / total) * 100) : 0;

    return {
      totalDue,
      totalPaid,
      dueCount: dueFees.length,
      paidCount: paidFees.length,
      paymentRate,
    };
  }, [fees]);

  // Group fees by month for better organization
  const feesByMonth = useMemo(() => {
    if (!fees) return [];

    const groups = new Map<string, Fee[]>();
    for (const fee of fees) {
      const monthKey = getMonthLabel(fee.dueDate);
      const existing = groups.get(monthKey);
      if (existing) {
        existing.push(fee as Fee);
      } else {
        groups.set(monthKey, [fee as Fee]);
      }
    }

    return Array.from(groups.entries())
      .sort((a, b) => {
        const parseMonth = (s: string) => {
          const [month, year] = s.split(" ");
          const monthIndex = MONTH_NAMES.indexOf(month);
          return new Date(parseInt(year), monthIndex).getTime();
        };
        return parseMonth(b[0]) - parseMonth(a[0]);
      });
  }, [fees]);

  // Overdue fees
  const overdueFees = useMemo(() => {
    if (!fees) return [];
    return fees.filter((f) => f.status === "due" && f.dueDate < Date.now()) as Fee[];
  }, [fees]);

  // --- Fee handlers ---
  const resetFeeForm = () => {
    setAmount("");
    setDueDate("");
    setFeeStatus("due");
    setPaidDate("");
    setDescription("");
    setEditingFee(null);
  };

  const openAddFeeDialog = () => {
    resetFeeForm();
    setShowAddFeeDialog(true);
  };

  const openEditFeeDialog = (fee: Fee) => {
    setEditingFee(fee);
    setAmount(fee.amount.toString());
    setDueDate(new Date(fee.dueDate).toISOString().split("T")[0]);
    setFeeStatus(fee.status);
    setPaidDate(
      fee.paidDate ? new Date(fee.paidDate).toISOString().split("T")[0] : ""
    );
    setDescription(fee.description || "");
    setShowAddFeeDialog(true);
  };

  const [isSavingFee, startSavingFee] = useTransition();

  const handleFeeSubmit = () => {
    if (!currentAdmin || !amount || !dueDate || !studentId) return;
    startSavingFee(async () => {
      try {
        const dueDateTimestamp = new Date(dueDate).getTime();
        const paidDateTimestamp = paidDate
          ? new Date(paidDate).getTime()
          : undefined;

        if (editingFee) {
          await updateFee({
            id: editingFee._id as Id<"fees">,
            amount: parseFloat(amount),
            status: feeStatus,
            dueDate: dueDateTimestamp,
            paidDate: paidDateTimestamp,
            description: description || undefined,
          });
          toast({ title: "Fee updated successfully" });
        } else {
          await createFee({
            studentId: studentId as Id<"users">,
            amount: parseFloat(amount),
            status: feeStatus,
            dueDate: dueDateTimestamp,
            paidDate: paidDateTimestamp,
            description: description || undefined,
          });
          toast({ title: "Fee record added" });
        }
        setShowAddFeeDialog(false);
        resetFeeForm();
      } catch (err: any) {
        toast({
          title: "Error",
          description: "Failed to save fee record.",
          variant: "destructive",
        });
      }
    });
  };

  const [isMarkingPaid, startMarkingPaid] = useTransition();

  const handleMarkAsPaid = () => {
    if (!currentAdmin || !markPaidFeeId) return;
    startMarkingPaid(async () => {
      try {
        const paidTimestamp = markPaidDate
          ? new Date(markPaidDate).getTime()
          : undefined;
        await markAsPaid({
          id: markPaidFeeId as Id<"fees">,
          paidDate: paidTimestamp,
        });
        toast({ title: "Marked as paid" });
      } catch (err: any) {
        toast({
          title: "Error",
          description: "Failed to update fee.",
          variant: "destructive",
        });
      }
      setMarkPaidFeeId(null);
      setMarkPaidDate(new Date().toISOString().split("T")[0]);
    });
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!currentAdmin) return;
    try {
      await removeFee({
        id: feeId as Id<"fees">,
      });
      toast({ title: "Fee record deleted" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to delete fee.",
        variant: "destructive",
      });
    }
    setDeleteFeeId(null);
  };

  const isLoading = user === undefined || fees === undefined;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden border-l [&>button]:hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Fee Structure</h2>
                <p className="text-xs text-muted-foreground">Payment history & records</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-20 rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                </div>
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            ) : user === null ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Student not found</p>
                <p className="text-xs text-muted-foreground mt-1">This student may have been deleted</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Student Info Card */}
                <div className="bg-background rounded-xl p-4 border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      {batch && (
                        <Badge variant="secondary" className="mt-1.5 gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          {batch.name}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={openAddFeeDialog}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Fee
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Due Amount */}
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 border border-red-100 dark:border-red-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      {stats.dueCount > 0 && (
                        <Badge variant="outline" className="text-[10px] border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30">
                          {stats.dueCount} pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-red-600/80 dark:text-red-400/80">Amount Due</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300 tabular-nums mt-0.5">
                      ₹{stats.totalDue.toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Paid Amount */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {stats.paidCount > 0 && (
                        <Badge variant="outline" className="text-[10px] border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
                          {stats.paidCount} paid
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">Amount Paid</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                      ₹{stats.totalPaid.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Payment Progress */}
                {(stats.totalDue > 0 || stats.totalPaid > 0) && (
                  <div className="bg-background rounded-xl p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Payment Progress</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{stats.paymentRate}%</span>
                    </div>
                    <Progress value={stats.paymentRate} className="h-2" />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>₹{stats.totalPaid.toLocaleString("en-IN")} paid</span>
                      <span>₹{(stats.totalDue + stats.totalPaid).toLocaleString("en-IN")} total</span>
                    </div>
                  </div>
                )}

                {/* Overdue Alert */}
                {overdueFees.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          {overdueFees.length} Overdue {overdueFees.length === 1 ? 'Payment' : 'Payments'}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                          Total overdue: ₹{overdueFees.reduce((s, f) => s + f.amount, 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fee Records by Month */}
                <div className="bg-background rounded-xl border overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        Fee Records
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {fees?.length || 0} total
                      </span>
                    </div>
                  </div>

                  {fees && fees.length > 0 ? (
                    <div className="divide-y">
                      {feesByMonth.map(([month, monthFees]) => (
                        <div key={month}>
                          {/* Month Header */}
                          <div className="px-4 py-2 bg-muted/20 flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">{month}</span>
                            <span className="text-xs text-muted-foreground">
                              ({monthFees.length} {monthFees.length === 1 ? 'record' : 'records'})
                            </span>
                          </div>

                          {/* Month Fees */}
                          <div className="divide-y divide-dashed">
                            {monthFees.map((fee) => {
                              const isOverdue = fee.status === "due" && fee.dueDate < Date.now();
                              const daysOverdue = getDaysOverdue(fee.dueDate);

                              return (
                                <div
                                  key={fee._id}
                                  className={`p-4 transition-colors hover:bg-muted/30 ${
                                    isOverdue ? "bg-red-50/50 dark:bg-red-950/10" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                      fee.status === "due"
                                        ? isOverdue
                                          ? "bg-red-100 dark:bg-red-900/30"
                                          : "bg-amber-100 dark:bg-amber-900/30"
                                        : "bg-emerald-100 dark:bg-emerald-900/30"
                                    }`}>
                                      {fee.status === "due" ? (
                                        isOverdue ? (
                                          <CircleAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        ) : (
                                          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        )
                                      ) : (
                                        <CircleCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {fee.description || "Fee Payment"}
                                          </p>
                                          <p className="text-lg font-bold tabular-nums">
                                            ₹{fee.amount.toLocaleString("en-IN")}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${
                                              fee.status === "paid"
                                                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                : isOverdue
                                                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                                  : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                            }`}
                                          >
                                            {fee.status === "paid" ? "Paid" : isOverdue ? "Overdue" : "Due"}
                                          </Badge>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          Due: {new Date(fee.dueDate).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                          })}
                                        </span>
                                        {fee.status === "paid" && fee.paidDate && (
                                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle className="h-3 w-3" />
                                            Paid: {new Date(fee.paidDate).toLocaleDateString("en-IN", {
                                              day: "numeric",
                                              month: "short"
                                            })}
                                          </span>
                                        )}
                                        {isOverdue && (
                                          <span className="text-red-600 dark:text-red-400 font-medium">
                                            {daysOverdue}d overdue
                                          </span>
                                        )}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center gap-1 mt-2.5">
                                        {fee.status === "due" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 gap-1.5 text-xs"
                                            onClick={() => {
                                              setMarkPaidDate(new Date().toISOString().split("T")[0]);
                                              setMarkPaidFeeId(fee._id);
                                            }}
                                          >
                                            <CheckCircle className="h-3 w-3" />
                                            Mark Paid
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 gap-1 text-xs"
                                          onClick={() => openEditFeeDialog(fee)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 gap-1 text-xs text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                          onClick={() => setDeleteFeeId(fee._id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                          Delete
                                        </Button>
                                      </div>

                                      {/* Fee Queries */}
                                      {queriesByFeeId.get(fee._id)?.length ? (
                                        <div className="mt-3 pt-3 border-t border-dashed">
                                          <div className="flex items-center gap-1.5 mb-2">
                                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">
                                              Student Queries ({queriesByFeeId.get(fee._id)?.length})
                                            </span>
                                          </div>
                                          <div className="space-y-2">
                                            {queriesByFeeId.get(fee._id)?.map((query) => (
                                              <div
                                                key={query._id}
                                                className={`rounded-lg p-2.5 text-xs ${
                                                  query.status === "open" ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" :
                                                  query.status === "in_progress" ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" :
                                                  "bg-muted/50 border"
                                                }`}
                                              >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                  {getQueryStatusIcon(query.status)}
                                                  <span className="font-medium">{query.subject}</span>
                                                  <Badge variant="outline" className="text-[10px] ml-auto">
                                                    {query.type.replace("_", " ")}
                                                  </Badge>
                                                </div>
                                                <p className="text-muted-foreground">{query.description}</p>
                                                {query.resolvedBy && query.resolverName && (
                                                  <div className="mt-2 pt-2 border-t border-dashed">
                                                    <p className="text-[10px] text-muted-foreground">
                                                      {query.status === "resolved" ? "Resolved" : "Closed"} by {query.resolverName}
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium mt-3">No fee records yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add the first fee record for this student
                      </p>
                      <Button
                        size="sm"
                        className="mt-4 gap-1.5"
                        onClick={openAddFeeDialog}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add First Record
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Mark as Paid Confirmation */}
      <Dialog
        open={!!markPaidFeeId}
        onOpenChange={(o) => {
          if (!o) {
            setMarkPaidFeeId(null);
            setMarkPaidDate(new Date().toISOString().split("T")[0]);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Fee as Paid</DialogTitle>
            <DialogDescription>
              Confirm the payment and select the date it was received.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fee-sheet-paid-date">Payment Date</Label>
              <Input
                id="fee-sheet-paid-date"
                type="date"
                value={markPaidDate}
                onChange={(e) => setMarkPaidDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isMarkingPaid}
              onClick={() => {
                setMarkPaidFeeId(null);
                setMarkPaidDate(new Date().toISOString().split("T")[0]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={!markPaidDate || isMarkingPaid}
            >
              {isMarkingPaid ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fee Confirmation */}
      <ConfirmDialog
        open={!!deleteFeeId}
        onOpenChange={(open) => { if (!open) setDeleteFeeId(null); }}
        title="Delete Fee Record"
        description="Are you sure you want to delete this fee record? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteFeeId) return handleDeleteFee(deleteFeeId); }}
      />

      {/* Add/Edit Fee Dialog */}
      <Dialog
        open={showAddFeeDialog}
        onOpenChange={(o) => {
          setShowAddFeeDialog(o);
          if (!o) resetFeeForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Edit Fee Record" : "Add Fee Record"}
            </DialogTitle>
            <DialogDescription>
              {editingFee
                ? "Update the fee record details below."
                : `Create a new fee record for ${studentName}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fee-amount">
                Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fee-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  min="0"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-due-date">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fee-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-status">Status</Label>
              <Select
                value={feeStatus}
                onValueChange={(val) => setFeeStatus(val as "paid" | "due")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Due
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Paid
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {feeStatus === "paid" && (
              <div className="space-y-2">
                <Label htmlFor="fee-paid-date">Paid Date</Label>
                <Input
                  id="fee-paid-date"
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fee-description">Description</Label>
              <Input
                id="fee-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. January 2026 tuition fee"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isSavingFee}
              onClick={() => {
                setShowAddFeeDialog(false);
                resetFeeForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleFeeSubmit} disabled={!amount || !dueDate || isSavingFee}>
              {isSavingFee ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingFee ? "Updating..." : "Adding..."}
                </>
              ) : (
                editingFee ? "Update Record" : "Add Record"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
