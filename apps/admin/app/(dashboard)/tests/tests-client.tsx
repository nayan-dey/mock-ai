"use client";

import { usePreloadedQuery, useMutation, Preloaded } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  formatDate,
  DataTable,
  SortableHeader,
  type ColumnDef,
} from "@repo/ui";
import { Plus, Trash2, FileText, Eye, Globe, Archive } from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database/dataModel";

type TestId = Id<"tests">;

interface Test {
  _id: string;
  title: string;
  questions: string[];
  duration: number;
  totalMarks: number;
  status: "draft" | "published" | "archived";
  createdAt: number;
}

interface TestsClientProps {
  preloadedTests: Preloaded<typeof api.tests.list>;
}

export function TestsClient({ preloadedTests }: TestsClientProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const tests = usePreloadedQuery(preloadedTests);
  const deleteTest = useMutation(api.tests.remove);
  const publishTest = useMutation(api.tests.publish);
  const archiveTest = useMutation(api.tests.archive);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteTest({ id: deleteId as TestId });
      setDeleteId(null);
    }
  }, [deleteId, deleteTest]);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const columns: ColumnDef<Test>[] = useMemo(() => [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <SortableHeader column={column} title="Title" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("title")}</span>
      ),
    },
    {
      accessorKey: "questions",
      header: "Questions",
      cell: ({ row }) => (row.getValue("questions") as string[]).length,
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <SortableHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => `${row.getValue("duration")} min`,
    },
    {
      accessorKey: "totalMarks",
      header: ({ column }) => (
        <SortableHeader column={column} title="Marks" />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column} title="Status" />
      ),
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column} title="Created" />
      ),
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const test = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Link href={`/tests/${test._id}`}>
              <Button variant="ghost" size="icon" aria-label="View test details">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            {test.status === "draft" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Publish test"
                onClick={() => publishTest({ id: test._id as TestId })}
              >
                <Globe className="h-4 w-4 text-success" />
              </Button>
            )}
            {test.status === "published" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Archive test"
                onClick={() => archiveTest({ id: test._id as TestId })}
              >
                <Archive className="h-4 w-4 text-warning" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete test"
              onClick={() => setDeleteId(test._id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ], [archiveTest, getStatusBadge, publishTest]);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tests</h1>
          <p className="text-muted-foreground">Manage your mock tests</p>
        </div>
        <Link href="/tests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Test
          </Button>
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Tests Found</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first test to get started.
            </p>
            <Link href="/tests/new">
              <Button className="mt-4">Create Test</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tests ({tests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={tests as Test[]}
              searchKey="title"
              searchPlaceholder="Search tests..."
              showPagination
              pageSize={10}
              emptyMessage="No tests found."
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
