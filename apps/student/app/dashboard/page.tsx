"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  Button,
  formatDate,
  ChartContainer,
  LineChart,
  RadarChart,
  ActivityHeatmap,
  PageHeader,
  StatCard,
  Tabs,
  TabsList,
  TabsTrigger,
  ScrollArea,
} from "@repo/ui";
import {
  FileText,
  Trophy,
  Target,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div>
          <Skeleton className="mb-2 h-7 w-48 sm:h-8 sm:w-64" />
          <Skeleton className="h-4 w-36 sm:w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const analytics = useQuery(
    api.analytics.getStudentAnalytics,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  );

  const publishedTests = useQuery(
    api.tests.listPublishedForBatch,
    dbUser ? { batchId: dbUser.batchId } : "skip"
  );

  const inProgressAttempts = useQuery(
    api.attempts.getInProgressByUser,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  );

  const performanceTrend = useQuery(
    api.analytics.getStudentPerformanceTrend,
    dbUser?._id ? { userId: dbUser._id, limit: 10 } : "skip"
  );

  const userSettings = useQuery(
    api.userSettings.getOrCreateDefault,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  );

  const updateSettings = useMutation(api.userSettings.upsert);

  // Generate dates for heatmap (last year)
  const heatmapDates = useMemo(() => {
    const today = new Date();
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    return {
      startDate: yearAgo.getTime(),
      endDate: today.getTime(),
    };
  }, []);

  const heatmapData = useQuery(
    api.analytics.getActivityHeatmapData,
    dbUser?._id
      ? {
          userId: dbUser._id,
          startDate: heatmapDates.startDate,
          endDate: heatmapDates.endDate,
        }
      : "skip"
  );

  if (!isUserLoaded || (user && dbUser === undefined)) {
    return <DashboardSkeleton />;
  }

  if (user && dbUser === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold sm:text-2xl">Welcome, {user.firstName}!</h1>
          <p className="text-sm text-muted-foreground">
            Setting up your account...
          </p>
        </div>
        <Card className="py-8 text-center sm:py-12">
          <CardContent>
            <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent sm:h-8 sm:w-8" />
            <p className="text-sm text-muted-foreground">
              Please wait while we set up your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="py-8 text-center sm:py-12">
          <CardContent>
            <h3 className="mb-2 text-base font-medium sm:text-lg">Welcome!</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Your account is being set up. Please refresh the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return <DashboardSkeleton />;
  }

  const showHeatmap = userSettings?.preferredChartType === "heatmap";
  const accuracy =
    analytics.totalCorrect + analytics.totalIncorrect > 0
      ? (
          (analytics.totalCorrect /
            (analytics.totalCorrect + analytics.totalIncorrect)) *
          100
        ).toFixed(0)
      : "0";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.firstName || dbUser.name}!`}
        description="Track your progress and continue your preparation."
      />

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Tests Taken"
          value={analytics.totalTestsTaken}
          color="primary"
        />
        <StatCard
          icon={Trophy}
          label="Average Score"
          value={analytics.averageScore.toFixed(1)}
          color="purple"
        />
        <StatCard
          icon={Target}
          label="Correct Answers"
          value={analytics.totalCorrect}
          color="success"
        />
        <StatCard
          icon={TrendingUp}
          label="Accuracy"
          value={`${accuracy}%`}
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {/* In-Progress Tests */}
        {inProgressAttempts && inProgressAttempts.length > 0 && (
          <Card className="bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-sm font-medium">Continue Where You Left Off</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {inProgressAttempts.map((attempt) => (
                <div
                  key={attempt._id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Test in Progress</p>
                    <p className="text-xs text-muted-foreground">
                      Started {formatDate(attempt.startedAt)}
                    </p>
                  </div>
                  <Link href={`/tests/${attempt.testId}`}>
                    <Button size="sm">
                      Continue
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Available Tests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">Available Tests</CardTitle>
                <CardDescription className="text-xs">Start a new mock test</CardDescription>
              </div>
              {publishedTests && publishedTests.length > 3 && (
                <Link href="/tests">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    View All
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {publishedTests && publishedTests.length > 0 ? (
              <div className="space-y-2">
                {publishedTests.slice(0, 3).map((test) => (
                  <div
                    key={test._id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{test.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {test.questions.length} questions · {test.duration} min
                      </p>
                    </div>
                    <Link href={`/tests/${test._id}`}>
                      <Button variant="outline" size="sm">
                        Start
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No tests available yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Performance Section - Toggle between Heatmap and Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  {showHeatmap ? "Activity Overview" : "Performance Trend"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {showHeatmap
                    ? "Your test activity over the past year"
                    : "Your scores and accuracy over recent tests"}
                </CardDescription>
              </div>
              <Tabs
                value={showHeatmap ? "heatmap" : "chart"}
                onValueChange={(value) => {
                  if (dbUser?._id) {
                    updateSettings({
                      userId: dbUser._id,
                      preferredChartType: value as "heatmap" | "chart",
                    });
                  }
                }}
                className="w-auto"
              >
                <TabsList className="h-8">
                  <TabsTrigger value="heatmap" className="h-7 px-3 text-xs">
                    <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                    Heatmap
                  </TabsTrigger>
                  <TabsTrigger value="chart" className="h-7 px-3 text-xs">
                    <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                    Chart
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {showHeatmap ? (
              heatmapData ? (
                <div className="overflow-x-auto">
                  <ActivityHeatmap data={heatmapData} />
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              )
            ) : performanceTrend && performanceTrend.length > 1 ? (
              <div className="h-[180px] sm:h-[220px]">
                <LineChart
                  data={performanceTrend}
                  xKey="date"
                  yKey="score"
                  yKey2="accuracy"
                  color="hsl(var(--primary))"
                  color2="hsl(var(--success))"
                  showLegend
                  legendLabel="Score"
                  legendLabel2="Accuracy %"
                  height={180}
                />
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center">
                <p className="text-center text-sm text-muted-foreground">
                  Take more tests to see your performance trend.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Performance - Radar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Subject Performance</CardTitle>
            <CardDescription className="text-xs">
              Your accuracy across subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(analytics.subjectWisePerformance).length > 0 ? (
              <div className="space-y-4">
                <div className="h-[160px] sm:h-[200px]">
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
                    height={160}
                    color="hsl(var(--primary))"
                    fillOpacity={0.25}
                    legendLabel="Accuracy"
                  />
                </div>
                {/* Subject breakdown - horizontal scroll on mobile */}
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-2 pb-2 sm:grid sm:grid-cols-3 sm:gap-2">
                    {Object.entries(analytics.subjectWisePerformance).map(
                      ([subject, data]) => {
                        const percentage = data.total > 0
                          ? (data.correct / data.total) * 100
                          : 0;
                        return (
                          <div
                            key={subject}
                            className="flex shrink-0 items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-xs sm:shrink"
                            style={{ minWidth: '140px' }}
                          >
                            <span className="truncate font-medium">{subject}</span>
                            <Badge
                              variant={percentage >= 60 ? "success" : percentage >= 40 ? "secondary" : "destructive"}
                              className="shrink-0"
                            >
                              {percentage.toFixed(0)}%
                            </Badge>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-center text-sm text-muted-foreground">
                  Take some tests to see your performance by subject.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <CardDescription className="text-xs">Your latest test attempts</CardDescription>
              </div>
              {analytics.recentAttempts.length > 0 && (
                <Link href="/results">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    View All
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {analytics.recentAttempts.length > 0 ? (
              <div className="space-y-2">
                {analytics.recentAttempts.slice(0, 4).map((attempt) => {
                  const accuracyPercent = (attempt.correct / attempt.totalQuestions) * 100;
                  return (
                    <div
                      key={attempt._id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{attempt.testTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.correct}/{attempt.totalQuestions} correct · {formatDate(attempt.submittedAt!)}
                        </p>
                      </div>
                      <Badge
                        variant={accuracyPercent >= 60 ? "success" : "secondary"}
                      >
                        {accuracyPercent.toFixed(0)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No test attempts yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
