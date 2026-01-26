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
  formatDuration,
  DataTable,
  SortableHeader,
  type ColumnDef,
} from "@repo/ui";
import { Plus, Trash2, Video, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database/dataModel";

type ClassId = Id<"classes">;

interface ClassItem {
  _id: string;
  title: string;
  subject: string;
  topic: string;
  duration: number;
  videoUrl: string;
  createdAt: number;
}

interface ClassesClientProps {
  preloadedClasses: Preloaded<typeof api.classes.list>;
}

export function ClassesClient({ preloadedClasses }: ClassesClientProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const classes = usePreloadedQuery(preloadedClasses);
  const deleteClass = useMutation(api.classes.remove);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteClass({ id: deleteId as ClassId });
      setDeleteId(null);
    }
  }, [deleteId, deleteClass]);

  const columns: ColumnDef<ClassItem>[] = useMemo(() => [
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
      accessorKey: "subject",
      header: ({ column }) => (
        <SortableHeader column={column} title="Subject" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("subject")}</Badge>
      ),
    },
    {
      accessorKey: "topic",
      header: ({ column }) => (
        <SortableHeader column={column} title="Topic" />
      ),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <SortableHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => formatDuration(row.getValue("duration")),
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
        const classItem = row.original;
        return (
          <div className="flex justify-end gap-0.5">
            <a
              href={classItem.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" aria-label="View video">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete class"
              onClick={() => setDeleteId(classItem._id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Recorded Classes</h1>
          <p className="text-sm text-muted-foreground">Manage video lectures</p>
        </div>
        <Link href="/classes/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        </Link>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No classes yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first recorded class.
            </p>
            <Link href="/classes/new">
              <Button className="mt-4" size="sm">Add Class</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">All Classes ({classes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={classes as ClassItem[]}
              searchKey="title"
              searchPlaceholder="Search classes..."
              showPagination
              pageSize={5}
              emptyMessage="No classes found."
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class?
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
