"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  DataTable,
  SortableHeader,
  type ColumnDef,
  useToast,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@repo/ui";
import {
  IndianRupee,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Trash2,
  AlertCircle,
  CircleCheck,
  Filter,
  X,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";
import { UserDetailSheet } from "../../../components/user-detail-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthLabel(timestamp: number): string {
  const d = new Date(timestamp);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

interface FeeRow {
  _id: string;
  studentId: string;
  amount: number;
  status: "paid" | "due";
  dueDate: number;
  paidDate?: number;
  description?: string;
  createdBy: string;
  createdAt: number;
  studentName: string;
  studentEmail: string;
  batchName: string;
  batchId: string | null;
  dueMonth: string;
}

export default function FeesPage() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteFeeId, setDeleteFeeId] = useState<string | null>(null);

  // URL-synced filters
  const selectedBatches = useMemo(() => new Set(searchParams.get("batches")?.split(",").filter(Boolean) ?? []), [searchParams]);
  const selectedMonths = useMemo(() => new Set(searchParams.get("months")?.split(",").filter(Boolean) ?? []), [searchParams]);
  const selectedStatuses = useMemo(() => new Set(searchParams.get("statuses")?.split(",").filter(Boolean) ?? []), [searchParams]);

  const updateUrlSet = useCallback((key: string, newSet: Set<string>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSet.size === 0) {
      params.delete(key);
    } else {
      params.set(key, Array.from(newSet).join(","));
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const setSelectedBatches = useCallback((v: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const newSet = typeof v === "function" ? v(selectedBatches) : v;
    updateUrlSet("batches", newSet);
  }, [selectedBatches, updateUrlSet]);

  const setSelectedMonths = useCallback((v: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const newSet = typeof v === "function" ? v(selectedMonths) : v;
    updateUrlSet("months", newSet);
  }, [selectedMonths, updateUrlSet]);

  const setSelectedStatuses = useCallback((v: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const newSet = typeof v === "function" ? v(selectedStatuses) : v;
    updateUrlSet("statuses", newSet);
  }, [selectedStatuses, updateUrlSet]);

  const currentAdmin = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const allFees = useQuery(api.fees.getAll);
  const markAsPaid = useMutation(api.fees.markAsPaid);
  const removeFee = useMutation(api.fees.remove);

  // Enrich data with month label
  const enrichedFees: FeeRow[] = useMemo(() => {
    if (!allFees) return [];
    return allFees.map((f) => ({
      ...(f as any),
      dueMonth: getMonthLabel(f.dueDate),
    }));
  }, [allFees]);

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const batches = [...new Set(enrichedFees.map((f) => f.batchName))].sort();
    const months = [
      ...new Set(enrichedFees.map((f) => f.dueMonth)),
    ].sort((a, b) => {
      // Sort chronologically: parse "Month Year" back to date
      const parse = (s: string) => {
        const [month, year] = s.split(" ");
        return new Date(`${month} 1, ${year}`).getTime();
      };
      return parse(b) - parse(a);
    });
    const statuses = [...new Set(enrichedFees.map((f) => f.status))].sort();
    return { batches, months, statuses };
  }, [enrichedFees]);

  // Apply filters
  const filteredFees = useMemo(() => {
    return enrichedFees.filter((f) => {
      if (selectedBatches.size > 0 && !selectedBatches.has(f.batchName))
        return false;
      if (selectedMonths.size > 0 && !selectedMonths.has(f.dueMonth))
        return false;
      if (selectedStatuses.size > 0 && !selectedStatuses.has(f.status))
        return false;
      return true;
    });
  }, [enrichedFees, selectedBatches, selectedMonths, selectedStatuses]);

  const activeFilterCount =
    (selectedBatches.size > 0 ? 1 : 0) +
    (selectedMonths.size > 0 ? 1 : 0) +
    (selectedStatuses.size > 0 ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedBatches(new Set());
    setSelectedMonths(new Set());
    setSelectedStatuses(new Set());
  };

  // Stats based on filtered data
  const stats = useMemo(() => {
    const data = filteredFees;
    const due = data.filter((f) => f.status === "due");
    const paid = data.filter((f) => f.status === "paid");
    return {
      total: data.length,
      due: due.length,
      paid: paid.length,
      dueAmount: due.reduce((s, f) => s + f.amount, 0),
      paidAmount: paid.reduce((s, f) => s + f.amount, 0),
    };
  }, [filteredFees]);

  const handleMarkAsPaid = async (feeId: string) => {
    if (!currentAdmin) return;
    try {
      await markAsPaid({
        id: feeId as Id<"fees">,
      });
      toast({ title: "Marked as paid" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update fee.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (feeId: string) => {
    if (!currentAdmin) return;
    try {
      await removeFee({
        id: feeId as Id<"fees">,
      });
      toast({ title: "Fee record deleted" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete fee.",
        variant: "destructive",
      });
    }
    setDeleteFeeId(null);
  };

  // Toggle helpers for multi-select
  const toggleFilter = (
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string
  ) => {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setter(next);
  };

  const columns: ColumnDef<FeeRow>[] = [
    {
      accessorKey: "studentName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Student" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">{row.getValue("studentName")}</p>
          <p className="text-xs text-muted-foreground truncate">
            {row.original.studentEmail}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "batchName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Batch" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {row.getValue("batchName")}
        </Badge>
      ),
    },
    {
      accessorKey: "dueMonth",
      header: ({ column }) => (
        <SortableHeader column={column} title="Month" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("dueMonth")}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("description") || "Fee Payment"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <SortableHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-mono font-semibold">
          &#8377;{(row.getValue("amount") as number).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <SortableHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.getValue("dueDate") as number).toLocaleDateString(
            "en-IN"
          )}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant="outline"
            className={
              status === "paid"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            }
          >
            {status === "paid" ? "Paid" : "Due"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paidDate",
      header: "Paid Date",
      cell: ({ row }) => {
        const pd = row.getValue("paidDate") as number | undefined;
        return (
          <span className="text-muted-foreground">
            {pd ? new Date(pd).toLocaleDateString("en-IN") : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const fee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Fee actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  setSelectedStudent({
                    id: fee.studentId,
                    name: fee.studentName,
                  })
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {fee.status === "due" && (
                <DropdownMenuItem
                  onClick={() => handleMarkAsPaid(fee._id)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteFeeId(fee._id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (allFees === undefined) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16" />
                <Skeleton className="mt-1 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Fees</h1>
        <p className="text-muted-foreground">
          Manage student fee records across all batches
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Fee entries across all batches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-destructive">{stats.due}</div>
            <p className="text-xs text-muted-foreground">
              &#8377;{stats.dueAmount.toLocaleString("en-IN")} outstanding
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CircleCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-emerald-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              &#8377;{stats.paidAmount.toLocaleString("en-IN")} collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">All Fee Records</CardTitle>
              <CardDescription className="text-xs">
                {filteredFees.length}
                {filteredFees.length !== allFees.length &&
                  ` of ${allFees.length}`}{" "}
                record{filteredFees.length !== 1 ? "s" : ""} across all
                students
              </CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {/* Batch Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    selectedBatches.size > 0
                      ? "border-primary text-primary"
                      : ""
                  }
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Batch
                  {selectedBatches.size > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                    >
                      {selectedBatches.size}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by batch</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.batches.map((batch) => (
                  <DropdownMenuCheckboxItem
                    key={batch}
                    checked={selectedBatches.has(batch)}
                    onCheckedChange={() =>
                      toggleFilter(selectedBatches, setSelectedBatches, batch)
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {batch}
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedBatches.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="justify-center text-xs"
                      onClick={() => setSelectedBatches(new Set())}
                    >
                      Clear
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Month Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    selectedMonths.size > 0
                      ? "border-primary text-primary"
                      : ""
                  }
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Month
                  {selectedMonths.size > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                    >
                      {selectedMonths.size}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by month</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.months.map((month) => (
                  <DropdownMenuCheckboxItem
                    key={month}
                    checked={selectedMonths.has(month)}
                    onCheckedChange={() =>
                      toggleFilter(selectedMonths, setSelectedMonths, month)
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {month}
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedMonths.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="justify-center text-xs"
                      onClick={() => setSelectedMonths(new Set())}
                    >
                      Clear
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    selectedStatuses.size > 0
                      ? "border-primary text-primary"
                      : ""
                  }
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Status
                  {selectedStatuses.size > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                    >
                      {selectedStatuses.size}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.statuses.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.has(status)}
                    onCheckedChange={() =>
                      toggleFilter(
                        selectedStatuses,
                        setSelectedStatuses,
                        status
                      )
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {status === "paid" ? "Paid" : "Due"}
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedStatuses.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="justify-center text-xs"
                      onClick={() => setSelectedStatuses(new Set())}
                    >
                      Clear
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground"
                onClick={clearAllFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allFees.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredFees}
              searchKey="studentName"
              searchPlaceholder="Search by student name..."
              showPagination
              pageSize={10}
              emptyMessage="No fee records found."
              rowClassName={(row: FeeRow) =>
                row.status === "due"
                  ? "bg-destructive/5 hover:bg-destructive/10"
                  : ""
              }
            />
          ) : (
            <div className="py-12 text-center">
              <IndianRupee className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 font-medium">No fee records yet</h3>
              <p className="text-sm text-muted-foreground">
                Add fee records from individual student pages
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Sheet */}
      <UserDetailSheet
        userId={selectedStudent?.id ?? null}
        open={!!selectedStudent}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteFeeId}
        onOpenChange={(open) => { if (!open) setDeleteFeeId(null); }}
        title="Delete Fee Record"
        description="Are you sure you want to delete this fee record? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteFeeId) return handleDelete(deleteFeeId); }}
      />
    </div>
  );
}
