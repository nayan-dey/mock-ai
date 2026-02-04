"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  BackButton,
  Button,
} from "@repo/ui";
import {
  IndianRupee,
  Calendar,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { FeeQueryDialog } from "@/components/fee-query-dialog";
import Link from "next/link";

function FeesSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Skeleton className="mb-4 h-8 w-24" />
      <Skeleton className="mb-6 h-6 w-48" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function getQueryStatusIcon(status: string) {
  const className = "h-3 w-3";
  switch (status) {
    case "open":
      return <AlertCircle className={`${className} text-amber-500`} />;
    case "in_progress":
      return <Clock className={`${className} text-blue-500`} />;
    case "resolved":
      return <CheckCircle2 className={`${className} text-emerald-500`} />;
    case "closed":
      return <XCircle className={`${className} text-muted-foreground`} />;
    default:
      return null;
  }
}

function getQueryStatusLabel(status: string) {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

export default function FeesPage() {
  const { dbUser, isLoading } = useCurrentUser();
  const [showQueryDialog, setShowQueryDialog] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);

  const fees = useQuery(
    api.fees.getByStudent,
    dbUser?._id ? { studentId: dbUser._id } : "skip"
  );

  const feeQueries = useQuery(
    api.feeQueries.getByStudent,
    dbUser?._id ? {} : "skip"
  );

  // Group queries by fee ID
  const queriesByFeeId = useMemo(() => {
    if (!feeQueries) return new Map<string, typeof feeQueries>();
    const map = new Map<string, typeof feeQueries>();
    for (const query of feeQueries) {
      const existing = map.get(query.feeId) || [];
      existing.push(query);
      map.set(query.feeId, existing);
    }
    return map;
  }, [feeQueries]);

  if (isLoading || fees === undefined) {
    return <FeesSkeleton />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <BackButton href="/me" />

      <div className="mb-4 mt-4">
        <h1 className="text-xl font-semibold">Fees</h1>
        <p className="text-sm text-muted-foreground">
          Your fee payment records
        </p>
      </div>

      {fees && fees.length > 0 ? (
        <div className="space-y-3">
          {fees.map((fee) => {
            const feeQueriesList = queriesByFeeId.get(fee._id) || [];
            const latestQuery = feeQueriesList[0];

            return (
              <Card key={fee._id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          fee.status === "paid"
                            ? "bg-emerald-500/10"
                            : "bg-destructive/10"
                        }`}
                      >
                        <IndianRupee
                          className={`h-4 w-4 ${
                            fee.status === "paid"
                              ? "text-emerald-600"
                              : "text-destructive"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {fee.description || "Fee Payment"}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(fee.dueDate).toLocaleDateString("en-IN")}
                        </div>
                        {fee.status === "paid" && fee.paidDate && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Paid: {new Date(fee.paidDate).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-mono text-base font-semibold">
                        &#8377;{fee.amount.toLocaleString("en-IN")}
                      </span>
                      <Badge
                        variant={
                          fee.status === "paid" ? "success" : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {fee.status === "paid" ? "Paid" : "Due"}
                      </Badge>
                    </div>
                  </div>

                  {/* Query Status / Raise Query */}
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    {latestQuery ? (
                      <Link
                        href="/queries"
                        className="flex items-center gap-1.5 text-xs hover:underline"
                      >
                        {getQueryStatusIcon(latestQuery.status)}
                        <span className={`font-medium ${
                          latestQuery.status === "open" ? "text-amber-600" :
                          latestQuery.status === "in_progress" ? "text-blue-600" :
                          latestQuery.status === "resolved" ? "text-emerald-600" :
                          "text-muted-foreground"
                        }`}>
                          {getQueryStatusLabel(latestQuery.status)}
                        </span>
                      </Link>
                    ) : (
                      <div />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => {
                        if (latestQuery) {
                          // Navigate to queries page
                          window.location.href = "/queries";
                        } else {
                          setSelectedFeeId(fee._id);
                          setShowQueryDialog(true);
                        }
                      }}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {latestQuery ? "View Query" : "Raise Query"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IndianRupee className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            No fee records yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Your fee records will appear here
          </p>
        </div>
      )}

      <FeeQueryDialog
        feeId={selectedFeeId}
        open={showQueryDialog}
        onOpenChange={setShowQueryDialog}
      />
    </div>
  );
}
