"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Avatar,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  formatDate,
} from "@repo/ui";
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  Mail,
  Calendar,
  Users,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database/dataModel";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function UserDetailSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="mt-4 h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-48" />
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user: clerkUser } = useUser();

  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const currentAdmin = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const user = useQuery(api.users.getById, { id: userId as Id<"users"> });
  const batch = useQuery(
    api.batches.getById,
    user?.batchId ? { id: user.batchId } : "skip"
  );
  const allBatches = useQuery(api.batches.list, { activeOnly: true });
  const switchHistory = useQuery(api.batchSwitch.getSwitchHistory, {
    userId: userId as Id<"users">,
  });

  const suspendUser = useMutation(api.users.suspendUser);
  const unsuspendUser = useMutation(api.users.unsuspendUser);

  const handleSuspend = async () => {
    if (!currentAdmin) return;
    await suspendUser({
      userId: userId as Id<"users">,
      adminId: currentAdmin._id,
      reason: suspendReason || undefined,
    });
    setShowSuspendDialog(false);
    setSuspendReason("");
  };

  const handleUnsuspend = async () => {
    if (!currentAdmin || !selectedBatchId) return;
    await unsuspendUser({
      userId: userId as Id<"users">,
      adminId: currentAdmin._id,
      batchId: selectedBatchId as Id<"batches">,
    });
    setShowUnsuspendDialog(false);
    setSelectedBatchId("");
  };

  const openUnsuspendDialog = () => {
    // Pre-select current batch if user has one
    setSelectedBatchId(user?.batchId || "");
    setShowUnsuspendDialog(true);
  };

  if (user === undefined) {
    return <UserDetailSkeleton />;
  }

  if (user === null) {
    return (
      <div className="p-6">
        <Link href="/users">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="p-6">
      <Link href="/users">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 border-2">
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>

              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant={
                    user.role === "admin"
                      ? "destructive"
                      : user.role === "teacher"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {user.role}
                </Badge>
                {user.isSuspended && (
                  <Badge variant="destructive">Suspended</Badge>
                )}
              </div>

              <div className="mt-4 w-full space-y-2 text-left text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(user.createdAt)}
                </div>
                {batch && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {batch.name}
                  </div>
                )}
                {user.age && (
                  <div className="text-muted-foreground">
                    Age: {user.age} years
                  </div>
                )}
              </div>

              {user.bio && (
                <div className="mt-4 w-full rounded-lg bg-muted p-3 text-left text-sm">
                  {user.bio}
                </div>
              )}

              {/* Action Buttons */}
              {!isAdmin && (
                <div className="mt-6 w-full">
                  {user.isSuspended ? (
                    <Button className="w-full" onClick={openUnsuspendDialog}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Unsuspend User
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowSuspendDialog(true)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend User
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details and History */}
        <div className="space-y-6 lg:col-span-2">
          {/* Suspension Info */}
          {user.isSuspended && (
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-800 dark:text-red-200">
                    Account Suspended
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {user.suspendReason && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Reason:</strong> {user.suspendReason}
                  </p>
                )}
                {user.suspendedAt && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    Suspended on {formatDate(user.suspendedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Batch Switch History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Batch Switch History</CardTitle>
              </div>
              <CardDescription>
                Record of all batch switches for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {switchHistory && switchHistory.length > 0 ? (
                <div className="space-y-3">
                  {switchHistory.map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{entry.fromBatchName}</Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="secondary">{entry.toBatchName}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(entry.switchedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No batch switches recorded
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              This will prevent {user.name} from accessing the platform.
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
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog with Batch Selection */}
      <Dialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend User</DialogTitle>
            <DialogDescription>
              Restore {user.name}'s access to the platform. You must assign them
              to a batch - they will not be able to change it afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch">
                Assign to Batch <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch (required)" />
                </SelectTrigger>
                <SelectContent>
                  {allBatches?.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The user's batch will be locked after unsuspension. They will
                not be able to switch batches on their own.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnsuspendDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUnsuspend} disabled={!selectedBatchId}>
              Unsuspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
