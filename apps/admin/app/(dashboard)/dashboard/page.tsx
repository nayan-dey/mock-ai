"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  ChartContainer,
  BarChart,
  Avatar,
  AvatarFallback,
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
import {
  Users,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Database,
  Loader2,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useUrlState } from "@/hooks/use-url-state";
import { getInitials } from "@/lib/utils";
import { ExportDropdown } from "@/components/export-dropdown";
import type { ExportColumn } from "@/lib/export-utils";

interface LeaderboardEntry {
  userId: string;
  userName: string;
  rank: number;
  score: number;
  correct: number;
  timeTaken: number;
}

export default function DashboardPage() {
  const { user } = useUser();
  const stats = useQuery(api.analytics.getAdminDashboard);
  const batchCount = useQuery(api.batches.countForOrg);
  const leaderboard = useQuery(api.analytics.getGlobalLeaderboard, {
    limit: 5,
  });
  const tests = useQuery(api.tests.listPublished);
  const [selectedTestId, setSelectedTestId] = useUrlState("test", "");

  // Auto-select first test when tests are loaded (must be before useQuery calls that depend on it)
  const effectiveTestId = selectedTestId || (tests && tests.length > 0 ? tests[0]._id : "");

  const testAnalytics = useQuery(
    api.analytics.getTestAnalytics,
    effectiveTestId ? { testId: effectiveTestId as any } : "skip"
  );
  const testLeaderboard = useQuery(
    api.analytics.getLeaderboard,
    effectiveTestId ? { testId: effectiveTestId as any } : "skip"
  );

  // Data for full org export — only fetch when user requests export
  const [exportRequested, setExportRequested] = useState(false);
  const organization = useQuery(api.organizations.getMyOrg);
  const allUsers = useQuery(api.users.list, exportRequested ? {} : "skip");
  const allFees = useQuery(api.fees.getAll, exportRequested ? undefined : "skip");
  const allBatches = useQuery(api.batches.list, exportRequested ? {} : "skip");

  const seedDatabase = useMutation(api.seed.seedDatabase);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleSeedDatabase = async () => {
    if (!user?.id) return;

    setIsSeeding(true);
    setSeedResult(null);
    try {
      const result = await seedDatabase({});
      setSeedResult(result.message);
    } catch (error) {
      setSeedResult("Error seeding database: " + (error as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  // ─── Full Org Export ──────────────────────────────────────────────────────
  const handleExportOpen = useCallback(() => setExportRequested(true), []);
  const orgExportReady = !!allUsers && !!allFees && !!allBatches && !!tests;

  const handleOrgExportExcel = async () => {
    if (!allUsers || !allFees || !allBatches || !tests) return;
    const { exportMultiSheetExcel } = await import("@/lib/export-utils");
    exportMultiSheetExcel(
      [
        {
          name: "Users",
          data: allUsers,
          columns: [
            { header: "Name", key: "name" },
            { header: "Email", key: "email" },
            { header: "Role", key: "role" },
            { header: "Joined", key: "createdAt", format: (v) => new Date(v).toLocaleDateString("en-IN") },
          ],
        },
        {
          name: "Fees",
          data: allFees,
          columns: [
            { header: "Student", key: "studentName" },
            { header: "Email", key: "studentEmail" },
            { header: "Amount", key: "amount", format: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
            { header: "Status", key: "status", format: (v) => (v === "paid" ? "Paid" : "Due") },
            { header: "Due Date", key: "dueDate", format: (v) => new Date(v).toLocaleDateString("en-IN") },
            { header: "Paid Date", key: "paidDate", format: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          ],
        },
        {
          name: "Batches",
          data: allBatches,
          columns: [
            { header: "Name", key: "name" },
            { header: "Description", key: "description", format: (v) => v || "" },
            { header: "Active", key: "isActive", format: (v) => (v ? "Yes" : "No") },
          ],
        },
        {
          name: "Tests",
          data: tests,
          columns: [
            { header: "Title", key: "title" },
            { header: "Status", key: "status" },
            { header: "Duration (min)", key: "duration", format: (v) => String(Math.round(v / 60)) },
            { header: "Total Marks", key: "totalMarks", format: (v) => String(v) },
          ],
        },
      ],
      "OrgData"
    );
  };

  const handleOrgExportPdf = async () => {
    if (!allUsers || !allFees || !allBatches || !tests) return;
    const { exportMultiSectionPdf } = await import("@/lib/export-utils");
    exportMultiSectionPdf(
      [
        {
          title: "Users",
          data: allUsers,
          columns: [
            { header: "Name", key: "name" },
            { header: "Email", key: "email" },
            { header: "Role", key: "role" },
            { header: "Joined", key: "createdAt", format: (v) => new Date(v).toLocaleDateString("en-IN") },
          ],
        },
        {
          title: "Fees",
          data: allFees,
          columns: [
            { header: "Student", key: "studentName" },
            { header: "Amount", key: "amount", format: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
            { header: "Status", key: "status", format: (v) => (v === "paid" ? "Paid" : "Due") },
            { header: "Due Date", key: "dueDate", format: (v) => new Date(v).toLocaleDateString("en-IN") },
          ],
        },
        {
          title: "Batches",
          data: allBatches,
          columns: [
            { header: "Name", key: "name" },
            { header: "Description", key: "description", format: (v) => v || "" },
            { header: "Active", key: "isActive", format: (v) => (v ? "Yes" : "No") },
          ],
        },
        {
          title: "Tests",
          data: tests,
          columns: [
            { header: "Title", key: "title" },
            { header: "Status", key: "status" },
            { header: "Duration (min)", key: "duration", format: (v) => String(Math.round(v / 60)) },
            { header: "Total Marks", key: "totalMarks", format: (v) => String(v) },
          ],
        },
      ],
      "OrgData",
      "Organization Data Export",
      organization?.name,
      organization?.resolvedLogoUrl
    );
  };

  const leaderboardColumns: ColumnDef<LeaderboardEntry>[] = useMemo(() => [
    {
      accessorKey: "rank",
      header: ({ column }) => (
        <SortableHeader column={column} title="Rank" />
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
        <span className="tabular-nums font-medium">{(row.getValue("score") as number).toFixed(2)}</span>
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
  ], []);

  // Loading state
  if (stats === undefined || batchCount === undefined) {
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

  // Batch gate: block all dashboard content until at least one batch exists
  if (batchCount === 0) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Create Your First Batch</CardTitle>
            <CardDescription>
              Before you can manage your organization, you need to create at
              least one student batch. Batches help you organize students and
              assign tests, notes, and classes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="gap-2">
              <Link href="/batches">
                Create Batch <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmpty = stats.totalQuestions === 0 && stats.totalTests === 0;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your test platform
          </p>
        </div>
        <ExportDropdown
          onExportExcel={handleOrgExportExcel}
          onExportPdf={handleOrgExportPdf}
          disabled={exportRequested && !orgExportReady}
          onOpen={handleExportOpen}
        />
      </div>

      {/* Seed Database Card - Show when empty (dev only) */}
      {process.env.NODE_ENV !== "production" && isEmpty && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Get Started with Sample Data</CardTitle>
            <CardDescription className="text-xs">
              Your database is empty. Add sample data to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              size="sm"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  Seeding…
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Add Sample Data
                </>
              )}
            </Button>
            {seedResult && (
              <p className={`mt-3 text-xs ${seedResult.includes("Error") ? "text-destructive" : "text-emerald-600"}`}>
                {seedResult}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stat Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled in your organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedTests} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Test submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Across all attempts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Students */}
      {!isEmpty && (
        <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Students</CardTitle>
              <CardDescription className="text-xs">
                Leaderboard by total score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard === undefined ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))
                ) : leaderboard.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No student activity yet
                  </p>
                ) : (
                  leaderboard.map((entry) => (
                    <div key={entry.userId} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(entry.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-sm font-medium leading-none">
                          {entry.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.testsCompleted} test{entry.testsCompleted !== 1 ? "s" : ""} completed
                          {entry.batchName && (
                            <span> &middot; {entry.batchName}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-sm font-medium tabular-nums">
                        {entry.totalScore.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
      )}

      {/* Test Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Test Analytics</CardTitle>
          <CardDescription className="text-xs">Select a test to view detailed performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select value={effectiveTestId} onValueChange={setSelectedTestId}>
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

          {effectiveTestId && testAnalytics && testAnalytics.totalAttempts > 0 && (
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
                    tooltipValueSuffix=" students"
                    showPercentage
                    xAxisLabel="Score Range"
                    yAxisLabel="Students"
                    tooltipSubtitle={tests?.find(t => t._id === effectiveTestId)?.title}
                  />
                </ChartContainer>
              </div>

              {/* Leaderboard */}
              {testLeaderboard && testLeaderboard.length > 0 && (
                <Card className="flex-1 min-h-0 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
                    <CardDescription className="text-xs">Students ranked by score</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 min-h-0 flex flex-col">
                    <DataTable
                      columns={leaderboardColumns}
                      data={testLeaderboard as LeaderboardEntry[]}
                      searchKey="userName"
                      searchPlaceholder="Search students..."
                      showPagination
                      pageSize={5}
                      emptyMessage="No entries found."
                      showColumnVisibility
                      rowClassName={() => "hover:bg-muted/50 transition-colors"}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {effectiveTestId &&
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
