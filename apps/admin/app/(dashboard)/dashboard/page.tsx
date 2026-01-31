"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
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
  PieChart,
  Avatar,
  AvatarFallback,
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

export default function DashboardPage() {
  const { user } = useUser();
  const stats = useQuery(api.analytics.getAdminDashboard);
  const batchCount = useQuery(api.batches.countForOrg);
  const leaderboard = useQuery(api.analytics.getGlobalLeaderboard, {
    limit: 5,
  });
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
              <Link href="/batches/new">
                Create Batch <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmpty = stats.totalQuestions === 0 && stats.totalTests === 0;

  // Bar chart data from dashboard stats
  const overviewData = [
    { name: "Students", value: stats.totalStudents },
    { name: "Tests", value: stats.totalTests },
    { name: "Published", value: stats.publishedTests },
    { name: "Questions", value: stats.totalQuestions },
    { name: "Attempts", value: stats.totalAttempts },
  ];

  // Pie chart data
  const distributionData = [
    { name: "Published Tests", value: stats.publishedTests, color: "hsl(var(--primary))" },
    { name: "Draft Tests", value: Math.max(stats.totalTests - stats.publishedTests, 0), color: "hsl(var(--muted-foreground))" },
    { name: "Questions", value: stats.totalQuestions, color: "hsl(142 71% 45%)" },
  ].filter((d) => d.value > 0);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your test platform
        </p>
      </div>

      {/* Seed Database Card - Show when empty */}
      {isEmpty && (
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

      {/* Charts Section */}
      {!isEmpty && (
        <div className="grid gap-4 md:grid-cols-7">
          {/* Overview Bar Chart */}
          <ChartContainer
            title="Overview"
            description="Platform statistics at a glance"
            className="md:col-span-4"
          >
            <BarChart
              data={overviewData}
              xKey="name"
              yKey="value"
              height={300}
              barColors={[
                "hsl(var(--primary))",
                "hsl(221 83% 53%)",
                "hsl(142 71% 45%)",
                "hsl(262 83% 58%)",
                "hsl(24 95% 53%)",
              ]}
            />
          </ChartContainer>

          {/* Recent Activity - Top Students */}
          <Card className="md:col-span-3">
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
                        </p>
                      </div>
                      <div className="text-sm font-medium tabular-nums">
                        {entry.totalScore}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Charts Row */}
      {!isEmpty && distributionData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <ChartContainer
            title="Content Distribution"
            description="Tests and questions breakdown"
          >
            <PieChart
              data={distributionData}
              height={280}
              innerRadius={60}
              outerRadius={90}
            />
          </ChartContainer>

          {/* Summary stats card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
              <CardDescription className="text-xs">
                Key metrics summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Published Rate</span>
                  <span className="text-sm font-medium">
                    {stats.totalTests > 0
                      ? ((stats.publishedTests / stats.totalTests) * 100).toFixed(0)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${stats.totalTests > 0 ? (stats.publishedTests / stats.totalTests) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Questions/Test</span>
                  <span className="text-sm font-medium tabular-nums">
                    {stats.totalTests > 0
                      ? (stats.totalQuestions / stats.totalTests).toFixed(1)
                      : 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Attempts/Test</span>
                  <span className="text-sm font-medium tabular-nums">
                    {stats.totalTests > 0
                      ? (stats.totalAttempts / stats.totalTests).toFixed(1)
                      : 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Questions</span>
                  <span className="text-sm font-medium tabular-nums">
                    {stats.totalQuestions}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Published Tests</span>
                  <span className="text-sm font-medium tabular-nums">
                    {stats.publishedTests}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
