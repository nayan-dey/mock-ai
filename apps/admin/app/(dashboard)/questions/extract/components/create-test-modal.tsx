"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@repo/ui";
import { Loader2, FileText } from "lucide-react";

interface CreateTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionCount: number;
  onCreateTest: (testData: TestFormData) => Promise<void>;
  isCreating: boolean;
}

export interface TestFormData {
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  negativeMarking: number;
  status: "draft" | "published";
  batchIds: string[];
}

export function CreateTestModal({
  open,
  onOpenChange,
  questionCount,
  onCreateTest,
  isCreating,
}: CreateTestModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [marksPerQuestion, setMarksPerQuestion] = useState(4);
  const [negativeMarking, setNegativeMarking] = useState(1);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  const batches = useQuery(api.batches.list, { activeOnly: true });

  const totalMarks = questionCount * marksPerQuestion;

  const handleBatchToggle = useCallback((batchId: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateTest({
      title,
      description,
      duration,
      totalMarks,
      negativeMarking,
      status,
      batchIds: selectedBatches,
    });
  };

  const isValid = title.trim() && description.trim() && duration > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Test from Extracted Questions
          </DialogTitle>
          <DialogDescription>
            Create a test with {questionCount} selected questions. Questions will be saved to the question bank automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Test Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Physics Chapter 5 Quiz"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the test..."
              rows={2}
              required
            />
          </div>

          {/* Duration & Marks */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marksPerQuestion">Marks per Question</Label>
              <Input
                id="marksPerQuestion"
                type="number"
                min={1}
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Negative Marking & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="negativeMarking">Negative Marking</Label>
              <Input
                id="negativeMarking"
                type="number"
                min={0}
                step={0.25}
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: "draft" | "published") => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Batch Selection */}
          <div className="space-y-2">
            <Label>Target Batches (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Leave empty to make available to all students
            </p>
            <div className="flex flex-wrap gap-2 rounded-lg border p-3">
              {batches && batches.length > 0 ? (
                batches.map((batch) => (
                  <button
                    key={batch._id}
                    type="button"
                    onClick={() => handleBatchToggle(batch._id)}
                    className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Badge
                      variant={selectedBatches.includes(batch._id) ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {batch.name}
                    </Badge>
                  </button>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  No batches available
                </span>
              )}
            </div>
            {selectedBatches.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedBatches.length} batch{selectedBatches.length > 1 ? "es" : ""} selected
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Questions:</span>
              <span className="font-medium">{questionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Marks:</span>
              <span className="font-medium">{totalMarks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{duration} minutes</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                  Creating...
                </>
              ) : (
                "Create Test"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
