"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
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
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ColumnDef,
} from "@repo/ui";
import { Users, Ban, CheckCircle, Eye } from "lucide-react";
import type { Id } from "@repo/database/dataModel";
import { UserDetailSheet } from "../../../components/user-detail-sheet";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  batchId?: string;
  batchName?: string;
  isSuspended?: boolean;
  createdAt: number;
}

export function UsersClient() {
  const { user: clerkUser } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [unsuspendUserId, setUnsuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [unsuspendBatchId, setUnsuspendBatchId] = useState<string>("");

  const currentAdmin = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const users = useQuery(api.users.list, {});
  const batches = useQuery(api.batches.list, {});
  const activeBatches = useQuery(api.batches.list, { activeOnly: true });
  const suspendUser = useMutation(api.users.suspendUser);
  const unsuspendUser = useMutation(api.users.unsuspendUser);

  // Create maps for lookups
  const batchMap = useMemo(() => {
    const map: Record<string, string> = {};
    batches?.forEach((batch) => {
      map[batch._id] = batch.name;
    });
    return map;
  }, [batches]);

  // Enrich users data
  const enrichedUsers: UserData[] = useMemo(() => {
    if (!users) return [];
    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      batchId: user.batchId,
      batchName: user.batchId ? batchMap[user.batchId] : undefined,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
    }));
  }, [users, batchMap]);

  const handleSuspend = useCallback(async () => {
    if (suspendUserId && currentAdmin) {
      await suspendUser({
        userId: suspendUserId as Id<"users">,
        adminId: currentAdmin._id,
        reason: suspendReason || undefined,
      });
      setSuspendUserId(null);
      setSuspendReason("");
    }
  }, [suspendUserId, currentAdmin, suspendReason, suspendUser]);

  const handleUnsuspend = useCallback(async () => {
    if (unsuspendUserId && currentAdmin && unsuspendBatchId) {
      await unsuspendUser({
        userId: unsuspendUserId as Id<"users">,
        adminId: currentAdmin._id,
        batchId: unsuspendBatchId as Id<"batches">,
      });
      setUnsuspendUserId(null);
      setUnsuspendBatchId("");
    }
  }, [unsuspendUserId, currentAdmin, unsuspendBatchId, unsuspendUser]);

  const getRoleBadge = useCallback((role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "teacher":
        return <Badge variant="secondary">Teacher</Badge>;
      case "student":
        return <Badge variant="outline">Student</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  }, []);

  const columns: ColumnDef<UserData>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.getValue("name")}</span>
            {row.original.isSuspended && (
              <Badge variant="destructive" className="text-xs">
                Suspended
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column} title="Email" />
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => <SortableHeader column={column} title="Role" />,
        cell: ({ row }) => getRoleBadge(row.getValue("role")),
      },
      {
        accessorKey: "batchName",
        header: "Batch",
        cell: ({ row }) => row.getValue("batchName") || "-",
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column} title="Joined" />
        ),
        cell: ({ row }) => formatDate(row.getValue("createdAt")),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const userData = row.original;
          const isAdmin = userData.role === "admin";

          return (
            <div className="flex justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="View user profile"
                onClick={() => setSelectedUserId(userData._id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {!isAdmin &&
                (userData.isSuspended ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Unsuspend user"
                    onClick={() => setUnsuspendUserId(userData._id)}
                  >
                    <CheckCircle className="h-4 w-4 text-success" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Suspend user"
                    onClick={() => setSuspendUserId(userData._id)}
                  >
                    <Ban className="h-4 w-4 text-destructive" />
                  </Button>
                ))}
            </div>
          );
        },
      },
    ],
    [getRoleBadge]
  );

  if (users === undefined || batches === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentCount = users.filter((u) => u.role === "student").length;
  const suspendedCount = users.filter((u) => u.isSuspended).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage students, teachers, and admins
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="min-h-[76px]">
          <CardContent className="flex h-full items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[76px]">
          <CardContent className="flex h-full items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studentCount}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[76px]">
          <CardContent className="flex h-full items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <Ban className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{suspendedCount}</p>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No users yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Users will appear here when they sign up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={enrichedUsers}
              searchKey="name"
              searchPlaceholder="Search users..."
              showPagination
              pageSize={10}
              emptyMessage="No users found."
            />
          </CardContent>
        </Card>
      )}

      {/* Suspend Dialog */}
      <Dialog open={!!suspendUserId} onOpenChange={() => setSuspendUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              This will prevent the user from accessing the platform. You can
              unsuspend them later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
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

      {/* User Detail Sheet */}
      <UserDetailSheet
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
      />

      {/* Unsuspend Dialog with Batch Selection */}
      <Dialog
        open={!!unsuspendUserId}
        onOpenChange={() => {
          setUnsuspendUserId(null);
          setUnsuspendBatchId("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend User</DialogTitle>
            <DialogDescription>
              Restore the user's access to the platform. You must assign them to
              a batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unsuspend-batch">
                Assign to Batch <span className="text-destructive">*</span>
              </Label>
              <Select
                value={unsuspendBatchId}
                onValueChange={setUnsuspendBatchId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch (required)" />
                </SelectTrigger>
                <SelectContent>
                  {activeBatches?.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The user will be assigned to this batch.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnsuspendUserId(null);
                setUnsuspendBatchId("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUnsuspend} disabled={!unsuspendBatchId}>
              Unsuspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
