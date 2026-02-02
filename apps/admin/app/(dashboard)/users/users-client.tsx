"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Badge,
  formatDate,
  SortableHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { useUrlState } from "@/hooks/use-url-state";

const userExportColumns: ExportColumn[] = [
  { header: "Name", key: "name" },
  { header: "Email", key: "email" },
  { header: "Role", key: "role", format: (v) => v.charAt(0).toUpperCase() + v.slice(1) },
  { header: "Batch", key: "batchName", format: (v) => v || "—" },
  { header: "Fees Paid", key: "feesPaid", format: (v) => String(v) },
  { header: "Fees Due", key: "feesDue", format: (v) => String(v) },
  { header: "Joined", key: "createdAt", format: (v) => new Date(v).toLocaleDateString("en-IN") },
];

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "role",
    title: "Role",
    options: [
      { label: "Student", value: "student" },
      { label: "Teacher", value: "teacher" },
    ],
  },
];

interface UserData {
  _id: string;
  name: string;
  email: string;
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
  const [batchFilter, setBatchFilter] = useUrlState("batch", "all");
  const [joinedFilter, setJoinedFilter] = useUrlState("joined", "all");
  const [feeFilter, setFeeFilter] = useUrlState("fees", "all");

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

  // Apply filters
  const filteredUsers = useMemo(() => {
    let result = enrichedUsers;

    if (batchFilter !== "all") {
      if (batchFilter === "none") {
        result = result.filter((u) => !u.batchId);
      } else {
        result = result.filter((u) => u.batchId === batchFilter);
      }
    }

    if (joinedFilter !== "all") {
      const now = Date.now();
      const days = parseInt(joinedFilter, 10);
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      result = result.filter((u) => u.createdAt >= cutoff);
    }

    if (feeFilter !== "all") {
      if (feeFilter === "due") {
        result = result.filter((u) => u.feesDue > 0);
      } else if (feeFilter === "paid") {
        result = result.filter((u) => u.feesDue === 0 && u.feesPaid > 0);
      }
    }

    return result;
  }, [enrichedUsers, batchFilter, joinedFilter, feeFilter]);

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(filteredUsers, userExportColumns, "Users", "Users");
  };

  const handleExportPdf = () => {
    exportToPdf(filteredUsers, userExportColumns, "Users", "Users", organization?.name, organization?.resolvedLogoUrl);
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
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column} title="Email" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate block max-w-[180px]">{row.getValue("email")}</span>
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

  // Compact stats
  const studentCount = enrichedUsers.filter((u) => u.role === "student").length;
  const suspendedCount = enrichedUsers.filter((u) => u.isSuspended).length;

  return (
    <>
      <AdminTable<UserData>
        columns={columns}
        data={filteredUsers}
        isLoading={users === undefined || batches === undefined || allFees === undefined}
        searchKey="name"
        searchPlaceholder="Search users..."
        title="Users"
        description="Manage students and teachers"
        onRowClick={(user) => setSelectedUserId(user._id)}
        emptyIcon={<Users className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No users yet"
        emptyDescription="Users will appear here when they sign up"
        // facetedFilters={facetedFilters}
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
          <>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="h-8 w-[160px] shrink-0">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                <SelectItem value="none">No Batch</SelectItem>
                {batches?.map((b) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={joinedFilter} onValueChange={setJoinedFilter}>
              <SelectTrigger className="h-8 w-[140px] shrink-0">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={feeFilter} onValueChange={setFeeFilter}>
              <SelectTrigger className="h-8 w-[140px] shrink-0">
                <SelectValue placeholder="All Fees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fees</SelectItem>
                <SelectItem value="due">Has Due</SelectItem>
                <SelectItem value="paid">All Paid</SelectItem>
              </SelectContent>
            </Select>
            <ExportDropdown
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              disabled={filteredUsers.length === 0}
            />
          </>
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
