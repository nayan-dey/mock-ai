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
  ChartContainer,
  RadarChart,
  PageHeader,
  DataTable,
  SortableHeader,
  type ColumnDef,
} from "@repo/ui";
import { FileText, Eye, BarChart3, ArrowRight, CheckCircle2, XCircle, Trophy } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface AttemptData {
  _id: string;
  score: number;
  correct: number;
  incorrect: number;
  totalQuestions: number;
  submittedAt: number | null;
  accuracy: number;
}

export default function ResultsPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, {
    clerkId: user?.id ?? "",
  });

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
        accuracy: a.correct + a.incorrect > 0
          ? (a.correct / (a.correct + a.incorrect)) * 100
          : 0,
      }));
  }, [attempts]);

  // Table columns for TanStack Table
  const columns: ColumnDef<AttemptData>[] = useMemo(() => [
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <SortableHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("submittedAt") ? formatDate(row.getValue("submittedAt") as number) : "-"}
        </span>
      ),
    },
    {
      accessorKey: "score",
      header: ({ column }) => (
        <SortableHeader column={column} title="Score" />
      ),
      cell: ({ row }) => (
        <span className="font-serif text-lg font-bold">
          {(row.getValue("score") as number).toFixed(1)}
        </span>
      ),
    },
    {
      accessorKey: "correct",
      header: ({ column }) => (
        <SortableHeader column={column} title="Correct" />
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5 text-success">
          <CheckCircle2 className="h-4 w-4" />
          {row.getValue("correct")}
        </span>
      ),
    },
    {
      accessorKey: "incorrect",
      header: ({ column }) => (
        <SortableHeader column={column} title="Incorrect" />
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5 text-destructive">
          <XCircle className="h-4 w-4" />
          {row.getValue("incorrect")}
        </span>
      ),
    },
    {
      accessorKey: "accuracy",
      header: ({ column }) => (
        <SortableHeader column={column} title="Accuracy" />
      ),
      cell: ({ row }) => {
        const accuracy = row.getValue("accuracy") as number;
        return (
          <Badge variant={accuracy >= 60 ? "success" : "destructive"}>
            {accuracy.toFixed(0)}%
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Link href={`/results/${row.original._id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </Link>
        </div>
      ),
    },
  ], []);

  if (!attempts || !dbUser) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="mb-4 h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall stats
  const totalTests = submittedAttempts.length;
  const avgScore = totalTests > 0
    ? submittedAttempts.reduce((acc, a) => acc + a.score, 0) / totalTests
    : 0;
  const totalCorrect = submittedAttempts.reduce((acc, a) => acc + a.correct, 0);
  const totalIncorrect = submittedAttempts.reduce((acc, a) => acc + a.incorrect, 0);
  const avgAccuracy = totalCorrect + totalIncorrect > 0
    ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        title="My Results"
        description="View your test history and performance"
      />

      {submittedAttempts.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 sm:py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold">No Results Yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Complete a test to see your results here.
            </p>
            <Link href="/tests">
              <Button className="mt-6 gap-2">
                Browse Tests
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold sm:text-3xl">{totalTests}</p>
                  <p className="text-xs text-muted-foreground">Tests Taken</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 sm:text-3xl">{totalCorrect}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-red-500/5 to-red-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600 sm:text-3xl">{totalIncorrect}</p>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold sm:text-3xl">{avgAccuracy.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Avg Accuracy</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Performance Radar Chart */}
          {analytics && Object.keys(analytics.subjectWisePerformance).length > 0 && (
            <div className="mb-6">
              <ChartContainer
                title="Subject Performance"
                description="Your accuracy across different subjects"
              >
                <div className="h-[180px] sm:h-[220px]">
                  <RadarChart
                    data={Object.entries(analytics.subjectWisePerformance).map(
                      ([subject, data]) => ({
                        subject,
                        value: data.total > 0
                          ? Math.round((data.correct / data.total) * 100)
                          : 0,
                        fullMark: 100,
                      })
                    )}
                    height={180}
                    color="hsl(var(--primary))"
                    fillOpacity={0.25}
                    legendLabel="Accuracy %"
                  />
                </div>
              </ChartContainer>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="space-y-2 md:hidden">
            {submittedAttempts.map((attempt) => (
              <Card key={attempt._id} className="overflow-hidden border-2 border-transparent transition-all hover:border-primary/20">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-xl font-bold">
                        {attempt.score.toFixed(1)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {attempt.submittedAt
                          ? formatDate(attempt.submittedAt)
                          : "-"}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          {attempt.correct}
                        </span>
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3" />
                          {attempt.incorrect}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={attempt.accuracy >= 60 ? "success" : "destructive"}
                        className="px-2 py-0.5"
                      >
                        {attempt.accuracy.toFixed(0)}%
                      </Badge>
                      <Link href={`/results/${attempt._id}`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View with TanStack Table */}
          <Card className="hidden overflow-hidden md:block">
            <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Test History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {submittedAttempts.length} test{submittedAttempts.length !== 1 && "s"}{" "}
                    completed
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <DataTable
                columns={columns}
                data={submittedAttempts as AttemptData[]}
                showPagination
                pageSize={10}
                emptyMessage="No test results yet."
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
