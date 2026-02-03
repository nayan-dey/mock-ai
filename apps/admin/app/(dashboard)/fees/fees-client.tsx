"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useTransition, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  SortableHeader,
  type ColumnDef,
  type FacetedFilterConfig,
  useToast,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
} from "@repo/ui";
import {
  IndianRupee,
  Eye,
  CheckCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Id } from "@repo/database/dataModel";
import { UserDetailSheet } from "../../../components/user-detail-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AdminTable, createActionsColumn, type ActionMenuItem } from "@/components/admin-table";
import { ExportDropdown } from "@/components/export-dropdown";
import {
  exportToExcel,
  exportToPdf,
  type ExportColumn,
} from "@/lib/export-utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const feeExportColumns: ExportColumn[] = [
  { header: "Student Name", key: "studentName" },
  { header: "Email", key: "studentEmail" },
  { header: "Batch", key: "batchName" },
  { header: "Month", key: "dueMonth" },
  { header: "Description", key: "description", format: (v) => v || "Fee Payment" },
  { header: "Amount", key: "amount", format: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
  { header: "Due Date", key: "dueDate", format: (v) => new Date(v).toLocaleDateString("en-IN") },
  { header: "Status", key: "status", format: (v) => (v === "paid" ? "Paid" : "Due") },
  { header: "Paid Date", key: "paidDate", format: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
];

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

interface GroupedFeeRow extends FeeRow {
  _allFees: FeeRow[];
  _feeCount: number;
}

export function FeesClient() {
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
  const [markPaidFeeId, setMarkPaidFeeId] = useState<string | null>(null);
  const [markPaidDate, setMarkPaidDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set()
  );

  const currentAdmin = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const organization = useQuery(api.organizations.getMyOrg);

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
      const parse = (s: string) => {
        const [month, year] = s.split(" ");
        return new Date(`${month} 1, ${year}`).getTime();
      };
      return parse(b) - parse(a);
    });
    const statuses = [...new Set(enrichedFees.map((f) => f.status))].sort();
    return { batches, months, statuses };
  }, [enrichedFees]);

  // Group fees by student — one row per student with all their fees attached
  const groupedFees: GroupedFeeRow[] = useMemo(() => {
    const groups = new Map<string, FeeRow[]>();
    for (const fee of enrichedFees) {
      const existing = groups.get(fee.studentId);
      if (existing) {
        existing.push(fee);
      } else {
        groups.set(fee.studentId, [fee]);
      }
    }
    return Array.from(groups.values()).map((fees) => {
      // Sort by dueDate descending so the most recent fee is the representative
      fees.sort((a, b) => b.dueDate - a.dueDate);
      return {
        ...fees[0],
        _allFees: fees,
        _feeCount: fees.length,
      };
    });
  }, [enrichedFees]);

  const toggleStudentExpand = useCallback((studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }, []);

  // Stats based on all data (filtering handled by table)
  const stats = useMemo(() => {
    const data = enrichedFees;
    const due = data.filter((f) => f.status === "due");
    const paid = data.filter((f) => f.status === "paid");
    return {
      total: data.length,
      due: due.length,
      paid: paid.length,
      dueAmount: due.reduce((s, f) => s + f.amount, 0),
      paidAmount: paid.reduce((s, f) => s + f.amount, 0),
    };
  }, [enrichedFees]);

  const [isMarkingPaid, startMarkingPaid] = useTransition();

  const handleMarkAsPaid = () => {
    if (!currentAdmin || !markPaidFeeId) return;
    startMarkingPaid(async () => {
      try {
        const paidTimestamp = markPaidDate
          ? new Date(markPaidDate).getTime()
          : undefined;
        await markAsPaid({
          id: markPaidFeeId as Id<"fees">,
          paidDate: paidTimestamp,
        });
        toast({ title: "Marked as paid" });
        setMarkPaidFeeId(null);
        setMarkPaidDate(new Date().toISOString().split("T")[0]);
      } catch (err: any) {
        toast({
          title: "Error",
          description: "Failed to update fee.",
          variant: "destructive",
        });
      }
    });
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
        description: "Failed to delete fee.",
        variant: "destructive",
      });
    }
    setDeleteFeeId(null);
  };

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(enrichedFees, feeExportColumns, "Fees", "Fees");
    toast({ title: "Exported to Excel" });
  };

  const handleExportPdf = () => {
    exportToPdf(enrichedFees, feeExportColumns, "Fees", "Fee Records", organization?.name, organization?.resolvedLogoUrl);
    toast({ title: "Exported to PDF" });
  };

  const columns: ColumnDef<GroupedFeeRow, any>[] = useMemo(() => [
    {
      accessorKey: "studentName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Student" />
      ),
      cell: ({ row }) => {
        const feeCount = row.original._feeCount;
        const isExpanded = expandedStudents.has(row.original.studentId);
        return (
          <div className="flex items-center gap-2">
            {feeCount > 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStudentExpand(row.original.studentId);
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <div className="max-w-[200px] min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium truncate">
                  {row.getValue("studentName")}
                </p>
                {feeCount > 1 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 shrink-0 rounded-full px-1.5 text-[10px]"
                  >
                    {feeCount}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {row.original.studentEmail}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "batchName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Batch" />
      ),
      cell: ({ row }) => {
        if (row.original._feeCount > 1) {
          const batches = [...new Set(row.original._allFees.map((f) => f.batchName))];
          return batches.length === 1 ? (
            <Badge variant="outline" className="font-normal">
              {batches[0]}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {batches.length} batches
            </span>
          );
        }
        return (
          <Badge variant="outline" className="font-normal">
            {row.getValue("batchName")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dueMonth",
      header: ({ column }) => (
        <SortableHeader column={column} title="Month" />
      ),
      cell: ({ row }) => {
        if (row.original._feeCount > 1) {
          return (
            <span className="text-xs text-muted-foreground">—</span>
          );
        }
        return (
          <span className="text-muted-foreground">
            {row.getValue("dueMonth")}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        if (row.original._feeCount > 1) {
          return (
            <span className="text-xs text-muted-foreground">—</span>
          );
        }
        return (
          <span className="text-muted-foreground">
            {row.getValue("description") || "Fee Payment"}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <SortableHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        if (row.original._feeCount > 1) {
          const total = row.original._allFees.reduce((s, f) => s + f.amount, 0);
          return (
            <span className="font-mono font-semibold">
              &#8377;{total.toLocaleString("en-IN")}
            </span>
          );
        }
        return (
          <span className="font-mono font-semibold">
            &#8377;{(row.getValue("amount") as number).toLocaleString("en-IN")}
          </span>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <SortableHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        if (row.original._feeCount > 1) {
          return (
            <span className="text-xs text-muted-foreground">—</span>
          );
        }
        return (
          <span className="text-muted-foreground">
            {new Date(row.getValue("dueDate") as number).toLocaleDateString(
              "en-IN"
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        if (row.original._feeCount > 1) {
          const dueCount = row.original._allFees.filter((f) => f.status === "due").length;
          const paidCount = row.original._allFees.filter((f) => f.status === "paid").length;
          return (
            <div className="flex gap-1">
              {dueCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-destructive/20 bg-destructive/10 text-destructive text-xs"
                >
                  {dueCount} Due
                </Badge>
              )}
              {paidCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs"
                >
                  {paidCount} Paid
                </Badge>
              )}
            </div>
          );
        }
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
        if (row.original._feeCount > 1) {
          return (
            <span className="text-xs text-muted-foreground">—</span>
          );
        }
        const pd = row.getValue("paidDate") as number | undefined;
        return (
          <span className="text-muted-foreground">
            {pd ? new Date(pd).toLocaleDateString("en-IN") : "—"}
          </span>
        );
      },
    },
    // Hidden filter columns
    {
      id: "batchFilter",
      accessorFn: (row) => row.batchName,
      header: () => null,
      cell: () => null,
      filterFn: (row, columnId, filterValue) => {
        const batchName = row.getValue(columnId) as string;
        return filterValue.includes(batchName);
      },
      enableHiding: true,
    },
    {
      id: "monthFilter",
      accessorFn: (row) => row.dueMonth,
      header: () => null,
      cell: () => null,
      filterFn: (row, columnId, filterValue) => {
        const month = row.getValue(columnId) as string;
        return filterValue.includes(month);
      },
      enableHiding: true,
    },
    {
      id: "statusFilter",
      accessorFn: (row) => row.status,
      header: () => null,
      cell: () => null,
      filterFn: (row, columnId, filterValue) => {
        const status = row.getValue(columnId) as string;
        return filterValue.includes(status);
      },
      enableHiding: true,
    },
    createActionsColumn<GroupedFeeRow>((fee) => {
      const actions: ActionMenuItem[] = [
        {
          label: "View Details",
          icon: <Eye className="h-4 w-4" />,
          onClick: () =>
            setSelectedStudent({
              id: fee.studentId,
              name: fee.studentName,
            }),
        },
      ];

      if (fee.status === "due") {
        actions.push({
          label: "Mark as Paid",
          icon: <CheckCircle className="h-4 w-4" />,
          onClick: () => {
            setMarkPaidDate(new Date().toISOString().split("T")[0]);
            setMarkPaidFeeId(fee._id);
          },
        });
      }

      actions.push({
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => setDeleteFeeId(fee._id),
        variant: "destructive" as const,
        separator: true,
      });

      return actions;
    }),
  ], [expandedStudents, toggleStudentExpand, setSelectedStudent, setMarkPaidDate, setMarkPaidFeeId, setDeleteFeeId]);

  // Faceted filters configuration
  const facetedFilters: FacetedFilterConfig[] = useMemo(() => [
    {
      columnId: "batchFilter",
      title: "Batch",
      options: filterOptions.batches.map(batch => ({ label: batch, value: batch })),
    },
    {
      columnId: "monthFilter",
      title: "Month",
      options: filterOptions.months.map(month => ({ label: month, value: month })),
    },
    {
      columnId: "statusFilter",
      title: "Status",
      options: filterOptions.statuses.map(status => ({
        label: status === "paid" ? "Paid" : "Due",
        value: status
      })),
    },
  ], [filterOptions]);

  return (
    <>
      <AdminTable<GroupedFeeRow>
        columns={columns}
        data={groupedFees}
        isLoading={allFees === undefined}
        searchKey="studentName"
        searchPlaceholder="Search by student name..."
        title="Fees"
        description="Manage student fee records across all batches"
        pageSize={10}
        emptyIcon={<IndianRupee className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No fee records yet"
        emptyDescription="Add fee records from individual student pages"
        rowClassName={(row: GroupedFeeRow) =>
          row._feeCount === 1 && row.status === "due"
            ? "bg-destructive/5 hover:bg-destructive/10"
            : ""
        }
        renderSubRow={(row: GroupedFeeRow) => {
          if (row._feeCount <= 1 || !expandedStudents.has(row.studentId))
            return null;
          const otherFees = row._allFees;
          return (
            <div className="px-4 py-2">
              <table className="w-full text-sm">
                <tbody>
                  {otherFees.map((fee) => (
                    <tr
                      key={fee._id}
                      className={`border-b last:border-b-0 border-border/50 ${
                        fee.status === "due"
                          ? "bg-destructive/5"
                          : ""
                      }`}
                    >
                      <td className="py-2 pl-7 pr-3 w-[200px]">
                        <span className="text-xs text-muted-foreground">
                          {getMonthLabel(fee.dueDate)}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="font-normal text-xs">
                          {fee.batchName}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs text-muted-foreground">
                          {getMonthLabel(fee.dueDate)}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs text-muted-foreground">
                          {fee.description || "Fee Payment"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-xs font-semibold">
                          &#8377;
                          {fee.amount.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(fee.dueDate).toLocaleDateString("en-IN")}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            fee.status === "paid"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                              : "border-destructive/20 bg-destructive/10 text-destructive"
                          }`}
                        >
                          {fee.status === "paid" ? "Paid" : "Due"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs text-muted-foreground">
                          {fee.paidDate
                            ? new Date(fee.paidDate).toLocaleDateString("en-IN")
                            : "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
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
                                onClick={() => {
                                  setMarkPaidDate(
                                    new Date().toISOString().split("T")[0]
                                  );
                                  setMarkPaidFeeId(fee._id);
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteFeeId(fee._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
        facetedFilters={facetedFilters}
        showColumnVisibility={true}
        showCard={false}
        toolbarExtra={
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={enrichedFees.length === 0}
          />
        }
      />

      {/* User Detail Sheet */}
      <UserDetailSheet
        userId={selectedStudent?.id ?? null}
        open={!!selectedStudent}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
      />

      {/* Mark as Paid Confirmation */}
      <Dialog
        open={!!markPaidFeeId}
        onOpenChange={(o) => {
          if (!o) {
            setMarkPaidFeeId(null);
            setMarkPaidDate(new Date().toISOString().split("T")[0]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Fee as Paid</DialogTitle>
            <DialogDescription>
              Confirm payment and select the date it was paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fees-mark-paid-date">Paid Date</Label>
              <Input
                id="fees-mark-paid-date"
                type="date"
                value={markPaidDate}
                onChange={(e) => setMarkPaidDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isMarkingPaid}
              onClick={() => {
                setMarkPaidFeeId(null);
                setMarkPaidDate(new Date().toISOString().split("T")[0]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={!markPaidDate || isMarkingPaid}>
              {isMarkingPaid ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteFeeId}
        onOpenChange={(open) => { if (!open) setDeleteFeeId(null); }}
        title="Delete Fee Record"
        description="Are you sure you want to delete this fee record? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteFeeId) return handleDelete(deleteFeeId); }}
      />
    </>
  );
}
