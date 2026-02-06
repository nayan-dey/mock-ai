"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Badge,
  formatDate,
  SortableHeader,
  type ColumnDef,
  type FacetedFilterConfig,
} from "@repo/ui";
import { Eye, Users } from "lucide-react";
import { AdminTable, createActionsColumn } from "@/components/admin-table";
import { ExportDropdown } from "@/components/export-dropdown";
import {
  exportToExcel,
  exportToPdf,
  type ExportColumn,
} from "@/lib/export-utils";
import { UserDetailSheet } from "../../../components/user-detail-sheet";

const userExportColumns: ExportColumn[] = [
  { header: "Name", key: "name" },
  { header: "Phone", key: "phone", format: (v) => v || "—" },
  { header: "Role", key: "role", format: (v) => v.charAt(0).toUpperCase() + v.slice(1) },
  { header: "Batch", key: "batchName", format: (v) => v || "—" },
  { header: "Fees Paid", key: "feesPaid", format: (v) => String(v) },
  { header: "Fees Due", key: "feesDue", format: (v) => String(v) },
  { header: "Joined", key: "createdAt", format: (v) => new Date(v).toLocaleDateString("en-IN") },
];


interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student" | "teacher" | "admin";
  batchId?: string;
  batchName?: string;
  isSuspended?: boolean;
  createdAt: number;
  feesPaid: number;
  feesDue: number;
  feeStatus: "all_paid" | "has_due" | "no_fees";
}

export function UsersClient() {
  const { user: clerkUser } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const users = useQuery(api.users.list, {});
  const batches = useQuery(api.batches.list, {});
  const allFees = useQuery(api.fees.getAll);
  const organization = useQuery(api.organizations.getMyOrg);

  // Build per-student fee counts
  const feeCountMap = useMemo(() => {
    const map: Record<string, { paid: number; due: number }> = {};
    allFees?.forEach((f) => {
      const id = f.studentId as string;
      if (!map[id]) map[id] = { paid: 0, due: 0 };
      if (f.status === "paid") map[id].paid++;
      else map[id].due++;
    });
    return map;
  }, [allFees]);

  const batchMap = useMemo(() => {
    const map: Record<string, string> = {};
    batches?.forEach((b) => { map[b._id] = b.name; });
    return map;
  }, [batches]);

  // Enrich, filter out admins
  const enrichedUsers: UserData[] = useMemo(() => {
    if (!users) return [];
    return users
      .filter((u) => u.role !== "admin")
      .map((user) => {
        const counts = feeCountMap[user._id] ?? { paid: 0, due: 0 };
        const feeStatus: UserData["feeStatus"] =
          counts.paid === 0 && counts.due === 0
            ? "no_fees"
            : counts.due > 0
              ? "has_due"
              : "all_paid";
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          batchId: user.batchId,
          batchName: user.batchId ? batchMap[user.batchId] : undefined,
          isSuspended: user.isSuspended,
          createdAt: user.createdAt,
          feesPaid: counts.paid,
          feesDue: counts.due,
          feeStatus,
        };
      });
  }, [users, batchMap, feeCountMap]);


  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(enrichedUsers, userExportColumns, "Users", "Users");
  };

  const handleExportPdf = () => {
    exportToPdf(enrichedUsers, userExportColumns, "Users", "Users", organization?.name, organization?.resolvedLogoUrl);
  };

  const columns: ColumnDef<UserData, any>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium truncate max-w-[150px]">{row.getValue("name")}</span>
          {row.original.isSuspended && (
            <Badge variant="destructive" className="text-[10px] shrink-0">
              Suspended
            </Badge>
          )}
        </div>
      ),
    },
    // Hidden column for batch filtering
    {
      id: "batchFilter",
      accessorFn: (row) => row.batchId || "none",
      header: () => null,
      cell: () => null,
      filterFn: (row, columnId, filterValue) => {
        const batchId = row.getValue(columnId) as string;
        return filterValue.includes(batchId);
      },
      enableHiding: true,
    },
    // Hidden column for joined date filtering
    {
      id: "joinedFilter",
      accessorFn: (row) => {
        const now = Date.now();
        const age = now - row.createdAt;
        const days = Math.floor(age / (24 * 60 * 60 * 1000));
        if (days <= 7) return "7";
        if (days <= 30) return "30";
        if (days <= 90) return "90";
        return "all";
      },
      header: () => null,
      cell: () => null,
      filterFn: (row, columnId, filterValue) => {
        const category = row.getValue(columnId) as string;
        return filterValue.includes(category);
      },
      enableHiding: true,
    },
    // Hidden column for fee status filtering
    {
      id: "feeStatusFilter",
      accessorFn: (row) => row.feeStatus,
      header: () => null,
      cell: () => null,
      filterFn: (row, columnId, filterValue) => {
        const status = row.getValue(columnId) as string;
        if (filterValue.includes("due")) return status === "has_due";
        if (filterValue.includes("paid")) return status === "all_paid";
        return false;
      },
      enableHiding: true,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <SortableHeader column={column} title="Phone" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate block max-w-[180px]">{row.getValue("phone") || "—"}</span>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => <SortableHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant={role === "teacher" ? "secondary" : "outline"}>
            {role}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "batchName",
      header: "Batch",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("batchName") || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "feesDue",
      header: "Fees",
      cell: ({ row }) => {
        const paid = row.original.feesPaid;
        const due = row.original.feesDue;
        if (paid === 0 && due === 0) {
          return <span className="text-xs text-muted-foreground">&mdash;</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium tabular-nums text-emerald-600">{paid}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className={`text-xs font-medium tabular-nums ${due > 0 ? "text-destructive" : "text-muted-foreground"}`}>{due}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title="Joined" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdAt") as number)}
        </span>
      ),
    },
    createActionsColumn<UserData>((user) => [
      {
        label: "View Details",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => setSelectedUserId(user._id),
      },
    ]),
  ], [setSelectedUserId]);

  // Faceted filters configuration
  const facetedFilters: FacetedFilterConfig[] = useMemo(() => [
    {
      columnId: "batchFilter",
      title: "Batch",
      options: [
        { label: "No Batch", value: "none" },
        ...(batches?.map((b) => ({ label: b.name, value: b._id })) || []),
      ],
    },
    {
      columnId: "joinedFilter",
      title: "Joined",
      options: [
        { label: "Last 7 days", value: "7" },
        { label: "Last 30 days", value: "30" },
        { label: "Last 90 days", value: "90" },
      ],
    },
    {
      columnId: "feeStatusFilter",
      title: "Fees",
      options: [
        { label: "Has Due", value: "due" },
        { label: "All Paid", value: "paid" },
      ],
    },
  ], [batches]);

  // Compact stats
  const studentCount = enrichedUsers.filter((u) => u.role === "student").length;
  const suspendedCount = enrichedUsers.filter((u) => u.isSuspended).length;

  return (
    <>
      <AdminTable<UserData>
        columns={columns}
        data={enrichedUsers}
        isLoading={users === undefined || batches === undefined || allFees === undefined}
        searchKey="name"
        searchPlaceholder="Search users..."
        title="Users"
        description="Manage students and teachers"
        onRowClick={(user) => setSelectedUserId(user._id)}
        emptyIcon={<Users className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No users yet"
        emptyDescription="Users will appear here when they sign up"
        facetedFilters={facetedFilters}
        showColumnVisibility={true}
        showCard={false}
        headerExtra={
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{enrichedUsers.length}</strong> total</span>
            <span><strong className="text-foreground">{studentCount}</strong> students</span>
            {suspendedCount > 0 && (
              <span className="text-red-500">
                <strong>{suspendedCount}</strong> suspended
              </span>
            )}
          </div>
        }
        toolbarExtra={
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={enrichedUsers.length === 0}
          />
        }
      />

      <UserDetailSheet
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
      />
    </>
  );
}
