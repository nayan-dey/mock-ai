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
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Database, Users, Play, CheckCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";

export default function SeedPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [studentCount, setStudentCount] = useState(5);

  const dbUser = useQuery(api.users.getByClerkId, {
    clerkId: user?.id ?? "",
  });

  const batches = useQuery(api.batches.list, { activeOnly: false });

  const seedDatabase = useMutation(api.seed.seedDatabase);
  const seedMockStudents = useMutation(api.seed.seedMockStudents);
  const seedMockAttempts = useMutation(api.seed.seedMockAttempts);
  const clearAllData = useMutation(api.seed.clearAllData);

  const handleSeedDatabase = async () => {
    if (!user?.id) return;
    setLoading("database");
    try {
      const result = await seedDatabase({ adminClerkId: user.id });
      setResults((prev) => ({ ...prev, database: result }));
    } catch (error: any) {
      setResults((prev) => ({ ...prev, database: { error: error.message } }));
    } finally {
      setLoading(null);
    }
  };

  const handleSeedMockStudents = async () => {
    if (!selectedBatch) return;
    setLoading("students");
    try {
      const result = await seedMockStudents({
        batchId: selectedBatch as any,
        count: studentCount,
      });
      setResults((prev) => ({ ...prev, students: result }));
    } catch (error: any) {
      setResults((prev) => ({ ...prev, students: { error: error.message } }));
    } finally {
      setLoading(null);
    }
  };

  const handleSeedMyAttempts = async () => {
    if (!dbUser?._id) return;
    setLoading("myAttempts");
    try {
      const result = await seedMockAttempts({
        userId: dbUser._id,
        count: 15,
      });
      setResults((prev) => ({ ...prev, myAttempts: result }));
    } catch (error: any) {
      setResults((prev) => ({ ...prev, myAttempts: { error: error.message } }));
    } finally {
      setLoading(null);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm("Are you sure you want to delete ALL data? This cannot be undone!")) {
      return;
    }
    setLoading("clear");
    try {
      const result = await clearAllData({});
      setResults((prev) => ({ ...prev, clear: result }));
    } catch (error: any) {
      setResults((prev) => ({ ...prev, clear: { error: error.message } }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Seed Database</h1>
            <p className="text-muted-foreground">
              Add mock data for testing the application
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Seed Database */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Database className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Seed Database</CardTitle>
                <CardDescription>
                  Create initial data (questions, tests, notes, classes, batches)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSeedDatabase}
              disabled={loading !== null}
              className="w-full gap-2"
            >
              {loading === "database" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Seed Database
            </Button>
            {results.database && (
              <div className="rounded-lg border p-3 text-sm">
                {results.database.error ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {results.database.error}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {results.database.message}
                    </div>
                    {results.database.data && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {results.database.data.questions} questions
                        </Badge>
                        <Badge variant="secondary">
                          {results.database.data.tests} tests
                        </Badge>
                        <Badge variant="secondary">
                          {results.database.data.batches} batches
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seed Mock Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Create Mock Students</CardTitle>
                <CardDescription>
                  Add mock students with test attempts for leaderboard testing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Select Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches?.map((batch) => (
                      <SelectItem key={batch._id} value={batch._id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Number of Students</label>
                <Select
                  value={studentCount.toString()}
                  onValueChange={(v) => setStudentCount(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 10, 15].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} students
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSeedMockStudents}
              disabled={loading !== null || !selectedBatch}
              className="w-full gap-2"
            >
              {loading === "students" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Create Students
            </Button>
            {results.students && (
              <div className="rounded-lg border p-3 text-sm">
                {results.students.error ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {results.students.error}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {results.students.message}
                    </div>
                    {results.students.students && (
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        {results.students.students.slice(0, 3).map((s: any) => (
                          <div key={s.userId}>{s.name}</div>
                        ))}
                        {results.students.students.length > 3 && (
                          <div>...and {results.students.students.length - 3} more</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seed My Attempts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Seed My Attempts</CardTitle>
                <CardDescription>
                  Add mock test attempts for your account to test dashboard/heatmap
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will create 15 mock test attempts spread across the last 60 days
              for your account ({dbUser?.name || "loading..."}).
            </p>
            <Button
              onClick={handleSeedMyAttempts}
              disabled={loading !== null || !dbUser}
              className="w-full gap-2"
            >
              {loading === "myAttempts" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Create My Attempts
            </Button>
            {results.myAttempts && (
              <div className="rounded-lg border p-3 text-sm">
                {results.myAttempts.error ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {results.myAttempts.error}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {results.myAttempts.message}
                    </div>
                    {results.myAttempts.attempts && (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {results.myAttempts.attempts.slice(0, 3).map((a: any, i: number) => (
                          <div key={i}>
                            {a.testTitle}: {a.score} pts ({a.correct}/{a.correct + a.incorrect + a.unanswered})
                          </div>
                        ))}
                        {results.myAttempts.attempts.length > 3 && (
                          <div>...and {results.myAttempts.attempts.length - 3} more attempts</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clear All Data */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg">Clear All Data</CardTitle>
                <CardDescription>
                  Delete all users, questions, tests, attempts, and other data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-destructive">Warning:</strong> This will permanently delete all data
              from the database including users, questions, tests, attempts, batches, classes, and notes.
              This action cannot be undone!
            </p>
            <Button
              onClick={handleClearAllData}
              disabled={loading !== null}
              variant="destructive"
              className="w-full gap-2"
            >
              {loading === "clear" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Clear All Data
            </Button>
            {results.clear && (
              <div className="rounded-lg border p-3 text-sm">
                {results.clear.error ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {results.clear.error}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {results.clear.message}
                    </div>
                    {results.clear.deleted && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {results.clear.deleted.users} users
                        </Badge>
                        <Badge variant="secondary">
                          {results.clear.deleted.questions} questions
                        </Badge>
                        <Badge variant="secondary">
                          {results.clear.deleted.tests} tests
                        </Badge>
                        <Badge variant="secondary">
                          {results.clear.deleted.attempts} attempts
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">1. Seed Database</strong>
            <p>
              Run this first to create the initial data including questions, tests, notes,
              classes, and batches. This only works once - if data already exists, it will
              show a message that the database is already seeded.
            </p>
          </div>
          <div>
            <strong className="text-foreground">2. Create Mock Students</strong>
            <p>
              After seeding the database, select a batch and create mock students.
              Each student will have 5-15 random test attempts to populate the leaderboard.
            </p>
          </div>
          <div>
            <strong className="text-foreground">3. Seed My Attempts</strong>
            <p>
              Create test attempts for your own account to test the dashboard, activity
              heatmap, and results pages. The attempts are spread across the last 60 days.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
