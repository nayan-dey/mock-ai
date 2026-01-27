"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  LeaderboardTable,
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  type LeaderboardEntry,
} from "@repo/ui";
import { ArrowLeft, Trophy, Users, CheckCircle2, XCircle, MinusCircle, Filter, ListFilter } from "lucide-react";
import Link from "next/link";
import type { GenericId } from "convex/values";
import { useState, useMemo } from "react";

type Id<T extends string> = GenericId<T>;
type AttemptId = Id<"attempts">;

type FilterType = "all" | "correct" | "incorrect" | "skipped";

export default function ResultDetailPage() {
  const params = useParams();
  const attemptId = params.id as string;
  const { user } = useUser();
  const [filter, setFilter] = useState<FilterType>("all");

  const attemptWithDetails = useQuery(api.attempts.getWithDetails, {
    id: attemptId as AttemptId,
  });

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const attemptBreakdown = useQuery(
    api.analytics.getAttemptBreakdown,
    attemptId ? { attemptId: attemptId as AttemptId } : "skip"
  );

  const leaderboard = useQuery(
    api.analytics.getLeaderboard,
    attemptWithDetails?.testId ? { testId: attemptWithDetails.testId } : "skip"
  );

  const userRank = useQuery(
    api.analytics.getUserTestRank,
    attemptWithDetails?.testId && dbUser?._id
      ? { testId: attemptWithDetails.testId, userId: dbUser._id }
      : "skip"
  );

  // Filter questions based on selected filter
  const filteredQuestions = useMemo(() => {
    if (!attemptWithDetails) return [];
    const { questions, answers } = attemptWithDetails;

    return questions.filter((question) => {
      if (!question) return false;
      const answer = answers.find((a) => a.questionId === question._id);
      const selectedOptions = answer?.selected || [];
      const isCorrect =
        selectedOptions.length === question.correctOptions.length &&
        selectedOptions.every((s) => question.correctOptions.includes(s));
      const isSkipped = selectedOptions.length === 0;

      switch (filter) {
        case "correct":
          return isCorrect;
        case "incorrect":
          return !isCorrect && !isSkipped;
        case "skipped":
          return isSkipped;
        default:
          return true;
      }
    });
  }, [attemptWithDetails, filter]);

  if (!attemptWithDetails) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-6 h-4 w-48" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  const { test, questions, answers } = attemptWithDetails;
  const percentage = (attemptWithDetails.score / test.totalMarks) * 100;
  const timeTaken = attemptWithDetails.submittedAt
    ? attemptWithDetails.submittedAt - attemptWithDetails.startedAt
    : 0;
  const minutes = Math.floor(timeTaken / 60000);
  const seconds = Math.floor((timeTaken % 60000) / 1000);
  const totalQuestions = questions.length;

  const filterLabels: Record<FilterType, string> = {
    all: "All Questions",
    correct: "Correct",
    incorrect: "Incorrect",
    skipped: "Skipped",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/results">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Button>
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {test.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Completed in {minutes}m {seconds}s
            </p>
          </div>

          {/* Score Circle */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${percentage * 2.26} 226`}
                  className={percentage >= 60 ? "text-emerald-500" : percentage >= 40 ? "text-amber-500" : "text-red-500"}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-bold tabular-nums">{percentage.toFixed(0)}%</span>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-2xl font-bold tabular-nums">{attemptWithDetails.score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">of {test.totalMarks} marks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-semibold tabular-nums text-emerald-600">{attemptWithDetails.correct}</p>
          <p className="text-[10px] text-muted-foreground">Correct</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-semibold tabular-nums text-red-600">{attemptWithDetails.incorrect}</p>
          <p className="text-[10px] text-muted-foreground">Incorrect</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-semibold tabular-nums text-muted-foreground">{attemptWithDetails.unanswered}</p>
          <p className="text-[10px] text-muted-foreground">Skipped</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-semibold tabular-nums">{totalQuestions}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="summary" className="flex-1 sm:flex-none">Summary</TabsTrigger>
          <TabsTrigger value="review" className="flex-1 sm:flex-none">Review</TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {/* Subject Performance */}
          {attemptBreakdown && attemptBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Subject Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {attemptBreakdown.map((item) => {
                  const accuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
                  return (
                    <div key={item.subject} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.subject}</span>
                        <span className="tabular-nums font-medium">
                          {item.correct}/{item.total}
                          <span className="ml-2 text-muted-foreground">({accuracy}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            accuracy >= 70 ? "bg-emerald-500" : accuracy >= 40 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Your Rank */}
          {userRank && userRank.rank && (
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                  userRank.rank === 1
                    ? "bg-amber-500/10 text-amber-600"
                    : userRank.rank === 2
                      ? "bg-slate-400/10 text-slate-500"
                      : userRank.rank === 3
                        ? "bg-orange-500/10 text-orange-600"
                        : "bg-muted text-muted-foreground"
                }`}>
                  #{userRank.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Your Ranking</p>
                  <p className="text-xs text-muted-foreground">
                    Out of {userRank.totalParticipants} participant{userRank.totalParticipants !== 1 && "s"}
                  </p>
                </div>
                {userRank.rank <= 3 && (
                  <Trophy className={`h-5 w-5 ${
                    userRank.rank === 1
                      ? "text-amber-500"
                      : userRank.rank === 2
                        ? "text-slate-400"
                        : "text-orange-500"
                  }`} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Answer Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Answer Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                {attemptWithDetails.correct > 0 && (
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${(attemptWithDetails.correct / totalQuestions) * 100}%` }}
                  />
                )}
                {attemptWithDetails.incorrect > 0 && (
                  <div
                    className="bg-red-500"
                    style={{ width: `${(attemptWithDetails.incorrect / totalQuestions) * 100}%` }}
                  />
                )}
                {attemptWithDetails.unanswered > 0 && (
                  <div
                    className="bg-muted-foreground/30"
                    style={{ width: `${(attemptWithDetails.unanswered / totalQuestions) * 100}%` }}
                  />
                )}
              </div>
              <div className="mt-3 flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Correct ({attemptWithDetails.correct})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Incorrect ({attemptWithDetails.incorrect})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="text-muted-foreground">Skipped ({attemptWithDetails.unanswered})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-4">
          {/* Filter Dropdown */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredQuestions.length} of {totalQuestions} questions
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <ListFilter className="h-3.5 w-3.5" />
                  {filterLabels[filter]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  All Questions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("correct")}>
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                  Correct
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("incorrect")}>
                  <XCircle className="mr-2 h-3.5 w-3.5 text-red-500" />
                  Incorrect
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("skipped")}>
                  <MinusCircle className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Skipped
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Questions Accordion */}
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {filteredQuestions.map((question, index) => {
                  if (!question) return null;
                  const answer = answers.find((a) => a.questionId === question._id);
                  const selectedOptions = answer?.selected || [];
                  const isCorrect =
                    selectedOptions.length === question.correctOptions.length &&
                    selectedOptions.every((s) => question.correctOptions.includes(s));
                  const isSkipped = selectedOptions.length === 0;
                  const questionIndex = questions.findIndex(q => q?._id === question._id);

                  return (
                    <AccordionItem key={question._id} value={question._id} className="border-b last:border-b-0">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium ${
                            isCorrect
                              ? "bg-emerald-500/10 text-emerald-600"
                              : isSkipped
                                ? "bg-muted text-muted-foreground"
                                : "bg-red-500/10 text-red-600"
                          }`}>
                            {questionIndex + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : isSkipped ? (
                              <MinusCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                            )}
                            <span className="line-clamp-1 text-sm">{question.text}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4">
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {question.subject}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {isCorrect ? "Answered correctly" : isSkipped ? "Not answered" : "Answered incorrectly"}
                            </span>
                          </div>

                          <p className="text-sm">{question.text}</p>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {question.options.map((option, optIndex) => {
                              const isSelected = selectedOptions.includes(optIndex);
                              const isCorrectOption = question.correctOptions.includes(optIndex);

                              return (
                                <div
                                  key={optIndex}
                                  className={`rounded-lg border p-3 text-sm ${
                                    isCorrectOption
                                      ? "border-emerald-500/50 bg-emerald-500/5"
                                      : isSelected && !isCorrectOption
                                        ? "border-red-500/50 bg-red-500/5"
                                        : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-medium ${
                                      isCorrectOption
                                        ? "bg-emerald-500 text-white"
                                        : isSelected
                                          ? "bg-red-500 text-white"
                                          : "bg-muted"
                                    }`}>
                                      {String.fromCharCode(65 + optIndex)}
                                    </span>
                                    <span>{option}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {question.explanation && (
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="mb-1 text-xs font-medium text-muted-foreground">Explanation</p>
                              <p className="text-sm">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {filteredQuestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Filter className="mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No questions match this filter
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Test Leaderboard</CardTitle>
              <CardDescription className="text-xs">Top performers on this test</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {leaderboard && leaderboard.length > 0 ? (
                <div className="overflow-x-auto border-t">
                  <LeaderboardTable
                    entries={leaderboard.map((entry) => ({
                      ...entry,
                      isCurrentUser: entry.userId === dbUser?._id,
                    })) as LeaderboardEntry[]}
                    variant="test"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {leaderboard ? "No entries yet" : "Loading..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
