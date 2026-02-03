"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  useToast,
  SortableHeader,
  Badge,
  type ColumnDef,
  type FacetedFilterConfig,
  formatDate,
} from "@repo/ui";
import { Users, Pencil, Trash2, ToggleRight, Copy, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { AdminTable, createActionsColumn, type ActionMenuItem } from "@/components/admin-table";
import { ExportDropdown } from "@/components/export-dropdown";
import {
  exportToExcel,
  exportToPdf,
  type ExportColumn,
} from "@/lib/export-utils";

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
import { BatchEditSheet } from "./batch-edit-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";

const batchExportColumns: ExportColumn[] = [
  { header: "Name", key: "name" },
  { header: "Description", key: "description", format: (v) => v || "—" },
  { header: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
  { header: "Referral Code", key: "referralCode" },
  { header: "Created", key: "createdAt", format: (v) => new Date(v).toLocaleDateString("en-IN") },
];

interface Batch {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  referralCode: string;
  createdAt: number;
}

export function BatchesClient() {
  const { user } = useUser();
  const organization = useQuery(
    api.organizations.getByAdminClerkId,
    user?.id ? { adminClerkId: user.id } : "skip"
  );
  const batches = useQuery(api.batches.list, {});
  const updateBatch = useMutation(api.batches.update);
  const removeBatch = useMutation(api.batches.remove);
  const { toast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const handleActivate = async (id: string) => {
    if (activatingId) return;
    setActivatingId(id);
    try {
      await updateBatch({ id: id as any, isActive: true });
      toast({ title: "Batch activated" });
    } catch {
      toast({ title: "Error", description: "Failed to activate batch.", variant: "destructive" });
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeBatch({ id: id as any });
      toast({ title: "Batch deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete batch.", variant: "destructive" });
    }
    setDeleteBatchId(null);
  };

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(batches || [], batchExportColumns, "Batches", "Batches");
  };

  const handleExportPdf = () => {
    exportToPdf(batches || [], batchExportColumns, "Batches", "Batches", organization?.name, organization?.resolvedLogoUrl);
  };

  const columns = useMemo<ColumnDef<Batch>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate block max-w-[200px]">
          {row.getValue("description") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id) ? "active" : "inactive");
      },
    },
    {
      accessorKey: "referralCode",
      header: "Referral Code",
      cell: ({ row }) => {
        const code = row.getValue("referralCode") as string;
        return (
          <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
            {code}
          </code>
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
    createActionsColumn<Batch>((batch) => {
      const actions: ActionMenuItem[] = [
        {
          label: "Edit",
          icon: <Pencil className="h-4 w-4" />,
          onClick: () => {
            setEditingBatch(batch);
            setSheetOpen(true);
          },
        },
        {
          label: "Copy Referral Link",
          icon: <Copy className="h-4 w-4" />,
          onClick: () => {
            const studentBaseUrl =
              process.env.NEXT_PUBLIC_STUDENT_APP_URL ||
              (process.env.NODE_ENV === "production"
                ? "https://www.nindo.biz"
                : "http://localhost:3000");
            const orgSlug = organization?.slug;
            const url = orgSlug
              ? `${studentBaseUrl}/sign-up?org=${orgSlug}&ref=${batch.referralCode}`
              : `${studentBaseUrl}/sign-up?ref=${batch.referralCode}`;
            copyToClipboard(url);
            toast({ title: "Referral link copied!", description: url });
          },
        },
      ];

      if (!batch.isActive) {
        actions.push({
          label: activatingId === batch._id ? "Activating…" : "Activate",
          icon: activatingId === batch._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ToggleRight className="h-4 w-4" />,
          disabled: activatingId !== null,
          onClick: () => handleActivate(batch._id),
        });
      }

      actions.push({
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => setDeleteBatchId(batch._id),
        variant: "destructive" as const,
        separator: true,
      });

      return actions;
    }),
  ], [organization, handleActivate, toast, activatingId]);

  const facetedFilters: FacetedFilterConfig[] = useMemo(() => [
    {
      columnId: "isActive",
      title: "Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ], []);

  return (
    <>
      <AdminTable<Batch>
        columns={columns}
        data={(batches as Batch[]) ?? []}
        isLoading={batches === undefined}
        searchKey="name"
        searchPlaceholder="Search batches..."
        title="Batches"
        description="Manage student batches and groups"
        primaryAction={{
          label: "Create Batch",
          onClick: () => {
            setEditingBatch(null);
            setSheetOpen(true);
          },
        }}
        emptyIcon={<Users className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No batches yet"
        emptyDescription="Create your first batch to organize students"
        emptyAction={{
          label: "Create Batch",
          onClick: () => {
            setEditingBatch(null);
            setSheetOpen(true);
          },
        }}
        facetedFilters={facetedFilters}
        showColumnVisibility={true}
        toolbarExtra={
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={!batches || batches.length === 0}
          />
        }
      />

      <BatchEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        batch={editingBatch}
      />

      <ConfirmDialog
        open={!!deleteBatchId}
        onOpenChange={(open) => { if (!open) setDeleteBatchId(null); }}
        title="Delete Batch"
        description="Are you sure you want to delete this batch? Students in this batch will be unassigned."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteBatchId) return handleDelete(deleteBatchId); }}
      />
    </>
  );
}
