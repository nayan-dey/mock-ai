"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DataTable,
  SortableHeader,
  ChartContainer,
  BarChart,
  type ColumnDef,
} from "@repo/ui";
import { useEffect } from "react";
import {
  Users,
  FileText,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";

interface LeaderboardEntry {
  userId: string;
  userName: string;
  rank: number;
  score: number;
  correct: number;
  timeTaken: number;
}

export default function AnalyticsPage() {
  const stats = useQuery(api.analytics.getAdminDashboard);
  const tests = useQuery(api.tests.listPublished);
  const [selectedTestId, setSelectedTestId] = useUrlState("test", "");

  // Auto-select first test when tests are loaded
  useEffect(() => {
    if (tests && tests.length > 0 && !selectedTestId) {
      setSelectedTestId(tests[0]._id);
    }
  }, [tests, selectedTestId]);

  const testAnalytics = useQuery(
    api.analytics.getTestAnalytics,
    selectedTestId ? { testId: selectedTestId as any } : "skip"
  );
  const leaderboard = useQuery(
    api.analytics.getLeaderboard,
    selectedTestId ? { testId: selectedTestId as any } : "skip"
  );

  const leaderboardColumns: ColumnDef<LeaderboardEntry>[] = [
    {
      accessorKey: "rank",
      header: ({ column }) => (
        <SortableHeader column={column} title="Rank" className="w-12" />
      ),
      cell: ({ row }) => {
        const rank = row.getValue("rank") as number;
        return (
          <div className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${
            rank === 1
              ? "bg-amber-500/10 text-amber-600"
              : rank === 2
                ? "bg-slate-400/10 text-slate-500"
                : rank === 3
                  ? "bg-orange-500/10 text-orange-600"
                  : "text-muted-foreground"
          }`}>
            {rank}
          </div>
        );
      },
    },
    {
      accessorKey: "userName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Student" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("userName")}</span>
      ),
    },
    {
      accessorKey: "score",
      header: ({ column }) => (
        <SortableHeader column={column} title="Score" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">{(row.getValue("score") as number).toFixed(1)}</span>
      ),
    },
    {
      accessorKey: "correct",
      header: ({ column }) => (
        <SortableHeader column={column} title="Correct" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.getValue("correct")}</span>
      ),
    },
    {
      accessorKey: "timeTaken",
      header: ({ column }) => (
        <SortableHeader column={column} title="Time" />
      ),
      cell: ({ row }) => {
        const timeTaken = row.getValue("timeTaken") as number;
        const minutes = Math.floor(timeTaken / 60000);
        const seconds = Math.floor((timeTaken % 60000) / 1000);
        return (
          <span className="tabular-nums text-muted-foreground">
            {minutes}m {seconds}s
          </span>
        );
      },
    },
  ];

  if (!stats) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16" />
                <Skeleton className="mt-1 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed platform statistics and test performance
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.publishedTests}</div>
            <p className="text-xs text-muted-foreground">
              Of {stats.totalTests} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Attempts</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">Total submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {stats.averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Across all attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Test-wise Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Test Analytics</CardTitle>
          <CardDescription className="text-xs">Select a test to view detailed performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select value={selectedTestId} onValueChange={setSelectedTestId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a test" />
              </SelectTrigger>
              <SelectContent>
                {tests?.map((test) => (
                  <SelectItem key={test._id} value={test._id}>
                    {test.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTestId && testAnalytics && testAnalytics.totalAttempts > 0 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Performance Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Attempts</span>
                      <span className="font-medium tabular-nums">
                        {testAnalytics.totalAttempts}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average Score</span>
                      <span className="font-medium tabular-nums">
                        {testAnalytics.averageScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Highest Score</span>
                      <span className="font-medium tabular-nums text-emerald-600">
                        {testAnalytics.highestScore}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lowest Score</span>
                      <span className="font-medium tabular-nums text-destructive">
                        {testAnalytics.lowestScore}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Distribution */}
                <ChartContainer
                  title="Score Distribution"
                  description="How students scored on this test"
                >
                  <BarChart
                    data={testAnalytics.scoreDistribution}
                    xKey="range"
                    yKey="count"
                    height={200}
                    color="hsl(var(--primary))"
                  />
                </ChartContainer>
              </div>

              {/* Leaderboard */}
              {leaderboard && leaderboard.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
                    <CardDescription className="text-xs">Students ranked by score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={leaderboardColumns}
                      data={leaderboard as LeaderboardEntry[]}
                      searchKey="userName"
                      searchPlaceholder="Search students..."
                      showPagination
                      pageSize={5}
                      emptyMessage="No entries found."
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {selectedTestId &&
            testAnalytics &&
            testAnalytics.totalAttempts === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <ClipboardCheck className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No attempts for this test yet
                </p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
