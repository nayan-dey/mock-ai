"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Badge,
  Skeleton,
  DataTable,
  SortableHeader,
  type ColumnDef,
  type FacetedFilterConfig,
} from "@repo/ui";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database/dataModel";

type QuestionId = Id<"questions">;

interface Question {
  _id: string;
  text: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  options: string[];
  correctOptions: number[];
  explanation?: string;
}

export function NewTestClient() {
  const router = useRouter();
  const { user } = useUser();
  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const createTest = useMutation(api.tests.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = useQuery(api.questions.list, {});
  const batches = useQuery(api.batches.list, { activeOnly: true });
  const subjects = useQuery(api.subjects.list, {});

  const handleBatchToggle = useCallback((batchId: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  }, []);

  const handleSubmit = async () => {
    if (!dbUser) return;

    if (!title.trim()) {
      toast.error("Please enter a test title");
      return;
    }

    if (selectedBatches.length === 0) {
      toast.error("Please select at least one target batch");
      return;
    }

    if (selectedQuestions.size === 0) {
      toast.error("Please select at least one question");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTest({
        title,
        description,
        questions: [...selectedQuestions] as QuestionId[],
        duration,
        totalMarks,
        negativeMarking,
        status,
        batchIds: selectedBatches as any,
      });
      toast.success("Test created successfully");
      router.push("/tests");
    } catch (error) {
      console.error("Failed to create test:", error);
      toast.error("Failed to create test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    title.trim() && selectedQuestions.size > 0 && selectedBatches.length > 0;

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="success">Easy</Badge>;
      case "medium":
        return <Badge variant="warning">Medium</Badge>;
      case "hard":
        return <Badge variant="destructive">Hard</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  const facetedFilters = useMemo<FacetedFilterConfig[]>(() => [
    {
      columnId: "subject",
      title: "Subject",
      options: (subjects ?? []).map((s) => ({ label: s.name, value: s.name })),
    },
    {
      columnId: "difficulty",
      title: "Difficulty",
      options: [
        { label: "Easy", value: "easy" },
        { label: "Medium", value: "medium" },
        { label: "Hard", value: "hard" },
      ],
    },
  ], [subjects]);

  const questionsData = (questions as Question[]) ?? [];

  const columns: ColumnDef<Question, any>[] = useMemo(
    () => [
      {
        id: "_select",
        header: () => null,
        cell: ({ row }) => (
          <Checkbox
            checked={selectedQuestions.has(row.original._id)}
            onCheckedChange={(checked) => {
              setSelectedQuestions((prev) => {
                const next = new Set(prev);
                if (checked) {
                  next.add(row.original._id);
                } else {
                  next.delete(row.original._id);
                }
                return next;
              });
            }}
            aria-label={`Select question`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "text",
        header: ({ column }) => (
          <SortableHeader column={column} title="Question" />
        ),
        cell: ({ row }) => (
          <p className="max-w-[300px] truncate font-medium">
            {row.getValue("text")}
          </p>
        ),
      },
      {
        accessorKey: "subject",
        header: ({ column }) => (
          <SortableHeader column={column} title="Subject" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline">{row.getValue("subject")}</Badge>
        ),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "difficulty",
        header: ({ column }) => (
          <SortableHeader column={column} title="Difficulty" />
        ),
        cell: ({ row }) => getDifficultyBadge(row.getValue("difficulty")),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
    ],
    [selectedQuestions]
  );

  if (!questions || !batches) {
    return (
      <div className="flex h-full flex-col overflow-hidden p-6">
        <Skeleton className="mb-4 h-10 w-32" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      {/* Header Row */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/tests">
          <Button variant="ghost" className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tests
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          size="sm"
          className="gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating…" : "Create Test"}
        </Button>
      </div>

      {/* Top Section — Form Fields */}
      <div className="mb-1 flex-shrink-0 space-y-1">
        {/* Row 1: Title + Description */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter test title"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief test description"
            />
          </div>
        </div>

        {/* Row 2: Duration, Marks, Negative, Status */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="duration">Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="totalMarks">Total Marks</Label>
            <Input
              id="totalMarks"
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="negativeMarking">Negative Marking</Label>
            <Input
              id="negativeMarking"
              type="number"
              step={0.25}
              min={0}
              value={negativeMarking}
              onChange={(e) => setNegativeMarking(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value: "draft" | "published") => setStatus(value)}
            >
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

        {/* Row 3: Target Batches */}
        <div className="space-y-1.5">
          <Label>Target Batches *</Label>
          <div
            className="flex flex-wrap gap-2 rounded-lg border p-2.5"
            role="group"
            aria-label="Select target batches"
          >
            {batches && batches.length > 0 ? (
              batches.map((batch) => (
                <button
                  key={batch._id}
                  type="button"
                  onClick={() => handleBatchToggle(batch._id)}
                  className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-pressed={selectedBatches.includes(batch._id)}
                >
                  <Badge
                    variant={
                      selectedBatches.includes(batch._id)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                  >
                    {batch.name}
                  </Badge>
                </button>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No batches available. Create a batch first.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section — Questions Table */}
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Select Questions{" "}
              <span className="text-muted-foreground">
                ({selectedQuestions.size} selected)
              </span>
            </h2>
          </div>
          <DataTable
            columns={columns}
            data={questionsData}
            searchKey="text"
            searchPlaceholder="Search questions..."
            showPagination
            pageSize={10}
            emptyMessage="No questions found"
            className="flex-1 min-h-0"
            facetedFilters={facetedFilters}
            showColumnVisibility
          />
        </CardContent>
      </Card>
    </div>
  );
}
