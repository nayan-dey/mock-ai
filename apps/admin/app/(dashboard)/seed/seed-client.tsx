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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { toast } from "sonner";
import { Database, Users, Play, CheckCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function SeedClient() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [studentCount, setStudentCount] = useState(5);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const batches = useQuery(api.batches.list, { activeOnly: false });

  const seedDatabase = useMutation(api.seed.seedDatabase);
  const seedMockStudents = useMutation(api.seed.seedMockStudents);
  const clearAllData = useMutation(api.seed.clearAllData);

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <p className="text-muted-foreground">This page is only available in development.</p>
      </div>
    );
  }

  const handleSeedDatabase = async () => {
    if (!user?.id) return;
    setLoading("database");
    try {
      const result = await seedDatabase({});
      setResults((prev) => ({ ...prev, database: result }));
      toast.success("Database seeded successfully");
    } catch (error) {
      setResults((prev) => ({ ...prev, database: { error: error instanceof Error ? error.message : "Unknown error" } }));
      toast.error("Failed to seed database");
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
      toast.success(`Created ${studentCount} mock students`);
    } catch (error) {
      setResults((prev) => ({ ...prev, students: { error: error instanceof Error ? error.message : "Unknown error" } }));
      toast.error("Failed to create mock students");
    } finally {
      setLoading(null);
    }
  };

  const handleClearAllData = async () => {
    setLoading("clear");
    try {
      const result = await clearAllData({});
      setResults((prev) => ({ ...prev, clear: result }));
      toast.success("All data cleared");
    } catch (error) {
      setResults((prev) => ({ ...prev, clear: { error: error instanceof Error ? error.message : "Unknown error" } }));
      toast.error("Failed to clear data");
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
                  Create initial data (batches, questions, tests, notes, classes)
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
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
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

        {/* Create Mock Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Create Mock Students</CardTitle>
                <CardDescription>
                  Add mock students with fees, test attempts, and leaderboard rank
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="seed-batch">Select Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger id="seed-batch">
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
                <Label htmlFor="seed-count">Number of Students</Label>
                <Select
                  value={studentCount.toString()}
                  onValueChange={(v) => setStudentCount(parseInt(v))}
                >
                  <SelectTrigger id="seed-count">
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
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
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
                        {results.students.students.slice(0, 3).map((s: { userId: string; name: string }) => (
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
                  Delete all data from dev including your admin account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-destructive">Warning:</strong> This will permanently delete all data
              from the database including users, questions, tests, attempts, batches, classes, notes, fees,
              notifications, chat data, organization, and your admin account. You will need to re-onboard after this.
            </p>
            <Button
              onClick={() => setShowClearConfirm(true)}
              disabled={loading !== null}
              variant="destructive"
              className="w-full gap-2"
            >
              {loading === "clear" ? (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
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
                        {Object.entries(results.clear.deleted)
                          .filter(([, count]) => (count as number) > 0)
                          .map(([table, count]) => (
                            <Badge key={table} variant="secondary">
                              {count as number} {table}
                            </Badge>
                          ))}
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
              Run this first to create the initial data including batches, questions, tests, notes,
              and classes. This only works once - if data already exists, it will
              show a message that the database is already seeded.
            </p>
          </div>
          <div>
            <strong className="text-foreground">2. Create Mock Students</strong>
            <p>
              After seeding the database, select a batch and create mock students.
              Each student will have paid and due fee records, 5-15 random test attempts,
              and will appear on the leaderboard.
            </p>
          </div>
          <div>
            <strong className="text-foreground">3. Clear All Data</strong>
            <p>
              Deletes everything from the database including your admin account and organization.
              You will need to re-onboard after using this. Use with caution.
            </p>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear All Data"
        description="Are you sure you want to delete ALL data? This will permanently remove everything including your admin account and organization. You will need to re-onboard after this. This action cannot be undone!"
        confirmLabel="Clear All Data"
        onConfirm={handleClearAllData}
        isLoading={loading === "clear"}
      />
    </div>
  );
}
