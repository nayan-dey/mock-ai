"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/database";
import { useUser } from "@clerk/nextjs";
import {
  Input,
  Textarea,
  Label,
  useToast,
  Button,
} from "@repo/ui";
import { Copy } from "lucide-react";
import { AdminSheet } from "@/components/admin-sheet";

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement("input");
  el.readOnly = true;
  el.value = text;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.focus();
  el.setSelectionRange(0, text.length);
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
}

interface BatchEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: {
    _id: string;
    name: string;
    description?: string;
    referralCode: string;
  } | null;
}

export function BatchEditSheet({ open, onOpenChange, batch }: BatchEditSheetProps) {
  const { user } = useUser();
  const organization = useQuery(
    api.organizations.getByAdminClerkId,
    user?.id ? { adminClerkId: user.id } : "skip"
  );
  const createBatch = useMutation(api.batches.create);
  const updateBatch = useMutation(api.batches.update);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!batch;

  useEffect(() => {
    if (open) {
      setName(batch?.name ?? "");
      setDescription(batch?.description ?? "");
    }
  }, [open, batch]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateBatch({
          id: batch._id as any,
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast({ title: "Batch updated" });
      } else {
        await createBatch({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast({ title: "Batch created" });
      }
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} batch.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const referralUrl = batch
    ? (() => {
        const studentBaseUrl =
          process.env.NEXT_PUBLIC_STUDENT_APP_URL ||
          (process.env.NODE_ENV === "production"
            ? "https://www.nindo.biz"
            : "http://localhost:3000");
        const orgSlug = organization?.slug;
        return orgSlug
          ? `${studentBaseUrl}/sign-up?org=${orgSlug}&ref=${batch.referralCode}`
          : `${studentBaseUrl}/sign-up?ref=${batch.referralCode}`;
      })()
    : null;

  return (
    <AdminSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Batch" : "Create Batch"}
      description={isEdit ? "Update batch details" : "Create a new student batch"}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Save Changes" : "Create Batch"}
      isSubmitting={isSubmitting}
      submitDisabled={!name.trim()}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="batch-name">Name</Label>
          <Input
            id="batch-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Batch 2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch-desc">Description</Label>
          <Textarea
            id="batch-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description for this batch"
            rows={3}
          />
        </div>

        {isEdit && batch && (
          <div className="space-y-2">
            <Label>Referral Code</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono">
                {batch.referralCode}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  copyToClipboard(referralUrl || batch.referralCode);
                  toast({
                    title: "Copied!",
                    description: referralUrl ? "Referral link copied" : "Code copied",
                  });
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </Button>
            </div>
            {referralUrl && (
              <p className="text-xs text-muted-foreground break-all">
                {referralUrl}
              </p>
            )}
          </div>
        )}
      </div>
    </AdminSheet>
  );
}
