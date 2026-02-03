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
  type FacetedFilterConfig,
} from "@repo/ui";
import { Video, Pencil, Trash2, ExternalLink } from "lucide-react";
import { AdminTable, createActionsColumn } from "@/components/admin-table";
import { ExportDropdown } from "@/components/export-dropdown";
import {
  exportToExcel,
  exportToPdf,
  type ExportColumn,
} from "@/lib/export-utils";
import { ClassSheet } from "./class-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";

const classExportColumns: ExportColumn[] = [
  { header: "Title", key: "title" },
  { header: "Subject", key: "subject" },
  { header: "Description", key: "description" },
  { header: "Video URL", key: "videoUrl" },
  { header: "Created", key: "createdAt", format: (v) => new Date(v).toLocaleDateString("en-IN") },
];

interface ClassItem {
  _id: string;
  title: string;
  description: string;
  subject: string;
  videoUrl: string;
  thumbnail?: string;
  batchIds?: string[];
  createdAt: number;
}

export function ClassesClient() {
  const classes = useQuery(api.classes.list, {});
  const batches = useQuery(api.batches.list, {});
  const subjects = useQuery(api.subjects.list, {});
  const deleteClass = useMutation(api.classes.remove);
  const { toast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);

  const batchMap = useMemo(() => {
    const map = new Map<string, string>();
    if (batches) {
      for (const b of batches) {
        map.set(b._id, b.name);
      }
    }
    return map;
  }, [batches]);

  const facetedFilters = useMemo<FacetedFilterConfig[]>(() => [
    {
      columnId: "subject",
      title: "Subject",
      options: (subjects ?? []).map((s) => ({ label: s.name, value: s.name })),
    },
    {
      columnId: "batchFilter",
      title: "Batch",
      options: (batches ?? []).map((b) => ({ label: b.name, value: b._id })),
    },
  ], [batches, subjects]);

  const handleDelete = async (id: string) => {
    try {
      await deleteClass({ id: id as any });
      toast({ title: "Class deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete class.", variant: "destructive" });
    }
    setDeleteClassId(null);
  };

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(classes || [], classExportColumns, "Classes", "Classes");
  };

  const handleExportPdf = () => {
    exportToPdf(classes || [], classExportColumns, "Classes", "Classes");
  };

  const columns: ColumnDef<ClassItem>[] = useMemo(() => [
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
    {
      id: "batchFilter",
      accessorFn: (row) => row.batchIds ?? [],
      header: () => null,
      cell: () => null,
      filterFn: (row, columnId, filterValue: string[]) => {
        const batchIds = row.getValue<string[]>(columnId);
        if (!batchIds || batchIds.length === 0) return true; // "All Batches" matches any filter
        return filterValue.some((val) => batchIds.includes(val));
      },
      enableHiding: true,
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
        onClick: () => setDeleteClassId(classItem._id),
        variant: "destructive",
        separator: true,
      },
    ]),
  ], [batchMap]);

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
        facetedFilters={facetedFilters}
        showColumnVisibility={true}
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
        toolbarExtra={
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={!classes || classes.length === 0}
          />
        }
      />

      <ClassSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        classItem={editingClass}
      />

      <ConfirmDialog
        open={!!deleteClassId}
        onOpenChange={(open) => { if (!open) setDeleteClassId(null); }}
        title="Delete Class"
        description="Are you sure you want to delete this class? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteClassId) return handleDelete(deleteClassId); }}
      />
    </>
  );
}
