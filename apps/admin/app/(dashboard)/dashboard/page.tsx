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
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const stats = useQuery(api.analytics.getAdminDashboard);
  const seedDatabase = useMutation(api.seed.seedDatabase);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleSeedDatabase = async () => {
    if (!user?.id) return;

    setIsSeeding(true);
    setSeedResult(null);
    try {
      const result = await seedDatabase({ adminClerkId: user.id });
      setSeedResult(result.message);
    } catch (error) {
      setSeedResult("Error seeding database: " + (error as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = stats.totalQuestions === 0 && stats.totalTests === 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your test platform
        </p>
      </div>

      {/* Seed Database Card - Show when empty */}
      {isEmpty && (
        <Card className="mb-8 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Get Started with Sample Data
            </CardTitle>
            <CardDescription>
              Your database is empty. Add sample questions, tests, notes, and classes to get started quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="gap-2"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Add Sample Data
                </>
              )}
            </Button>
            {seedResult && (
              <p className={`mt-3 text-sm ${seedResult.includes("Error") ? "text-destructive" : "text-success"}`}>
                {seedResult}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedTests} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              In question bank
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Test Attempts</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Completed attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published Tests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedTests}</div>
            <p className="text-xs text-muted-foreground">
              Active tests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {!isEmpty && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="outline" asChild>
              <a href="/questions/new">Add Question</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/tests/new">Create Test</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/notes/new">Upload Notes</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/classes/new">Add Class</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
