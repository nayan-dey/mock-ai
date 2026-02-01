"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Input,
  ScrollArea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  formatDate,
  useToast,
} from "@repo/ui";
import {
  Mail,
  Calendar,
  Users,
  AlertTriangle,
  Ban,
  CheckCircle,
  IndianRupee,
  Plus,
  Trash2,
  Pencil,
  FileText,
  TrendingUp,
  ClipboardCheck,
  Trophy,
  Target,
  Award,
  Rocket,
  RefreshCcw,
  Flame,
  Star,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";
import { ConfirmDialog } from "./confirm-dialog";

interface UserDetailSheetProps {
  userId: string | null;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserDetailSheet({
  userId,
  open,
  onOpenChange,
}: UserDetailSheetProps) {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  // User actions state
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const [deleteFeeId, setDeleteFeeId] = useState<string | null>(null);
  const [markPaidFeeId, setMarkPaidFeeId] = useState<string | null>(null);
  const [markPaidDate, setMarkPaidDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Fee form state
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [feeStatus, setFeeStatus] = useState<"paid" | "due">("due");
  const [paidDate, setPaidDate] = useState("");
  const [description, setDescription] = useState("");

  // Queries
  const currentAdmin = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const userData = useQuery(
    api.users.getById,
    userId ? { id: userId as Id<"users"> } : "skip"
  );
  // Cast to any to access all possible fields from the Convex union type
  const user = userData as any;
  const batch = useQuery(
    api.batches.getById,
    user?.batchId ? { id: user.batchId } : "skip"
  );
  const allBatches = useQuery(api.batches.list, { activeOnly: true });
  const fees = useQuery(
    api.fees.getByStudent,
    open && userId ? { studentId: userId as Id<"users"> } : "skip"
  );

  // Student analytics queries
  const isStudent = user?.role === "student";
  const studentAnalytics = useQuery(
    api.analytics.getStudentAnalytics,
    open && userId && isStudent ? { userId: userId as Id<"users"> } : "skip"
  );
  const globalLeaderboard = useQuery(
    api.analytics.getGlobalLeaderboard,
    open && userId && isStudent ? { limit: 100 } : "skip"
  );
  const performanceTrend = useQuery(
    api.analytics.getStudentPerformanceTrend,
    open && userId && isStudent
      ? { userId: userId as Id<"users">, limit: 10 }
      : "skip"
  );
  const achievements = useQuery(
    api.analytics.getStudentAchievements,
    open && userId && isStudent ? { userId: userId as Id<"users"> } : "skip"
  );

  // User mutations
  const suspendUser = useMutation(api.users.suspendUser);
  const unsuspendUser = useMutation(api.users.unsuspendUser);

  // Fee mutations
  const createFee = useMutation(api.fees.create);
  const updateFee = useMutation(api.fees.update);
  const markAsPaid = useMutation(api.fees.markAsPaid);
  const removeFee = useMutation(api.fees.remove);

  const isAdmin = user?.role === "admin";

  // --- User handlers ---
  const handleSuspend = async () => {
    if (!currentAdmin || !userId) return;
    await suspendUser({
      userId: userId as Id<"users">,
      reason: suspendReason || undefined,
    });
    setShowSuspendDialog(false);
    setSuspendReason("");
  };

  const handleUnsuspend = async () => {
    if (!currentAdmin || !selectedBatchId || !userId) return;
    await unsuspendUser({
      userId: userId as Id<"users">,
      batchId: selectedBatchId as Id<"batches">,
    });
    setShowUnsuspendDialog(false);
    setSelectedBatchId("");
  };

  const openUnsuspendDialog = () => {
    setSelectedBatchId(user?.batchId || "");
    setShowUnsuspendDialog(true);
  };

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

  const handleFeeSubmit = async () => {
    if (!currentAdmin || !amount || !dueDate || !userId) return;
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
        toast({ title: "Fee updated" });
      } else {
        await createFee({
          studentId: userId as Id<"users">,
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
        description: err?.message || "Failed to save fee record.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async () => {
    if (!currentAdmin || !markPaidFeeId) return;
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
        description: err?.message || "Failed to update fee.",
        variant: "destructive",
      });
    }
    setMarkPaidFeeId(null);
    setMarkPaidDate(new Date().toISOString().split("T")[0]);
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
        description: err?.message || "Failed to delete fee.",
        variant: "destructive",
      });
    }
    setDeleteFeeId(null);
  };

  const totalDue =
    fees?.filter((f) => f.status === "due").reduce((s, f) => s + f.amount, 0) ??
    0;
  const totalPaid =
    fees
      ?.filter((f) => f.status === "paid")
      .reduce((s, f) => s + f.amount, 0) ?? 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col overflow-hidden">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              View and manage user information
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="mt-4 flex-1 -mr-3 pr-3">
            {user === undefined ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none" />
              </div>
            ) : user === null ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">User not found</p>
              </div>
            ) : (
              <div className="space-y-5 pr-4">
                {/* ── Profile ── */}
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 border-2">
                    <AvatarFallback className="text-xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mt-3 text-lg font-semibold truncate max-w-full">{user.name}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "destructive"
                          : user.role === "teacher"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                    {user.isSuspended && (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                  </div>
                </div>

                {/* ── Info ── */}
                <div className="space-y-2 rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    Joined {formatDate(user.createdAt)}
                  </div>
                  {batch && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 shrink-0" />
                      {batch.name}
                    </div>
                  )}
                  {user.age && (
                    <div className="text-muted-foreground">
                      Age: {user.age} years
                    </div>
                  )}
                </div>

                {/* ── Bio ── */}
                {user.bio && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    {user.bio}
                  </div>
                )}

                {/* ── Suspension Info ── */}
                {user.isSuspended && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      Account Suspended
                    </div>
                    {user.suspendReason && (
                      <p className="mt-1.5 text-xs text-red-700 dark:text-red-300">
                        <strong>Reason:</strong> {user.suspendReason}
                      </p>
                    )}
                    {user.suspendedAt && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Suspended on {formatDate(user.suspendedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Suspend / Unsuspend Actions ── */}
                {!isAdmin && (
                  <div>
                    {user.isSuspended ? (
                      <Button
                        className="w-full"
                        onClick={openUnsuspendDialog}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Unsuspend User
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setShowSuspendDialog(true)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend User
                      </Button>
                    )}
                  </div>
                )}

                {/* ── Fees Section ── */}
                {!isAdmin && (
                  <>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <IndianRupee className="h-4 w-4" />
                          Fees
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={openAddFeeDialog}
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>

                      {/* Fee Summary */}
                      <div className="mt-3 flex gap-3">
                        <div className="flex-1 rounded-lg border bg-muted/30 p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Due</p>
                          <p className="font-mono text-sm font-semibold text-destructive">
                            &#8377;{totalDue.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex-1 rounded-lg border bg-muted/30 p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="font-mono text-sm font-semibold text-emerald-600">
                            &#8377;{totalPaid.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fee Records */}
                    {fees && fees.length > 0 ? (
                      <div className="space-y-2">
                        {fees.map((fee) => (
                          <div
                            key={fee._id}
                            className={`rounded-lg border p-3 ${
                              fee.status === "due"
                                ? "border-destructive/20 bg-destructive/5"
                                : "bg-background"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium">
                                  {fee.description || "Fee Payment"}
                                </p>
                                <p className="font-mono text-base font-semibold">
                                  &#8377;{fee.amount.toLocaleString("en-IN")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Due:{" "}
                                  {new Date(fee.dueDate).toLocaleDateString(
                                    "en-IN"
                                  )}
                                  {fee.status === "paid" && fee.paidDate && (
                                    <>
                                      {" "}
                                      &middot; Paid:{" "}
                                      {new Date(
                                        fee.paidDate
                                      ).toLocaleDateString("en-IN")}
                                    </>
                                  )}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  fee.status === "paid"
                                    ? "success"
                                    : "destructive"
                                }
                                className="text-[10px]"
                              >
                                {fee.status === "paid" ? "Paid" : "Due"}
                              </Badge>
                            </div>
                            <div className="mt-2 flex gap-1">
                              {fee.status === "due" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1 text-xs"
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
                                onClick={() => openEditFeeDialog(fee as Fee)}
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                                onClick={() => setDeleteFeeId(fee._id)}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : fees ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <IndianRupee className="mb-3 h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No fee records
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          Add the first fee record for this student
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none" />
                      </div>
                    )}
                  </>
                )}

                {/* ── Student Analytics ── */}
                {isStudent && (() => {
                  const userRankEntry = globalLeaderboard?.find(
                    (e) => e.userId === userId
                  );
                  const globalRank = userRankEntry?.rank ?? null;

                  const subjectPerf = studentAnalytics?.subjectWisePerformance ?? {};
                  const subjectEntries = Object.entries(subjectPerf).map(
                    ([subject, data]) => ({
                      subject,
                      correct: data.correct,
                      total: data.total,
                      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
                    })
                  );
                  const bestSubject = subjectEntries.length > 0
                    ? subjectEntries.reduce((best, cur) =>
                        cur.accuracy > best.accuracy ? cur : best
                      )
                    : null;

                  const achievementIcons: Record<string, React.ReactNode> = {
                    "perfectionist": <Award className="h-4 w-4" />,
                    "speed-demon": <Rocket className="h-4 w-4" />,
                    "comeback-king": <RefreshCcw className="h-4 w-4" />,
                    "streak-master": <Flame className="h-4 w-4" />,
                  };

                  return (
                    <>
                      {/* Quick Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Tests Taken</CardTitle>
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="px-3 pb-3 pt-0">
                            <div className="text-xl font-bold tabular-nums">
                              {studentAnalytics?.totalTestsTaken ?? "—"}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Global Rank</CardTitle>
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="px-3 pb-3 pt-0">
                            <div className="text-xl font-bold tabular-nums">
                              {globalRank ? (
                                <span className={
                                  globalRank === 1
                                    ? "text-amber-600"
                                    : globalRank <= 3
                                      ? "text-orange-600"
                                      : ""
                                }>
                                  #{globalRank}
                                </span>
                              ) : "—"}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Score</CardTitle>
                            <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="px-3 pb-3 pt-0">
                            <div className="text-xl font-bold tabular-nums">
                              {studentAnalytics
                                ? studentAnalytics.averageScore.toFixed(1)
                                : "—"}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Total Score</CardTitle>
                            <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="px-3 pb-3 pt-0">
                            <div className="text-xl font-bold tabular-nums">
                              {userRankEntry?.totalScore?.toFixed(1) ?? "—"}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Best Subject */}
                      {bestSubject && (
                        <Card className="border-emerald-500/20 bg-emerald-500/5">
                          <CardContent className="flex items-center gap-3 p-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                              <Target className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Best Subject</p>
                              <p className="text-sm font-semibold">{bestSubject.subject}</p>
                            </div>
                            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                              {bestSubject.accuracy}% accuracy
                            </Badge>
                          </CardContent>
                        </Card>
                      )}

                      {/* Subject-wise Performance */}
                      {subjectEntries.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2 pt-3 px-3">
                            <CardTitle className="text-sm font-medium">Subject Performance</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-3 space-y-3">
                            {subjectEntries
                              .sort((a, b) => b.accuracy - a.accuracy)
                              .map((s) => (
                                <div key={s.subject} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{s.subject}</span>
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                      {s.correct}/{s.total} ({s.accuracy}%)
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-muted">
                                    <div
                                      className={`h-1.5 rounded-full transition-all ${
                                        s.accuracy >= 70
                                          ? "bg-emerald-500"
                                          : s.accuracy >= 40
                                            ? "bg-amber-500"
                                            : "bg-destructive"
                                      }`}
                                      style={{ width: `${s.accuracy}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Recent Test Results */}
                      {studentAnalytics && studentAnalytics.recentAttempts.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2 pt-3 px-3">
                            <CardTitle className="text-sm font-medium">Recent Tests</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-3 space-y-2">
                            {studentAnalytics.recentAttempts.map((attempt: any) => (
                              <div
                                key={attempt._id}
                                className="flex items-center justify-between rounded-lg border p-2.5"
                              >
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <p className="text-sm font-medium truncate">
                                    {attempt.testTitle}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="text-emerald-600 tabular-nums">{attempt.correct}C</span>
                                    <span className="text-destructive tabular-nums">{attempt.incorrect}W</span>
                                    <span className="tabular-nums">{attempt.unanswered}S</span>
                                    {attempt.submittedAt && (
                                      <>
                                        <span>&middot;</span>
                                        <span>
                                          {new Date(attempt.submittedAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right ml-3">
                                  <p className="text-sm font-semibold tabular-nums">
                                    {attempt.score.toFixed(1)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">score</p>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Performance Trend */}
                      {performanceTrend && performanceTrend.length > 1 && (
                        <Card>
                          <CardHeader className="pb-2 pt-3 px-3">
                            <CardTitle className="text-sm font-medium">Score Trend</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                            <div className="flex items-end gap-1 h-16">
                              {performanceTrend.map((entry: any, i: number) => {
                                const maxScore = Math.max(
                                  ...performanceTrend.map((e: any) => e.score)
                                );
                                const height = maxScore > 0
                                  ? (entry.score / maxScore) * 100
                                  : 0;
                                return (
                                  <div
                                    key={i}
                                    className="flex-1 rounded-t bg-primary/80 hover:bg-primary transition-colors"
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                    title={`${entry.testTitle}: ${entry.score} (${entry.accuracy}%)`}
                                  />
                                );
                              })}
                            </div>
                            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                              <span>{performanceTrend[0]?.date}</span>
                              <span>{performanceTrend[performanceTrend.length - 1]?.date}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Achievements */}
                      {achievements && achievements.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2 pt-3 px-3">
                            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                            <div className="flex flex-wrap gap-2">
                              {achievements.map((a: any) => (
                                <div
                                  key={a.id}
                                  className="flex items-center gap-1.5 rounded-full border bg-muted/30 px-3 py-1.5"
                                >
                                  <span className="text-amber-600">
                                    {achievementIcons[a.id] ?? <Star className="h-4 w-4" />}
                                  </span>
                                  <span className="text-xs font-medium">{a.name}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Empty state for students with no data */}
                      {studentAnalytics && studentAnalytics.totalTestsTaken === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <ClipboardCheck className="mb-2 h-8 w-8 text-muted-foreground/30" />
                          <p className="text-sm font-medium text-muted-foreground">
                            No test activity yet
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            This student hasn't taken any tests
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              This will prevent {user?.name} from accessing the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sheet-reason">Reason (optional)</Label>
              <Textarea
                id="sheet-reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <Dialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend User</DialogTitle>
            <DialogDescription>
              Restore {user?.name}'s access to the platform. You must assign
              them to a batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sheet-batch">
                Assign to Batch <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedBatchId}
                onValueChange={setSelectedBatchId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch (required)" />
                </SelectTrigger>
                <SelectContent>
                  {allBatches?.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The user will be assigned to this batch.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnsuspendDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUnsuspend} disabled={!selectedBatchId}>
              Unsuspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Fee as Paid</DialogTitle>
            <DialogDescription>
              Confirm payment and select the date it was paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mark-paid-date">Paid Date</Label>
              <Input
                id="mark-paid-date"
                type="date"
                value={markPaidDate}
                onChange={(e) => setMarkPaidDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMarkPaidFeeId(null);
                setMarkPaidDate(new Date().toISOString().split("T")[0]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={!markPaidDate}>
              Confirm Payment
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Edit Fee Record" : "Add Fee Record"}
            </DialogTitle>
            <DialogDescription>
              {editingFee
                ? "Update the fee record details."
                : `Add a new fee record for ${user?.name ?? "this student"}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fee-amount">
                Amount (&#8377;) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fee-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-dueDate">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fee-dueDate"
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
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {feeStatus === "paid" && (
              <div className="space-y-2">
                <Label htmlFor="fee-paidDate">Paid Date</Label>
                <Input
                  id="fee-paidDate"
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
                placeholder="e.g. January 2026 fees"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFeeDialog(false);
                resetFeeForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleFeeSubmit} disabled={!amount || !dueDate}>
              {editingFee ? "Update" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
