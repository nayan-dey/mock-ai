"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Skeleton,
} from "@repo/ui";
import { AlertTriangle, Check, Users } from "lucide-react";
import { useState } from "react";
import type { Id } from "@repo/database/dataModel";

interface BatchSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBatchId: Id<"batches"> | undefined;
  userId: Id<"users">;
}

export function BatchSwitchDialog({
  open,
  onOpenChange,
  currentBatchId,
  userId,
}: BatchSwitchDialogProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<Id<"batches"> | null>(
    null
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const batches = useQuery(api.batches.list, { activeOnly: true });
  const switchBatch = useMutation(api.batchSwitch.switchBatch);
  const switchCount = useQuery(api.batchSwitch.getUserSwitchCount, { userId });

  const handleSelectBatch = (batchId: Id<"batches">) => {
    if (batchId === currentBatchId) return;
    setSelectedBatchId(batchId);
    setIsConfirming(true);
  };

  const handleConfirmSwitch = async () => {
    if (!selectedBatchId) return;

    setIsSwitching(true);
    try {
      await switchBatch({
        userId,
        newBatchId: selectedBatchId,
      });
      onOpenChange(false);
      setIsConfirming(false);
      setSelectedBatchId(null);
    } catch (error) {
      console.error("Failed to switch batch:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleBack = () => {
    setIsConfirming(false);
    setSelectedBatchId(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setIsConfirming(false);
    setSelectedBatchId(null);
  };

  if (!batches) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedBatch = batches.find((b) => b._id === selectedBatchId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!isConfirming ? (
          <>
            <DialogHeader>
              <DialogTitle>Switch Batch</DialogTitle>
              <DialogDescription>
                Select a batch to switch to. Your current batch is highlighted.
              </DialogDescription>
            </DialogHeader>

            {switchCount !== undefined && switchCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  You have switched batches {switchCount} time
                  {switchCount !== 1 ? "s" : ""}. Multiple switches may result
                  in account review.
                </span>
              </div>
            )}

            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {batches.map((batch) => {
                const isCurrent = batch._id === currentBatchId;
                return (
                  <button
                    key={batch._id}
                    onClick={() => handleSelectBatch(batch._id)}
                    disabled={isCurrent}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isCurrent
                        ? "border-primary bg-primary/5 cursor-default"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{batch.name}</p>
                      {batch.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {batch.description}
                        </p>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <Check className="h-3 w-3" />
                        Current
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Batch Switch</DialogTitle>
              <DialogDescription>
                Are you sure you want to switch to{" "}
                <span className="font-medium">{selectedBatch?.name}</span>?
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Warning: This action is logged
                  </p>
                  <p className="text-red-700 dark:text-red-300">
                    Batch switches are monitored for anti-theft protection.
                    Multiple switches may result in account suspension pending
                    admin review.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleBack}>
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmSwitch}
                disabled={isSwitching}
              >
                {isSwitching ? "Switching..." : "Confirm Switch"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
