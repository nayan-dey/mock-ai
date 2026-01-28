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
  type ColumnDef,
} from "@repo/ui";
import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Trophy,
  TrendingUp,
} from "lucide-react";

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
  const [selectedTestId, setSelectedTestId] = useState<string>("");

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
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue("rank") === 1
              ? "default"
              : row.getValue("rank") === 2
                ? "secondary"
                : "outline"
          }
        >
          #{row.getValue("rank")}
        </Badge>
      ),
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
      cell: ({ row }) => (row.getValue("score") as number).toFixed(1),
    },
    {
      accessorKey: "correct",
      header: ({ column }) => (
        <SortableHeader column={column} title="Correct" />
      ),
    },
    {
      accessorKey: "timeTaken",
      header: ({ column }) => (
        <SortableHeader column={column} title="Time" />
      ),
      cell: ({ row }) => {
        const timeTaken = row.getValue("timeTaken") as number;
        return `${Math.floor(timeTaken / 60000)}m ${Math.floor((timeTaken % 60000) / 1000)}s`;
      },
    },
  ];

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="mb-8 text-3xl font-bold">Analytics</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          View detailed platform statistics
        </p>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="min-h-[80px]">
          <CardContent className="flex h-full items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[80px]">
          <CardContent className="flex h-full items-center gap-4 p-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.publishedTests}</p>
              <p className="text-sm text-muted-foreground">Published Tests</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[80px]">
          <CardContent className="flex h-full items-center gap-4 p-4">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalAttempts}</p>
              <p className="text-sm text-muted-foreground">Test Attempts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[80px]">
          <CardContent className="flex h-full items-center gap-4 p-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {stats.averageScore.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Avg Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test-wise Analytics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Analytics</CardTitle>
          <CardDescription>Select a test to view detailed analytics</CardDescription>
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

          {selectedTestId && testAnalytics && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold">Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                    <p className="text-2xl font-bold">
                      {testAnalytics.totalAttempts}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Attempts
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                    <p className="text-2xl font-bold">
                      {testAnalytics.averageScore.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                  <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                    <p className="text-2xl font-bold text-success">
                      {testAnalytics.highestScore}
                    </p>
                    <p className="text-sm text-muted-foreground">Highest Score</p>
                  </div>
                  <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                    <p className="text-2xl font-bold text-destructive">
                      {testAnalytics.lowestScore}
                    </p>
                    <p className="text-sm text-muted-foreground">Lowest Score</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-semibold">Score Distribution</h3>
                {testAnalytics.scoreDistribution.map((item) => (
                  <div key={item.range} className="mb-2 flex items-center gap-2">
                    <span className="w-20 text-sm text-muted-foreground">
                      {item.range}
                    </span>
                    <div className="flex-1 rounded-full bg-muted">
                      <div
                        className="h-4 rounded-full bg-primary transition-all"
                        style={{
                          width: `${
                            testAnalytics.totalAttempts > 0
                              ? (item.count / testAnalytics.totalAttempts) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTestId && leaderboard && leaderboard.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 font-semibold">Leaderboard</h3>
              <DataTable
                columns={leaderboardColumns}
                data={leaderboard as LeaderboardEntry[]}
                searchKey="userName"
                searchPlaceholder="Search students..."
                showPagination
                pageSize={5}
                emptyMessage="No entries found."
              />
            </div>
          )}

          {selectedTestId &&
            testAnalytics &&
            testAnalytics.totalAttempts === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No attempts for this test yet
              </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
