"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
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
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { SUBJECTS } from "@repo/types";
import type { Id } from "@repo/database";

type QuestionId = Id<"questions">;

export default function NewTestPage() {
  const router = useRouter();
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, {
    clerkId: user?.id ?? "",
  });
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = useQuery(api.questions.list, {
    subject: searchSubject || undefined,
  });

  const batches = useQuery(api.batches.list, { activeOnly: true });

  const handleQuestionToggle = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter((id) => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const handleBatchToggle = (batchId: string) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(selectedBatches.filter((id) => id !== batchId));
    } else {
      setSelectedBatches([...selectedBatches, batchId]);
    }
  };

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
        batchIds: selectedBatches.length > 0 ? (selectedBatches as any) : undefined,
        createdBy: dbUser._id,
      });
      router.push("/tests");
    } catch (error) {
      console.error("Failed to create test:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = title.trim() && selectedQuestions.length > 0;

  return (
    <div className="p-8">
      <Link href="/tests">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </Link>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Test Details */}
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
              <CardDescription>Basic test information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter test title"
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
                <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                  {batches && batches.length > 0 ? (
                    batches.map((batch) => (
                      <Badge
                        key={batch._id}
                        variant={selectedBatches.includes(batch._id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleBatchToggle(batch._id)}
                      >
                        {batch.name}
                      </Badge>
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

          {/* Question Selection */}
          <Card>
            <CardHeader>
              <CardTitle>
                Select Questions ({selectedQuestions.length} selected)
              </CardTitle>
              <CardDescription>Choose questions for this test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select
                  value={searchSubject}
                  onValueChange={(value) =>
                    setSearchSubject(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by subject" />
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

              <div className="max-h-[400px] space-y-2 overflow-y-auto">
                {!questions ? (
                  [...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : questions.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No questions found
                  </p>
                ) : (
                  questions.map((question) => (
                    <div
                      key={question._id}
                      className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedQuestions.includes(question._id)}
                        onCheckedChange={() => handleQuestionToggle(question._id)}
                      />
                      <div className="flex-1">
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
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
