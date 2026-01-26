"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
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
import { Plus, Trash2, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database";

type NoteId = Id<"notes">;

interface Note {
  _id: string;
  title: string;
  subject: string;
  topic: string;
  fileUrl: string;
  createdAt: number;
}

export default function NotesPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const notes = useQuery(api.notes.list, {});
  const deleteNote = useMutation(api.notes.remove);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteNote({ id: deleteId as NoteId });
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Note>[] = [
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
          <div className="flex justify-end gap-1">
            <a
              href={note.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" title="View File">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              onClick={() => setDeleteId(note._id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Manage study materials</p>
        </div>
        <Link href="/notes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </Link>
      </div>

      {!notes ? (
        <Card>
          <CardContent className="p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="mb-4 h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : notes.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Notes Found</h3>
            <p className="mt-2 text-muted-foreground">
              Add your first study note.
            </p>
            <Link href="/notes/new">
              <Button className="mt-4">Add Note</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Notes ({notes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={notes as Note[]}
              searchKey="title"
              searchPlaceholder="Search notes..."
              showPagination
              pageSize={10}
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
