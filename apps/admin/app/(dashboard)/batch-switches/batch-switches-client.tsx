"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
  Textarea,
  Label,
  type ColumnDef,
} from "@repo/ui";
import { ArrowRight, Ban, AlertTriangle, RefreshCw, Users, CheckCircle } from "lucide-react";
import type { Id } from "@repo/database/dataModel";

interface SwitchHistoryData {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fromBatchName: string;
  toBatchName: string;
  switchedAt: number;
}

interface SuspiciousUserData {
  userId: string;
  name: string;
  email: string;
  batchName: string;
  switchCount: number;
  isSuspended: boolean;
}

export function BatchSwitchesClient() {
  const { user: clerkUser } = useUser();
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const currentAdmin = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const switchHistory = useQuery(api.batchSwitch.getAllSwitchHistory, {
    limit: 100,
  });

  const suspiciousUsers = useQuery(api.batchSwitch.getUsersWithMultipleSwitches, {
    minSwitches: 2,
  });

  const suspendUser = useMutation(api.users.suspendUser);

  const handleSuspend = useCallback(async () => {
    if (suspendUserId && currentAdmin) {
      await suspendUser({
        userId: suspendUserId as Id<"users">,
        adminId: currentAdmin._id,
        reason: suspendReason || "Multiple batch switches detected",
      });
      setSuspendUserId(null);
      setSuspendReason("");
    }
  }, [suspendUserId, currentAdmin, suspendReason, suspendUser]);

  const historyColumns: ColumnDef<SwitchHistoryData>[] = useMemo(
    () => [
      {
        accessorKey: "userName",
        header: ({ column }) => <SortableHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.getValue("userName")}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.userEmail}
            </p>
          </div>
        ),
      },
      {
        id: "switch",
        header: "Switch",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{row.original.fromBatchName}</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">{row.original.toBatchName}</Badge>
          </div>
        ),
      },
      {
        accessorKey: "switchedAt",
        header: ({ column }) => (
          <SortableHeader column={column} title="Date" />
        ),
        cell: ({ row }) => formatDate(row.getValue("switchedAt")),
      },
    ],
    []
  );

  const suspiciousColumns: ColumnDef<SuspiciousUserData>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div>
              <p className="font-medium">{row.getValue("name")}</p>
              <p className="text-xs text-muted-foreground">
                {row.original.email}
              </p>
            </div>
            {row.original.isSuspended && (
              <Badge variant="destructive" className="text-xs">
                Suspended
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "batchName",
        header: "Current Batch",
        cell: ({ row }) => (
          <Badge variant="outline">{row.getValue("batchName")}</Badge>
        ),
      },
      {
        accessorKey: "switchCount",
        header: ({ column }) => (
          <SortableHeader column={column} title="Switches" />
        ),
        cell: ({ row }) => {
          const count = row.getValue("switchCount") as number;
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-600">{count}</span>
              {count >= 3 && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const userData = row.original;
          return (
            <div className="flex justify-end">
              {userData.isSuspended ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Handled
                </Badge>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setSuspendUserId(userData.userId)}
                >
                  <Ban className="mr-1 h-3 w-3" />
                  Suspend
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  if (switchHistory === undefined || suspiciousUsers === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6 space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const flaggedCount = suspiciousUsers.filter((u) => !u.isSuspended).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Batch Switches
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor batch switching activity for anti-theft protection
          </p>
        </div>
        {flaggedCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {flaggedCount} flagged
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{switchHistory.length}</p>
              <p className="text-xs text-muted-foreground">Total Switches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{suspiciousUsers.length}</p>
              <p className="text-xs text-muted-foreground">
                Users with 2+ Switches
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {/* Suspicious Users */}
        {suspiciousUsers.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle>Flagged Users</CardTitle>
              </div>
              <CardDescription>
                Users with multiple batch switches that may need review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={suspiciousColumns}
                data={suspiciousUsers as SuspiciousUserData[]}
                searchKey="name"
                searchPlaceholder="Search flagged users..."
                showPagination
                pageSize={5}
                emptyMessage="No suspicious users found."
              />
            </CardContent>
          </Card>
        )}

        {/* Recent Switch History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Switch History</CardTitle>
            <CardDescription>
              All batch switches in chronological order
            </CardDescription>
          </CardHeader>
          <CardContent>
            {switchHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3">
                  <RefreshCw className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-sm font-medium">No switch history</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Batch switches will appear here when users switch batches.
                </p>
              </div>
            ) : (
              <DataTable
                columns={historyColumns}
                data={switchHistory as SwitchHistoryData[]}
                searchKey="userName"
                searchPlaceholder="Search by user name..."
                showPagination
                pageSize={10}
                emptyMessage="No switch history found."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={!!suspendUserId} onOpenChange={() => setSuspendUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              This user has switched batches multiple times which may indicate
              suspicious activity. Suspending will prevent them from accessing
              the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                defaultValue="Multiple batch switches detected - possible anti-theft violation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendUserId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
