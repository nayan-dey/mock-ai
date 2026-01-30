"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from "@repo/ui";
import { UserPlus, Check, X, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function JoinRequestsPage() {
  const pendingRequests = useQuery(api.orgJoinRequests.listPendingForOrg);
  const approveRequest = useMutation(api.orgJoinRequests.approve);
  const rejectRequest = useMutation(api.orgJoinRequests.reject);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await approveRequest({ requestId: requestId as any });
      toast.success("Request approved. The admin has been added to your organization.");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await rejectRequest({ requestId: requestId as any });
      toast.success("Request rejected.");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request.");
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingRequests === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Join Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review requests from admins wanting to join your organization
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No pending requests
            </p>
            <p className="text-sm text-muted-foreground">
              When someone requests to join your organization, it will appear
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <Card key={request._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{request.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.userEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested{" "}
                      {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(request.createdAt))}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => handleReject(request._id)}
                    disabled={processingId === request._id}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => handleApprove(request._id)}
                    disabled={processingId === request._id}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
