"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  useToast,
  SortableHeader,
  Badge,
  formatDate,
  type ColumnDef,
} from "@repo/ui";
import { BookOpen, Pencil, Trash2, ExternalLink } from "lucide-react";
import { AdminTable, createActionsColumn } from "@/components/admin-table";
import { NoteSheet } from "./note-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Note {
  _id: string;
  title: string;
  description: string;
  subject: string;
  storageId: string;
  fileUrl: string | null;
  batchIds?: string[];
  createdAt: number;
}

export function NotesClient() {
  const notes = useQuery(api.notes.list, {});
  const batches = useQuery(api.batches.list, {});
  const deleteNote = useMutation(api.notes.remove);
  const { toast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const batchMap = useMemo(() => {
    const map = new Map<string, string>();
    if (batches) {
      for (const b of batches) {
        map.set(b._id, b.name);
      }
    }
    return map;
  }, [batches]);

  const handleDelete = async (id: string) => {
    try {
      await deleteNote({ id: id as any });
      toast({ title: "Note deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete note.", variant: "destructive" });
    }
    setDeleteNoteId(null);
  };

  const columns = useMemo<ColumnDef<Note>[]>(() => [
    {
      accessorKey: "title",
      header: ({ column }) => <SortableHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("title")}</span>
      ),
    },
    {
      accessorKey: "subject",
      header: ({ column }) => <SortableHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("subject")}</Badge>
      ),
    },
    {
      id: "batches",
      header: "Batches",
      cell: ({ row }) => {
        const ids = row.original.batchIds;
        if (!ids || ids.length === 0) {
          return <span className="text-xs text-muted-foreground">All Batches</span>;
        }
        return (
          <div className="flex gap-1">
            {ids.slice(0, 2).map((id) => (
              <Badge key={id} variant="secondary" className="text-xs truncate max-w-[100px]">
                {batchMap.get(id) || "..."}
              </Badge>
            ))}
            {ids.length > 2 && (
              <Badge variant="secondary" className="text-xs shrink-0">
                +{ids.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdAt") as number)}
        </span>
      ),
    },
    createActionsColumn<Note>((note) => [
      {
        label: "View File",
        icon: <ExternalLink className="h-4 w-4" />,
        onClick: () => { if (note.fileUrl) window.open(note.fileUrl, "_blank"); },
      },
      {
        label: "Edit",
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => {
          setEditingNote(note);
          setSheetOpen(true);
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => setDeleteNoteId(note._id),
        variant: "destructive",
        separator: true,
      },
    ]),
  ], [batchMap]);

  return (
    <>
      <AdminTable<Note>
        columns={columns}
        data={(notes as Note[]) ?? []}
        isLoading={notes === undefined}
        searchKey="title"
        searchPlaceholder="Search notes..."
        title="Notes"
        description="Manage study materials"
        primaryAction={{
          label: "Add Note",
          onClick: () => {
            setEditingNote(null);
            setSheetOpen(true);
          },
        }}
        emptyIcon={<BookOpen className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No notes yet"
        emptyDescription="Add your first study note"
        emptyAction={{
          label: "Add Note",
          onClick: () => {
            setEditingNote(null);
            setSheetOpen(true);
          },
        }}
      />

      <NoteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        note={editingNote}
      />

      <ConfirmDialog
        open={!!deleteNoteId}
        onOpenChange={(open) => { if (!open) setDeleteNoteId(null); }}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteNoteId) return handleDelete(deleteNoteId); }}
      />
    </>
  );
}
