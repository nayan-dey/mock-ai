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
  Badge,
  useToast,
} from "@repo/ui";
import { Loader2, AlertCircle } from "lucide-react";
import type { Id } from "@repo/database/dataModel";

interface TestQueryDialogProps {
  testId: string | null;
  attemptId?: string | null;
  questionId: string | null;
  questionText: string | null;
  questionNumber: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUERY_TYPES = [
  { value: "wrong_answer", label: "Wrong Answer", description: "The marked correct answer appears to be incorrect" },
  { value: "wrong_question", label: "Question Error", description: "The question text has an error or typo" },
  { value: "wrong_options", label: "Options Error", description: "One or more options have errors" },
  { value: "unclear_question", label: "Unclear Question", description: "The question is confusing or ambiguous" },
  { value: "other", label: "Other", description: "Something else about this question" },
];

export function TestQueryDialog({
  testId,
  attemptId,
  questionId,
  questionText,
  questionNumber,
  open,
  onOpenChange,
}: TestQueryDialogProps) {
  const { toast } = useToast();
  const [type, setType] = useState<string>("wrong_answer");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, startSubmitting] = useTransition();

  const createQuery = useMutation(api.testQueries.create);

  const handleSubmit = () => {
    if (!testId || !questionId || !subject.trim() || !description.trim()) return;

    startSubmitting(async () => {
      try {
        await createQuery({
          testId: testId as Id<"tests">,
          questionId: questionId as Id<"questions">,
          attemptId: attemptId ? (attemptId as Id<"attempts">) : undefined,
          type: type as "wrong_answer" | "wrong_question" | "wrong_options" | "unclear_question" | "other",
          subject: subject.trim(),
          description: description.trim(),
        });
        toast({
          title: "Query Submitted",
          description: "Your query has been sent to your instructor. You can track it in the Queries section.",
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
    setType("wrong_answer");
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
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Report Question Issue
          </DialogTitle>
          <DialogDescription>
            Found an issue with this question? Let your instructor know.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Question Preview */}
          {questionText && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  Q{questionNumber}
                </Badge>
              </div>
              <p className="text-sm line-clamp-3">{questionText}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="query-type">Issue Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="query-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {QUERY_TYPES.map((qt) => (
                  <SelectItem key={qt.value} value={qt.value}>
                    <span>{qt.label}</span>
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
              placeholder="e.g., Option B should be correct"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {subject.length}/100
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="query-description">Details *</Label>
            <Textarea
              id="query-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the issue and why you think there's an error..."
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
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
