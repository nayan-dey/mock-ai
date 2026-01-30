"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Badge,
  Skeleton,
} from "@repo/ui";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { SUBJECTS } from "@repo/types";
import type { Id } from "@repo/database/dataModel";

type QuestionId = Id<"questions">;

const QUESTIONS_PER_PAGE = 10;

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
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [searchSubject, setSearchSubject] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = useQuery(api.questions.list, {});
  const batches = useQuery(api.batches.list, { activeOnly: true });

  // Filter questions by subject and search text
  const filteredQuestions = useMemo(() => {
    let filtered = questions ?? [];

    if (searchSubject) {
      filtered = filtered.filter((q) => q.subject === searchSubject);
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((q) =>
        q.text.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [questions, searchSubject, searchText]);

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );

  const handleQuestionToggle = useCallback((questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const handleBatchToggle = useCallback((batchId: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const currentPageIds = paginatedQuestions.map((q) => q._id as string);
    const allSelected = currentPageIds.every((id) =>
      selectedQuestions.includes(id)
    );

    if (allSelected) {
      setSelectedQuestions((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      setSelectedQuestions((prev) => {
        const combined = [...prev, ...currentPageIds];
        return [...new Set(combined)];
      });
    }
  }, [paginatedQuestions, selectedQuestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) return;

    setIsSubmitting(true);
    try {
      await createTest({
        title,
        description,
        questions: selectedQuestions as QuestionId[],
        duration,
        totalMarks,
        negativeMarking,
        status,
        batchIds:
          selectedBatches.length > 0 ? (selectedBatches as any) : undefined,
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

  const isValid = title.trim() && selectedQuestions.length > 0;

  if (!questions || !batches) {
    return (
      <div className="flex h-full flex-col overflow-hidden p-6">
        <Skeleton className="mb-4 h-10 w-32 flex-shrink-0" />
        <div className="grid flex-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <Link href="/tests" className="flex-shrink-0">
        <Button variant="ghost" className="mb-4 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </Link>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 gap-6 overflow-hidden">
        {/* Left Column - Test Details */}
        <Card className="flex w-1/2 flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Test Details</CardTitle>
            <CardDescription>Basic test information</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter test title"
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter test description"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min={1}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: "draft" | "published") =>
                    setStatus(value)
                  }
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

            {/* Batch Selection */}
            <div className="space-y-2">
              <Label>Target Batches (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Leave empty to make available to all students
              </p>
              <div
                className="flex flex-wrap gap-2 rounded-lg border p-3"
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
                    No batches available
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/tests">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Question Selection */}
        <Card className="flex w-1/2 flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>
              Select Questions ({selectedQuestions.length} selected)
            </CardTitle>
            <CardDescription>Choose questions for this test</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            {/* Filters */}
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={searchSubject || "all"}
                onValueChange={(value) => {
                  setSearchSubject(value === "all" ? "" : value);
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select All for Current Page */}
            {paginatedQuestions.length > 0 && (
              <div className="mb-2 flex items-center justify-between border-b pb-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-primary hover:underline"
                >
                  {paginatedQuestions.every((q) =>
                    selectedQuestions.includes(q._id)
                  )
                    ? "Deselect all on page"
                    : "Select all on page"}
                </button>
                <span className="text-xs text-muted-foreground">
                  {filteredQuestions.length} questions found
                </span>
              </div>
            )}

            {/* Questions List */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {paginatedQuestions.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No questions found
                </p>
              ) : (
                <div className="space-y-2 pr-2">
                  {paginatedQuestions.map((question) => (
                    <div
                      key={question._id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                        selectedQuestions.includes(question._id)
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <Checkbox
                        id={`question-${question._id}`}
                        checked={selectedQuestions.includes(question._id)}
                        onCheckedChange={() =>
                          handleQuestionToggle(question._id)
                        }
                        aria-label={`Select question: ${question.text.substring(0, 50)}`}
                      />
                      <label
                        htmlFor={`question-${question._id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="line-clamp-2 text-sm font-medium">
                          {question.text}
                        </p>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {question.subject}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.difficulty}
                          </Badge>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
