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
import { toast } from "sonner";
import { Plus, Trash2, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database/dataModel";

type NoteId = Id<"notes">;

interface Note {
  _id: string;
  title: string;
  subject: string;
  topic: string;
  fileUrl: string;
  createdAt: number;
}

export function NotesClient() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const notes = useQuery(api.notes.list, {});
  const deleteNote = useMutation(api.notes.remove);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      try {
        await deleteNote({ id: deleteId as NoteId });
        toast.success("Note deleted successfully");
        setDeleteId(null);
      } catch (error) {
        toast.error("Failed to delete note");
      }
    }
  }, [deleteId, deleteNote]);

  const columns: ColumnDef<Note>[] = useMemo(() => [
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
        const note = row.original;
        return (
          <div className="flex justify-end gap-0.5">
            <a
              href={note.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" aria-label="View file">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete note"
              onClick={() => setDeleteId(note._id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  if (notes === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-28" />
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
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">Manage study materials</p>
        </div>
        <Link href="/notes/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No notes yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first study note.
            </p>
            <Link href="/notes/new">
              <Button className="mt-4" size="sm">Add Note</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">All Notes ({notes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={notes as Note[]}
              searchKey="title"
              searchPlaceholder="Search notes..."
              showPagination
              pageSize={5}
              emptyMessage="No notes found."
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note?
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
