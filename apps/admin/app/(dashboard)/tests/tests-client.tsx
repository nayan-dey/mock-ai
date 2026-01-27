"use client";

import { useQuery, useMutation } from "convex/react";
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
  Skeleton,
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
  batchIds?: string[];
  createdAt: number;
}

export function TestsClient() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const tests = useQuery(api.tests.list, {});
  const batches = useQuery(api.batches.list, { activeOnly: false });
  const deleteTest = useMutation(api.tests.remove);
  const publishTest = useMutation(api.tests.publish);
  const archiveTest = useMutation(api.tests.archive);

  // Helper to get batch names
  const getBatchNames = useCallback((batchIds?: string[]) => {
    if (!batchIds || batchIds.length === 0 || !batches) return null;
    return batchIds
      .map((id) => batches.find((b) => b._id === id)?.name)
      .filter(Boolean);
  }, [batches]);

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
      accessorKey: "batchIds",
      header: "Batches",
      cell: ({ row }) => {
        const batchNames = getBatchNames(row.original.batchIds);
        if (!batchNames || batchNames.length === 0) {
          return <span className="text-xs text-muted-foreground">All</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {batchNames.slice(0, 2).map((name) => (
              <Badge key={name} variant="outline" className="text-xs">
                {name}
              </Badge>
            ))}
            {batchNames.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{batchNames.length - 2}
              </Badge>
            )}
          </div>
        );
      },
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
          <div className="flex justify-end gap-0.5">
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
  ], [archiveTest, getBatchNames, getStatusBadge, publishTest]);

  if (tests === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tests</h1>
          <p className="text-sm text-muted-foreground">Manage your mock tests</p>
        </div>
        <Link href="/tests/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Test
          </Button>
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No tests yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first test to get started.
            </p>
            <Link href="/tests/new">
              <Button className="mt-4" size="sm">Create Test</Button>
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
              pageSize={5}
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
