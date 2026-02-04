"use client";

import { useState, useTransition } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  useToast,
} from "@repo/ui";
import { Loader2 } from "lucide-react";
import type { Id } from "@repo/database/dataModel";

interface FeeQueryDialogProps {
  feeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUERY_TYPES = [
  { value: "clarification", label: "Clarification", description: "Need more information about this fee" },
  { value: "dispute", label: "Dispute", description: "I believe this fee is incorrect" },
  { value: "payment_issue", label: "Payment Issue", description: "Problem with payment processing" },
  { value: "extension_request", label: "Extension Request", description: "Request more time to pay" },
  { value: "other", label: "Other", description: "Something else" },
];

export function FeeQueryDialog({ feeId, open, onOpenChange }: FeeQueryDialogProps) {
  const { toast } = useToast();
  const [type, setType] = useState<string>("clarification");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, startSubmitting] = useTransition();

  const createQuery = useMutation(api.feeQueries.create);

  const handleSubmit = () => {
    if (!feeId || !subject.trim() || !description.trim()) return;

    startSubmitting(async () => {
      try {
        await createQuery({
          feeId: feeId as Id<"fees">,
          type: type as "dispute" | "clarification" | "payment_issue" | "extension_request" | "other",
          subject: subject.trim(),
          description: description.trim(),
        });
        toast({
          title: "Query Submitted",
          description: "Your query has been sent to your instructor. You'll be notified when they respond.",
        });
        onOpenChange(false);
        resetForm();
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to submit query. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const resetForm = () => {
    setType("clarification");
    setSubject("");
    setDescription("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raise Fee Query</DialogTitle>
          <DialogDescription>
            Submit a query about this fee. Your instructor will be notified and respond as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="query-type">Query Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="query-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {QUERY_TYPES.map((qt) => (
                  <SelectItem key={qt.value} value={qt.value}>
                    <div>
                      <span>{qt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {QUERY_TYPES.find((qt) => qt.value === type)?.description}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="query-subject">Subject *</Label>
            <Input
              id="query-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your query"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {subject.length}/100
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="query-description">Description *</Label>
            <Textarea
              id="query-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your query..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!subject.trim() || !description.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Query"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
