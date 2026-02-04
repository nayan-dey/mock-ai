"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { exportMultiSectionPdf, exportMultiSheetExcel, type ExportColumn } from "@/lib/export-utils";
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
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  formatDate,
  useToast,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
  Download,
  Loader2,
  X,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Clock,
  CircleCheck,
  CircleAlert,
  MoreHorizontal,
  FileSpreadsheet,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";
import { ConfirmDialog } from "./confirm-dialog";
import { getInitials } from "@/lib/utils";

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
    () => new Date().toISOString().split("T")[0]
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
  const organization = useQuery(
    api.organizations.getMyOrg,
    open ? undefined : "skip"
  );
  const currentAdmin = useQuery(
    api.users.getByClerkId,
    open && clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const userData = useQuery(
    api.users.getById,
    open && userId ? { id: userId as Id<"users"> } : "skip"
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
  const [isSuspending, startSuspending] = useTransition();

  const handleSuspend = () => {
    if (!currentAdmin || !userId) return;
    startSuspending(async () => {
      await suspendUser({
        userId: userId as Id<"users">,
        reason: suspendReason || undefined,
      });
      setShowSuspendDialog(false);
      setSuspendReason("");
    });
  };

  const [isUnsuspending, startUnsuspending] = useTransition();

  const handleUnsuspend = () => {
    if (!currentAdmin || !selectedBatchId || !userId) return;
    startUnsuspending(async () => {
      await unsuspendUser({
        userId: userId as Id<"users">,
        batchId: selectedBatchId as Id<"batches">,
      });
      setShowUnsuspendDialog(false);
      setSelectedBatchId("");
    });
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

  const [isSavingFee, startSavingFee] = useTransition();

  const handleFeeSubmit = () => {
    if (!currentAdmin || !amount || !dueDate || !userId) return;
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
          description: "Failed to save fee record.",
          variant: "destructive",
        });
      }
    });
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
        description: "Failed to update fee.",
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
        description: "Failed to delete fee.",
        variant: "destructive",
      });
    }
    setDeleteFeeId(null);
  };

  // --- Export helpers ---
  const buildExportData = () => {
    if (!user) return { sections: [], sheets: [] };

    const profileColumns: ExportColumn[] = [
      { header: "Field", key: "field" },
      { header: "Value", key: "value" },
    ];
    const profileData = [
      { field: "Name", value: user.name },
      { field: "Email", value: user.email },
      { field: "Role", value: user.role },
      { field: "Batch", value: batch?.name ?? "—" },
      { field: "Age", value: user.age ? `${user.age} years` : "—" },
      { field: "Joined", value: new Date(user.createdAt).toLocaleDateString("en-IN") },
      { field: "Status", value: user.isSuspended ? "Suspended" : "Active" },
    ];

    const sections: { title: string; data: Record<string, any>[]; columns: ExportColumn[] }[] = [
      { title: "Profile", data: profileData, columns: profileColumns },
    ];
    const sheets: { name: string; data: Record<string, any>[]; columns: ExportColumn[] }[] = [
      { name: "Profile", data: profileData, columns: profileColumns },
    ];

    if (isStudent && studentAnalytics) {
      const userRankEntry = globalLeaderboard?.find((e) => e.userId === userId);

      const analyticsColumns: ExportColumn[] = [
        { header: "Metric", key: "metric" },
        { header: "Value", key: "value" },
      ];
      const analyticsData = [
        { metric: "Tests Taken", value: String(studentAnalytics.totalTestsTaken) },
        { metric: "Average Score", value: studentAnalytics.averageScore.toFixed(1) },
        { metric: "Global Rank", value: userRankEntry?.rank ? `#${userRankEntry.rank}` : "—" },
        { metric: "Total Score", value: userRankEntry?.totalScore?.toFixed(1) ?? "—" },
      ];
      sections.push({ title: "Analytics", data: analyticsData, columns: analyticsColumns });
      sheets.push({ name: "Analytics", data: analyticsData, columns: analyticsColumns });

      // Subject Performance
      const subjectPerf = studentAnalytics.subjectWisePerformance ?? {};
      const subjectEntries = Object.entries(subjectPerf);
      if (subjectEntries.length > 0) {
        const subjectColumns: ExportColumn[] = [
          { header: "Subject", key: "subject" },
          { header: "Correct", key: "correct" },
          { header: "Total", key: "total" },
          { header: "Accuracy", key: "accuracy" },
        ];
        const subjectData = subjectEntries.map(([subject, data]: [string, any]) => ({
          subject,
          correct: String(data.correct),
          total: String(data.total),
          accuracy: data.total > 0 ? `${Math.round((data.correct / data.total) * 100)}%` : "0%",
        }));
        sections.push({ title: "Subject Performance", data: subjectData, columns: subjectColumns });
        sheets.push({ name: "Subject Performance", data: subjectData, columns: subjectColumns });
      }

      // Recent Tests
      if (studentAnalytics.recentAttempts.length > 0) {
        const testColumns: ExportColumn[] = [
          { header: "Test", key: "testTitle" },
          { header: "Score", key: "score" },
          { header: "Correct", key: "correct" },
          { header: "Wrong", key: "incorrect" },
          { header: "Skipped", key: "unanswered" },
          { header: "Date", key: "date" },
        ];
        const testData = studentAnalytics.recentAttempts.map((a: any) => ({
          testTitle: a.testTitle,
          score: a.score.toFixed(1),
          correct: String(a.correct),
          incorrect: String(a.incorrect),
          unanswered: String(a.unanswered),
          date: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-IN") : "—",
        }));
        sections.push({ title: "Recent Tests", data: testData, columns: testColumns });
        sheets.push({ name: "Recent Tests", data: testData, columns: testColumns });
      }
    }

    // Fees
    if (fees && fees.length > 0) {
      const feeColumns: ExportColumn[] = [
        { header: "Description", key: "description" },
        { header: "Amount", key: "amount" },
        { header: "Status", key: "status" },
        { header: "Due Date", key: "dueDate" },
        { header: "Paid Date", key: "paidDate" },
      ];
      const feeData = fees.map((f) => ({
        description: f.description || "Fee Payment",
        amount: `₹${f.amount.toLocaleString("en-IN")}`,
        status: f.status,
        dueDate: new Date(f.dueDate).toLocaleDateString("en-IN"),
        paidDate: f.status === "paid" && f.paidDate ? new Date(f.paidDate).toLocaleDateString("en-IN") : "—",
      }));
      sections.push({ title: "Fee Records", data: feeData, columns: feeColumns });
      sheets.push({ name: "Fees", data: feeData, columns: feeColumns });
    }

    return { sections, sheets };
  };

  const handleExportPDF = async () => {
    if (!user) return;
    const { sections } = buildExportData();
    if (sections.length === 0) return;
    await exportMultiSectionPdf(
      sections,
      `${user.name.replace(/\s+/g, "_")}_report`,
      `Student Report: ${user.name}`,
      organization?.name,
      organization?.resolvedLogoUrl
    );
    toast({ title: "PDF exported successfully" });
  };

  const handleExportExcel = async () => {
    if (!user) return;
    const { sheets } = buildExportData();
    if (sheets.length === 0) return;
    await exportMultiSheetExcel(
      sheets,
      `${user.name.replace(/\s+/g, "_")}_report`
    );
    toast({ title: "Excel exported successfully" });
  };

  const totalDue = useMemo(
    () =>
      fees?.filter((f) => f.status === "due").reduce((s, f) => s + f.amount, 0) ?? 0,
    [fees]
  );
  const totalPaid = useMemo(
    () =>
      fees?.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0) ?? 0,
    [fees]
  );

  // Check if all required data is loaded
  const isLoading = useMemo(() => {
    if (user === undefined) return true;
    if (user === null) return false;
    // For non-admin users, wait for fees
    if (user.role !== "admin" && fees === undefined) return true;
    // For students, wait for analytics data
    if (user.role === "student") {
      if (studentAnalytics === undefined) return true;
      if (globalLeaderboard === undefined) return true;
    }
    return false;
  }, [user, fees, studentAnalytics, globalLeaderboard]);

  // Get user rank entry
  const userRankEntry = globalLeaderboard?.find((e) => e.userId === userId);
  const globalRank = userRankEntry?.rank ?? null;

  // Subject performance calculations
  const subjectPerf = studentAnalytics?.subjectWisePerformance ?? {};
  const subjectEntries = Object.entries(subjectPerf).map(
    ([subject, data]) => ({
      subject,
      correct: (data as any).correct,
      total: (data as any).total,
      accuracy: (data as any).total > 0 ? Math.round(((data as any).correct / (data as any).total) * 100) : 0,
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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 flex flex-col overflow-hidden border-l  [&>button]:hidden"
          
        >
          {/* Custom Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">User Details</h2>
                <p className="text-xs text-muted-foreground">View and manage profile</p>
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
                {/* Profile Skeleton */}
                <div className="bg-background rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
                {/* Content Skeleton */}
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            ) : user === null ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">User not found</p>
                <p className="text-xs text-muted-foreground mt-1">This user may have been deleted</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Profile Card */}
                <div className="bg-background rounded-xl p-4 border">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg truncate">{user.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={handleExportPDF} className="gap-2 text-sm">
                              <FileText className="h-4 w-4" />
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportExcel} className="gap-2 text-sm">
                              <FileSpreadsheet className="h-4 w-4" />
                              Export Excel
                            </DropdownMenuItem>
                            {!isAdmin && (
                              <>
                                <Separator className="my-1" />
                                {user.isSuspended ? (
                                  <DropdownMenuItem onClick={openUnsuspendDialog} className="gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    Unsuspend User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => setShowSuspendDialog(true)}
                                    className="gap-2 text-sm text-red-600 focus:text-red-600"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Suspend User
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {user.isSuspended && (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="h-3 w-3" />
                            Suspended
                          </Badge>
                        )}
                        {batch && (
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            {batch.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="font-medium truncate">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                    {user.age && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Age</p>
                          <p className="font-medium">{user.age} years</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">{user.bio}</p>
                    </div>
                  )}
                </div>

                {/* Suspension Alert */}
                {user.isSuspended && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-red-800 dark:text-red-200">Account Suspended</p>
                        {user.suspendReason && (
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            {user.suspendReason}
                          </p>
                        )}
                        {user.suspendedAt && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            Suspended on {formatDate(user.suspendedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}


                {/* Student Analytics */}
                {isStudent && studentAnalytics && (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background rounded-xl p-4 border">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">Tests Taken</p>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold mt-1 tabular-nums">
                          {studentAnalytics.totalTestsTaken}
                        </p>
                      </div>
                      <div className="bg-background rounded-xl p-4 border">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">Global Rank</p>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className={`text-2xl font-bold mt-1 tabular-nums ${
                          globalRank === 1
                            ? "text-amber-500"
                            : globalRank && globalRank <= 3
                              ? "text-orange-500"
                              : ""
                        }`}>
                          {globalRank ? `#${globalRank}` : "—"}
                        </p>
                      </div>
                      <div className="bg-background rounded-xl p-4 border">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">Avg Score</p>
                          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold mt-1 tabular-nums">
                          {studentAnalytics.averageScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-background rounded-xl p-4 border">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">Total Score</p>
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold mt-1 tabular-nums">
                          {userRankEntry?.totalScore?.toFixed(1) ?? "—"}
                        </p>
                      </div>
                    </div>

                    {/* Best Subject */}
                    {bestSubject && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                            <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Best Subject</p>
                            <p className="font-semibold text-emerald-900 dark:text-emerald-100 truncate">{bestSubject.subject}</p>
                          </div>
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-0">
                            {bestSubject.accuracy}%
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Subject Performance */}
                    {subjectEntries.length > 0 && (
                      <div className="bg-background rounded-xl border">
                        <div className="px-4 py-3 border-b">
                          <h4 className="font-semibold text-sm">Subject Performance</h4>
                        </div>
                        <div className="p-4 space-y-4">
                          {subjectEntries
                            .sort((a, b) => b.accuracy - a.accuracy)
                            .map((s) => (
                              <div key={s.subject} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{s.subject}</span>
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    {s.correct}/{s.total} ({s.accuracy}%)
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      s.accuracy >= 70
                                        ? "bg-emerald-500"
                                        : s.accuracy >= 40
                                          ? "bg-amber-500"
                                          : "bg-red-500"
                                    }`}
                                    style={{ width: `${s.accuracy}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Tests */}
                    {studentAnalytics.recentAttempts.length > 0 && (
                      <div className="bg-background rounded-xl border">
                        <div className="px-4 py-3 border-b">
                          <h4 className="font-semibold text-sm">Recent Tests</h4>
                        </div>
                        <div className="divide-y">
                          {studentAnalytics.recentAttempts.slice(0, 5).map((attempt: any) => (
                            <div key={attempt._id} className="px-4 py-3 flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attempt.testTitle}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span className="text-emerald-600 tabular-nums">{attempt.correct}C</span>
                                  <span className="text-red-500 tabular-nums">{attempt.incorrect}W</span>
                                  <span className="tabular-nums">{attempt.unanswered}S</span>
                                  {attempt.submittedAt && (
                                    <>
                                      <span className="text-muted-foreground/50">·</span>
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
                              <div className="text-right">
                                <p className="text-sm font-semibold tabular-nums">{attempt.score.toFixed(1)}</p>
                                <p className="text-[10px] text-muted-foreground">score</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance Trend */}
                    {performanceTrend && performanceTrend.length > 1 && (
                      <div className="bg-background rounded-xl border">
                        <div className="px-4 py-3 border-b">
                          <h4 className="font-semibold text-sm">Score Trend</h4>
                        </div>
                        <div className="p-4">
                          <TooltipProvider delayDuration={0}>
                            <div className="flex items-end gap-1 h-24">
                              {(() => {
                                const maxScore = Math.max(
                                  ...performanceTrend.map((e: any) => e.score)
                                );
                                return performanceTrend.map((entry: any, i: number) => {
                                  const height = maxScore > 0
                                    ? (entry.score / maxScore) * 100
                                    : 0;
                                  return (
                                    <Tooltip key={i}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className="flex-1 rounded-t bg-primary/20 hover:bg-primary transition-colors cursor-pointer"
                                          style={{ height: `${Math.max(height, 8)}%` }}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="px-3 py-2 max-w-[200px]">
                                        <p className="font-medium text-sm truncate">{entry.testTitle}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs">
                                          <span className="tabular-nums">{entry.score.toFixed(1)} pts</span>
                                          <span className="text-muted-foreground">·</span>
                                          <span className="tabular-nums">{entry.accuracy}%</span>
                                          <span className="text-muted-foreground">·</span>
                                          <span>{entry.date}</span>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                });
                              })()}
                            </div>
                          </TooltipProvider>
                          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>{performanceTrend[0]?.date}</span>
                            <span>{performanceTrend[performanceTrend.length - 1]?.date}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {achievements && achievements.length > 0 && (
                      <div className="bg-background rounded-xl border">
                        <div className="px-4 py-3 border-b">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            Achievements
                          </h4>
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {achievements.map((a: any) => (
                              <div
                                key={a.id}
                                className="flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-3 py-1.5"
                              >
                                <span className="text-amber-600 dark:text-amber-400">
                                  {achievementIcons[a.id] ?? <Star className="h-4 w-4" />}
                                </span>
                                <span className="text-xs font-medium text-amber-800 dark:text-amber-200">{a.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty state for students with no data */}
                    {studentAnalytics.totalTestsTaken === 0 && (
                      <div className="bg-background rounded-xl border p-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                          <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium mt-3">No test activity yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This student hasn't taken any tests
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Fees Section */}
                {!isAdmin && (
                  <div className="bg-background rounded-xl border">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Fee Records
                      </h4>
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
                    <div className="p-4 border-b">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">Due</p>
                          <p className="text-lg font-bold text-red-700 dark:text-red-300 tabular-nums mt-0.5">
                            ₹{totalDue.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-center">
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Paid</p>
                          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                            ₹{totalPaid.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fee Records */}
                    {fees && fees.length > 0 ? (
                      <div className="divide-y">
                        {fees.map((fee) => (
                          <div key={fee._id} className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                fee.status === "due"
                                  ? "bg-red-100 dark:bg-red-900/30"
                                  : "bg-emerald-100 dark:bg-emerald-900/30"
                              }`}>
                                {fee.status === "due" ? (
                                  <CircleAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                                ) : (
                                  <CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium">{fee.description || "Fee Payment"}</p>
                                    <p className="text-lg font-bold tabular-nums">
                                      ₹{fee.amount.toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={fee.status === "paid" ? "success" : "destructive"}
                                    className="shrink-0"
                                  >
                                    {fee.status === "paid" ? "Paid" : "Due"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Due: {new Date(fee.dueDate).toLocaleDateString("en-IN")}
                                  {fee.status === "paid" && fee.paidDate && (
                                    <> · Paid: {new Date(fee.paidDate).toLocaleDateString("en-IN")}</>
                                  )}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
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
                                    className="h-7 gap-1 text-xs text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={() => setDeleteFeeId(fee._id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : fees ? (
                      <div className="p-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                          <IndianRupee className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium mt-3">No fee records</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add the first fee record for this student
                        </p>
                      </div>
                    ) : (
                      <div className="p-8 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
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
              disabled={isSuspending}
              onClick={() => setShowSuspendDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={isSuspending}>
              {isSuspending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending…
                </>
              ) : (
                "Suspend User"
              )}
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
              disabled={isUnsuspending}
              onClick={() => setShowUnsuspendDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUnsuspend} disabled={!selectedBatchId || isUnsuspending}>
              {isUnsuspending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unsuspending…
                </>
              ) : (
                "Unsuspend User"
              )}
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
                Amount (₹) <span className="text-destructive">*</span>
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
                  {editingFee ? "Updating…" : "Adding…"}
                </>
              ) : (
                editingFee ? "Update" : "Add Record"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
