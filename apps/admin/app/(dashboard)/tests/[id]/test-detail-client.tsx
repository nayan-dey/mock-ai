"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useCallback, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  Label,
  Input,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { ArrowLeft, FileQuestion, Clock, Trophy, Users, Settings, Save, Loader2, Pencil, Check, X, Info, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Id } from "@repo/database/dataModel";
import { getStatusBadge } from "@/lib/utils";

interface TestDetailClientProps {
  testId: string;
}

export function TestDetailClient({ testId }: TestDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "questions";

  // Batch selection state
  const [selectedBatches, setSelectedBatches] = useState<string[] | null>(null);
  const [isSavingBatches, setIsSavingBatches] = useState(false);

  // Duration editing state
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [durationValue, setDurationValue] = useState("");

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "questions") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Question edit state
  const [editingQuestion, setEditingQuestion] = useState<{
    id: string;
    text: string;
    options: string[];
    correctOptions: number[];
    explanation: string;
    subject: string;
    difficulty: "easy" | "medium" | "hard";
  } | null>(null);
  const [isSavingQuestion, startSavingQuestion] = useTransition();

  const testWithQuestions = useQuery(api.tests.getWithQuestions, { id: testId as Id<"tests"> });
  const testAnalytics = useQuery(api.analytics.getTestAnalytics, { testId: testId as Id<"tests"> });
  const leaderboard = useQuery(api.analytics.getLeaderboard, { testId: testId as Id<"tests"> });
  const batches = useQuery(api.batches.list, { activeOnly: true });
  const updateTest = useMutation(api.tests.update);
  const updateQuestion = useMutation(api.questions.update);

  // Initialize selected batches from test data
  const currentBatches = selectedBatches ?? (testWithQuestions?.batchIds as string[] | undefined) ?? [];

  const handleBatchToggle = useCallback((batchId: string) => {
    setSelectedBatches((prev) => {
      const current = prev ?? (testWithQuestions?.batchIds as string[] | undefined) ?? [];
      return current.includes(batchId)
        ? current.filter((id) => id !== batchId)
        : [...current, batchId];
    });
  }, [testWithQuestions?.batchIds]);

  const handleSaveBatches = async () => {
    if (!testWithQuestions) return;

    setIsSavingBatches(true);
    try {
      await updateTest({
        id: testId as Id<"tests">,
        batchIds: currentBatches.length > 0 ? (currentBatches as any) : undefined,
      });
      toast.success("Batch assignments updated successfully");
      setSelectedBatches(null); // Reset to use server data
    } catch (error) {
      console.error("Failed to update batches:", error);
      toast.error("Failed to update batch assignments");
    } finally {
      setIsSavingBatches(false);
    }
  };

  const hasUnsavedChanges = selectedBatches !== null;

  const openQuestionEdit = (question: any) => {
    setEditingQuestion({
      id: question._id,
      text: question.text,
      options: [...question.options],
      correctOptions: [...question.correctOptions],
      explanation: question.explanation || "",
      subject: question.subject,
      difficulty: question.difficulty,
    });
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;
    startSavingQuestion(async () => {
      try {
        await updateQuestion({
          id: editingQuestion.id as Id<"questions">,
          text: editingQuestion.text,
          options: editingQuestion.options,
          correctOptions: editingQuestion.correctOptions,
          explanation: editingQuestion.explanation || undefined,
          subject: editingQuestion.subject,
          difficulty: editingQuestion.difficulty,
        });
        toast.success("Question updated");
        setEditingQuestion(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to update question");
      }
    });
  };

  const handleAddOption = () => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      options: [...editingQuestion.options, ""],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!editingQuestion || editingQuestion.options.length <= 2) return;
    const newOptions = editingQuestion.options.filter((_, i) => i !== index);
    const newCorrectOptions = editingQuestion.correctOptions
      .filter((i) => i !== index)
      .map((i) => (i > index ? i - 1 : i));
    setEditingQuestion({
      ...editingQuestion,
      options: newOptions,
      correctOptions: newCorrectOptions,
    });
  };

  const handleToggleCorrectOption = (index: number) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      correctOptions: [index],
    });
  };

  const isDraft = testWithQuestions?.status === "draft";

  const [isSavingDuration, startSavingDuration] = useTransition();

  const handleDurationSave = () => {
    const newDuration = Number(durationValue);
    if (!testWithQuestions || isNaN(newDuration) || newDuration < 1) return;

    startSavingDuration(async () => {
      try {
        await updateTest({
          id: testId as Id<"tests">,
          duration: newDuration,
        });
        toast.success("Duration updated");
        setIsEditingDuration(false);
      } catch {
        toast.error("Failed to update duration");
      }
    });
  };

  if (testWithQuestions === undefined) {
    return (
      <div className="p-6">
        <Link href="/tests">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Button>
        </Link>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testWithQuestions) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Test not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Link href="/tests">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </Button>
      </Link>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{testWithQuestions.title}</h1>
          {getStatusBadge(testWithQuestions.status)}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{testWithQuestions.description}</p>
        {/* Show assigned batches */}
        {batches && (testWithQuestions.batchIds as string[] | undefined)?.length ? (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Batches:</span>
            {(testWithQuestions.batchIds as string[]).map((batchId) => {
              const batch = batches.find((b) => b._id === batchId);
              return batch ? (
                <Badge key={batchId} variant="secondary" className="text-xs">
                  {batch.name}
                </Badge>
              ) : null;
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Available to all students</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {testWithQuestions.questions.length}
            </div>
            <p className="text-xs text-muted-foreground">In this test</p>
          </CardContent>
        </Card>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={isDraft ? "cursor-pointer transition-colors hover:bg-muted/50" : ""}
                onClick={() => {
                  if (isDraft && !isEditingDuration) {
                    setDurationValue(String(testWithQuestions.duration));
                    setIsEditingDuration(true);
                  }
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Duration</CardTitle>
                  <div className="flex items-center gap-1.5">
                    {isDraft && !isEditingDuration && (
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingDuration ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="number"
                        min={1}
                        value={durationValue}
                        onChange={(e) => setDurationValue(e.target.value)}
                        className="h-8 w-20 text-lg font-bold tabular-nums"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleDurationSave();
                          if (e.key === "Escape") setIsEditingDuration(false);
                        }}
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                      <div className="ml-auto flex gap-1">
                        <button
                          onClick={handleDurationSave}
                          disabled={isSavingDuration}
                          className="rounded-md p-1 text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-50"
                        >
                          {isSavingDuration ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setIsEditingDuration(false)}
                          disabled={isSavingDuration}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold tabular-nums">{testWithQuestions.duration} min</div>
                      <p className="text-xs text-muted-foreground">Time limit</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              {isDraft
                ? "Click to edit duration"
                : "Duration can only be changed for draft tests"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Marks</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{testWithQuestions.totalMarks}</div>
            <p className="text-xs text-muted-foreground">Maximum score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {testAnalytics?.totalAttempts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Submissions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="questions" className="flex-1 sm:flex-none">Questions</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 sm:flex-none">Analytics</TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none">Leaderboard</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 sm:flex-none">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Test Questions</CardTitle>
              <CardDescription className="text-xs">
                {testWithQuestions.questionDetails.filter(Boolean).length} questions in this test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testWithQuestions.questionDetails.filter((q): q is NonNullable<typeof q> => q !== null).map((question, index) => (
                  editingQuestion?.id === question._id ? (
                    /* Inline Edit Mode */
                    <div key={question._id} className="rounded-lg border-2 border-primary p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <span className="text-sm font-medium text-primary">Editing</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-muted-foreground"
                          onClick={() => setEditingQuestion(null)}
                          disabled={isSavingQuestion}
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Question Text</Label>
                        <Textarea
                          value={editingQuestion.text}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                          rows={3}
                        />
                      </div>

                      {/* Subject & Difficulty */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Subject</Label>
                          <Input
                            value={editingQuestion.subject}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Difficulty</Label>
                          <Select
                            value={editingQuestion.difficulty}
                            onValueChange={(v) => setEditingQuestion({ ...editingQuestion, difficulty: v as "easy" | "medium" | "hard" })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Options</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleAddOption}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {editingQuestion.options.map((option, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleCorrectOption(optIdx)}
                                className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  editingQuestion.correctOptions.includes(optIdx)
                                    ? "border-emerald-500 bg-emerald-500"
                                    : "border-muted-foreground/40 hover:border-muted-foreground"
                                }`}
                              >
                                {editingQuestion.correctOptions.includes(optIdx) && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </button>
                              <span className="text-sm font-medium w-6 shrink-0 text-muted-foreground">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...editingQuestion.options];
                                  newOptions[optIdx] = e.target.value;
                                  setEditingQuestion({ ...editingQuestion, options: newOptions });
                                }}
                                className={editingQuestion.correctOptions.includes(optIdx)
                                  ? "border-emerald-500/50 bg-emerald-500/5"
                                  : ""
                                }
                              />
                              {editingQuestion.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemoveOption(optIdx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select the correct answer.
                        </p>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Explanation (optional)</Label>
                        <Textarea
                          value={editingQuestion.explanation}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                          rows={2}
                          placeholder="Explain why the correct answer is right..."
                        />
                      </div>

                      {/* Save / Cancel actions */}
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingQuestion(null)}
                          disabled={isSavingQuestion}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveQuestion}
                          disabled={
                            isSavingQuestion ||
                            !editingQuestion.text.trim() ||
                            editingQuestion.correctOptions.length === 0 ||
                            editingQuestion.options.some((o) => !o.trim())
                          }
                        >
                          {isSavingQuestion ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div key={question._id} className="rounded-lg border p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <Badge variant="secondary">{question.subject}</Badge>
                          <Badge
                            variant={
                              question.difficulty === "easy"
                                ? "success"
                                : question.difficulty === "hard"
                                  ? "destructive"
                                  : "warning"
                            }
                          >
                            {question.difficulty}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-muted-foreground"
                          onClick={() => openQuestionEdit(question)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                      </div>
                      <p className="mb-3 text-sm font-medium">{question.text}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options?.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`rounded-md border p-2 text-sm ${
                              question.correctOptions.includes(optIndex)
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : ""
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                      </div>
                      {question.explanation && (
                        <div className="mt-3 rounded-md bg-muted/50 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Explanation</p>
                          <p className="text-sm">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Attempts</span>
                  <span className="font-medium tabular-nums">
                    {testAnalytics?.totalAttempts || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-medium tabular-nums">
                    {testAnalytics?.averageScore.toFixed(1) || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Highest Score</span>
                  <span className="font-medium tabular-nums text-emerald-600">
                    {testAnalytics?.highestScore || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lowest Score</span>
                  <span className="font-medium tabular-nums text-red-600">
                    {testAnalytics?.lowestScore || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <TooltipProvider delayDuration={0}>
                  {testAnalytics?.scoreDistribution.map((item) => {
                    const percentage = testAnalytics.totalAttempts > 0
                      ? (item.count / testAnalytics.totalAttempts) * 100
                      : 0;
                    return (
                      <Tooltip key={item.range}>
                        <TooltipTrigger asChild>
                          <div className="mb-2 flex items-center gap-2 cursor-pointer group">
                            <span className="w-16 text-xs text-muted-foreground">
                              {item.range}
                            </span>
                            <div className="flex-1 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary group-hover:bg-primary/80 transition-colors"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-6 text-right text-xs font-medium tabular-nums">
                              {item.count}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="px-3 py-2">
                          <p className="font-medium text-sm">{item.range} marks</p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="tabular-nums">{item.count} student{item.count !== 1 ? 's' : ''}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="tabular-nums">{percentage.toFixed(1)}%</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
              <CardDescription className="text-xs">Students ranked by score</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!leaderboard || leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No attempts yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto border-t">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 pl-6">Rank</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Correct</TableHead>
                        <TableHead className="text-right pr-6">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((entry) => (
                        <TableRow key={entry.userId}>
                          <TableCell className="pl-6">
                            <div className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${
                              entry.rank === 1
                                ? "bg-amber-500/10 text-amber-600"
                                : entry.rank === 2
                                  ? "bg-slate-400/10 text-slate-500"
                                  : entry.rank === 3
                                    ? "bg-orange-500/10 text-orange-600"
                                    : "text-muted-foreground"
                            }`}>
                              {entry.rank}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.userName}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{entry.score.toFixed(1)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{entry.correct}</TableCell>
                          <TableCell className="text-right pr-6 tabular-nums text-muted-foreground">
                            {Math.floor(entry.timeTaken / 60000)}m {Math.floor((entry.timeTaken % 60000) / 1000)}s
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Test Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Configure test visibility and batch assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Batch Selection */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Target Batches</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select which batches can access this test. Leave empty to make available to all students.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 rounded-lg border p-4">
                  {batches && batches.length > 0 ? (
                    batches.map((batch) => (
                      <button
                        key={batch._id}
                        type="button"
                        onClick={() => handleBatchToggle(batch._id)}
                        className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Badge
                          variant={currentBatches.includes(batch._id) ? "default" : "outline"}
                          className="cursor-pointer text-sm py-1 px-3"
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
                {currentBatches.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {currentBatches.length} batch{currentBatches.length > 1 ? "es" : ""} selected -
                    Only students in these batches can see this test
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No batches selected - All students can see this test
                  </p>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  {hasUnsavedChanges && (
                    <p className="text-sm text-amber-600">You have unsaved changes</p>
                  )}
                </div>
                <Button
                  onClick={handleSaveBatches}
                  disabled={!hasUnsavedChanges || isSavingBatches}
                >
                  {isSavingBatches ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
