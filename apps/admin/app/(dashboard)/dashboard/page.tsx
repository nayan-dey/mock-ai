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
} from "@repo/ui";
import {
  Users,
  FileText,
  FileQuestion,
  Trophy,
  TrendingUp,
  BarChart3,
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
      <div className="p-6">
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
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

  return (
    <div className="p-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your test platform
        </p>
      </div>

      {/* Seed Database Card - Show when empty */}
      {isEmpty && (
        <Card className="mb-6 border-dashed">
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
                  Seeding\u2026
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="min-h-[88px]">
          <CardContent className="flex h-full items-center p-4">
            <div className="flex w-full items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Students</p>
                <p className="text-2xl font-semibold tabular-nums">{stats.totalStudents}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[88px]">
          <CardContent className="flex h-full items-center p-4">
            <div className="flex w-full items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-semibold tabular-nums">{stats.totalTests}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[88px]">
          <CardContent className="flex h-full items-center p-4">
            <div className="flex w-full items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-semibold tabular-nums">{stats.totalQuestions}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <FileQuestion className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[88px]">
          <CardContent className="flex h-full items-center p-4">
            <div className="flex w-full items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Test Attempts</p>
                <p className="text-2xl font-semibold tabular-nums">{stats.totalAttempts}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[88px]">
          <CardContent className="flex h-full items-center p-4">
            <div className="flex w-full items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-2xl font-semibold tabular-nums">{stats.averageScore.toFixed(1)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[88px]">
          <CardContent className="flex h-full items-center p-4">
            <div className="flex w-full items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Published Tests</p>
                <p className="text-2xl font-semibold tabular-nums">{stats.publishedTests}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                <BarChart3 className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {!isEmpty && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/questions/new">Add Question</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/tests/new">Create Test</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/notes/new">Upload Notes</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/classes/new">Add Class</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
