"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  useToast,
  SortableHeader,
  Badge,
  formatDate,
  formatDuration,
  type ColumnDef,
} from "@repo/ui";
import { Video, Pencil, Trash2, ExternalLink } from "lucide-react";
import { AdminTable, createActionsColumn } from "@/components/admin-table";
import { ClassSheet } from "./class-sheet";

interface ClassItem {
  _id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  videoUrl: string;
  duration: number;
  thumbnail?: string;
  batchIds?: string[];
  createdAt: number;
}

export function ClassesClient() {
  const classes = useQuery(api.classes.list, {});
  const batches = useQuery(api.batches.list, {});
  const deleteClass = useMutation(api.classes.remove);
  const { toast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

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
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await deleteClass({ id: id as any });
      toast({ title: "Class deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete class.", variant: "destructive" });
    }
  };

  const columns: ColumnDef<ClassItem, any>[] = [
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
      accessorKey: "topic",
      header: ({ column }) => <SortableHeader column={column} title="Topic" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("topic")}</span>
      ),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => <SortableHeader column={column} title="Duration" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDuration(row.getValue("duration") as number)}
        </span>
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
          <div className="flex flex-wrap gap-1">
            {ids.slice(0, 2).map((id) => (
              <Badge key={id} variant="secondary" className="text-xs">
                {batchMap.get(id) || "..."}
              </Badge>
            ))}
            {ids.length > 2 && (
              <Badge variant="secondary" className="text-xs">
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
    createActionsColumn<ClassItem>((classItem) => [
      {
        label: "View Video",
        icon: <ExternalLink className="h-4 w-4" />,
        onClick: () => window.open(classItem.videoUrl, "_blank"),
      },
      {
        label: "Edit",
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => {
          setEditingClass(classItem);
          setSheetOpen(true);
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleDelete(classItem._id),
        variant: "destructive",
        separator: true,
      },
    ]),
  ];

  return (
    <>
      <AdminTable<ClassItem>
        columns={columns}
        data={(classes as ClassItem[]) ?? []}
        isLoading={classes === undefined}
        searchKey="title"
        searchPlaceholder="Search classes..."
        title="Recorded Classes"
        description="Manage video lectures"
        primaryAction={{
          label: "Add Class",
          onClick: () => {
            setEditingClass(null);
            setSheetOpen(true);
          },
        }}
        emptyIcon={<Video className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No classes yet"
        emptyDescription="Add your first recorded class"
        emptyAction={{
          label: "Add Class",
          onClick: () => {
            setEditingClass(null);
            setSheetOpen(true);
          },
        }}
      />

      <ClassSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        classItem={editingClass}
      />
    </>
  );
}
