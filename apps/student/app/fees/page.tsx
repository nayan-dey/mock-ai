"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  BackButton,
} from "@repo/ui";
import { IndianRupee, Calendar } from "lucide-react";

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

export default function FeesPage() {
  const { user } = useUser();

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const fees = useQuery(
    api.fees.getByStudent,
    dbUser?._id ? { studentId: dbUser._id } : "skip"
  );

  if (!user || dbUser === undefined || fees === undefined) {
    return <FeesSkeleton />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <BackButton href="/me" />

      <div className="mb-6 mt-4">
        <h1 className="text-xl font-semibold">Fees</h1>
        <p className="text-sm text-muted-foreground">
          Your fee payment records
        </p>
      </div>

      {fees && fees.length > 0 ? (
        <div className="space-y-3">
          {fees.map((fee) => (
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
              </CardContent>
            </Card>
          ))}
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
    </div>
  );
}
