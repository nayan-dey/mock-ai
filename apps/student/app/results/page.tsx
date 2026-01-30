"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  formatDate,
  Progress,
  DataTable,
  SortableHeader,
  BackButton,
  type ColumnDef,
} from "@repo/ui";
import { FileText, Eye, ArrowRight, CheckCircle2, XCircle, Trophy, Clock, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface AttemptData {
  _id: string;
  score: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  totalQuestions: number;
  submittedAt: number | null;
  accuracy: number;
  testTitle: string;
  percentage?: number;
  totalMarks?: number;
  answerKeyPublished?: boolean;
}

export default function ResultsPage() {
  const { user } = useUser();
  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const analytics = useQuery(
    api.analytics.getStudentAnalytics,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  );
  const attempts = useQuery(
    api.attempts.getByUser,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  );

  const submittedAttempts = useMemo(() => {
    if (!attempts) return [];
    return attempts
      .filter((a) => a.status === "submitted")
      .map((a) => ({
        ...a,
        // Use percentage from backend (score/totalMarks) for consistency with detail page
        accuracy: a.percentage ?? 0,
      }))
      .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  }, [attempts]);

  // Table columns for TanStack Table
  const columns: ColumnDef<AttemptData>[] = useMemo(() => [
    {
      accessorKey: "testTitle",
      header: ({ column }) => (
        <SortableHeader column={column} title="Test" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue("testTitle") || "Unknown Test"}
        </span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <SortableHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("submittedAt") ? formatDate(row.getValue("submittedAt") as number) : "-"}
        </span>
      ),
    },
    {
      accessorKey: "score",
      header: ({ column }) => (
        <SortableHeader column={column} title="Score" />
      ),
      cell: ({ row }) => {
        if (!row.original.answerKeyPublished) {
          return <Badge variant="secondary">Pending</Badge>;
        }
        return (
          <span className="text-base font-semibold tabular-nums">
            {(row.getValue("score") as number).toFixed(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "correct",
      header: ({ column }) => (
        <SortableHeader column={column} title="Correct" />
      ),
      cell: ({ row }) => {
        if (!row.original.answerKeyPublished) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="tabular-nums text-emerald-600">
            {row.getValue("correct")}
          </span>
        );
      },
    },
    {
      accessorKey: "incorrect",
      header: ({ column }) => (
        <SortableHeader column={column} title="Incorrect" />
      ),
      cell: ({ row }) => {
        if (!row.original.answerKeyPublished) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="tabular-nums text-red-600">
            {row.getValue("incorrect")}
          </span>
        );
      },
    },
    {
      accessorKey: "accuracy",
      header: ({ column }) => (
        <SortableHeader column={column} title="Accuracy" />
      ),
      cell: ({ row }) => {
        if (!row.original.answerKeyPublished) return <span className="text-muted-foreground">—</span>;
        const accuracy = row.getValue("accuracy") as number;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${accuracy >= 60 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {accuracy.toFixed(0)}%
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Link href={`/results/${row.original._id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ], []);

  if (!attempts || !dbUser) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate overall stats
  const totalTests = submittedAttempts.length;
  const totalCorrect = submittedAttempts.reduce((acc, a) => acc + a.correct, 0);
  const totalQuestions = submittedAttempts.reduce((acc, a) => acc + a.totalQuestions, 0);
  const avgAccuracy = totalQuestions > 0
    ? (totalCorrect / totalQuestions) * 100
    : 0;

  // Get subject performance data
  const subjectData = analytics?.subjectWisePerformance
    ? Object.entries(analytics.subjectWisePerformance).map(([subject, data]) => ({
        subject,
        correct: data.correct,
        total: data.total,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }))
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <BackButton href="/me" />
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
          <p className="text-sm text-muted-foreground">
            Track your performance across all tests
          </p>
        </div>
      </div>

      {submittedAttempts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No results yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete a test to see your results here
            </p>
            <Link href="/tests">
              <Button className="mt-4" size="sm">
                Browse Tests
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Tests</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{totalTests}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Correct</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
                  {totalCorrect}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {avgAccuracy.toFixed(0)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subject Performance */}
          {subjectData.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Subject Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjectData.map((subject) => (
                  <div key={subject.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{subject.subject}</span>
                      <span className="tabular-nums font-medium">
                        {subject.correct}/{subject.total}
                        <span className="ml-2 text-muted-foreground">
                          ({subject.accuracy}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          subject.accuracy >= 70
                            ? "bg-emerald-500"
                            : subject.accuracy >= 40
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${subject.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mobile Result Cards */}
          <div className="space-y-4 md:hidden">
            <h2 className="text-sm font-medium text-muted-foreground">Recent Tests</h2>
            {submittedAttempts.slice(0, 10).map((attempt) => {
              const isPending = !attempt.answerKeyPublished;
              return (
                <Link key={attempt._id} href={`/results/${attempt._id}`}>
                  <Card className="transition-colors hover:bg-muted/50 my-3">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Score Circle or Pending */}
                        {isPending ? (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Clock className="h-6 w-6 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                            <svg className="h-14 w-14 -rotate-90">
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-muted"
                              />
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${attempt.accuracy * 1.51} 151`}
                                className={attempt.accuracy >= 60 ? "text-emerald-500" : "text-amber-500"}
                              />
                            </svg>
                            <span className="absolute text-sm font-semibold tabular-nums">
                              {attempt.accuracy.toFixed(0)}%
                            </span>
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {attempt.testTitle || "Unknown Test"}
                          </p>
                          {isPending ? (
                            <Badge variant="secondary" className="mt-1">Results Pending</Badge>
                          ) : (
                            <>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-semibold tabular-nums">
                                  {attempt.score.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">points</span>
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  {attempt.correct}
                                </span>
                                <span className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  {attempt.incorrect}
                                </span>
                                <span>
                                  {attempt.submittedAt ? formatDate(attempt.submittedAt) : "-"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Test History</CardTitle>
              <CardDescription className="text-xs">
                {submittedAttempts.length} test{submittedAttempts.length !== 1 && "s"} completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={submittedAttempts as AttemptData[]}
                showPagination
                pageSize={5}
                emptyMessage="No test results yet."
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
