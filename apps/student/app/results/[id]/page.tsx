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
  QuestionCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ChartContainer,
  PieChart,
  RadarChart,
  LeaderboardTable,
  Badge,
  type LeaderboardEntry,
} from "@repo/ui";
import { ArrowLeft, Trophy, Users, CheckCircle2, XCircle, Clock, Target } from "lucide-react";
import Link from "next/link";
import type { GenericId } from "convex/values";

type Id<T extends string> = GenericId<T>;

type AttemptId = Id<"attempts">;

export default function ResultDetailPage() {
  const params = useParams();
  const attemptId = params.id as string;
  const { user } = useUser();

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

  if (!attemptWithDetails) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="mb-2 h-10 w-64" />
        <Skeleton className="mb-8 h-5 w-48" />
        <Skeleton className="mb-6 h-12 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header Section */}
      <div className="mb-8">
        <Link href="/results">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Button>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {test.title}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Test completed successfully
        </p>
      </div>

      {/* Tabs - Native shadcn style */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="summary"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Review
          </TabsTrigger>
          <TabsTrigger
            value="leaderboard"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold sm:text-3xl">
                    {attemptWithDetails.score.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 sm:text-3xl">
                    {attemptWithDetails.correct}
                  </p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-red-500/5 to-red-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600 sm:text-3xl">
                    {attemptWithDetails.incorrect}
                  </p>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold sm:text-3xl">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </p>
                  <p className="text-xs text-muted-foreground">Time Taken</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accuracy Card */}
          <Card className="border-0 bg-gradient-to-br from-purple-500/5 to-purple-500/10 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4 sm:p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
                <Target className="h-7 w-7 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                <p className="text-3xl font-bold sm:text-4xl">
                  {percentage.toFixed(0)}%
                </p>
              </div>
              <Badge
                variant={percentage >= 60 ? "success" : percentage >= 40 ? "secondary" : "destructive"}
                className="px-3 py-1.5"
              >
                {percentage >= 60 ? "Passed" : percentage >= 40 ? "Average" : "Needs Improvement"}
              </Badge>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Answer Distribution Pie Chart */}
            <ChartContainer
              title="Answer Distribution"
              description="Breakdown of your responses"
            >
              <div className="flex h-[200px] items-center justify-center">
                <PieChart
                  data={[
                    {
                      name: "Correct",
                      value: attemptWithDetails.correct,
                      color: "hsl(var(--success))",
                    },
                    {
                      name: "Incorrect",
                      value: attemptWithDetails.incorrect,
                      color: "hsl(var(--destructive))",
                    },
                    {
                      name: "Unanswered",
                      value: attemptWithDetails.unanswered,
                      color: "hsl(var(--muted-foreground))",
                    },
                  ].filter((d) => d.value > 0)}
                  height={200}
                />
              </div>
            </ChartContainer>

            {/* Subject-wise Radar Chart */}
            {attemptBreakdown && attemptBreakdown.length > 0 && (
              <ChartContainer
                title="Subject Performance"
                description="Accuracy by subject"
              >
                <div className="h-[200px]">
                  <RadarChart
                    data={attemptBreakdown.map((item) => ({
                      subject: item.subject,
                      value: item.total > 0
                        ? Math.round((item.correct / item.total) * 100)
                        : 0,
                      fullMark: 100,
                    }))}
                    height={200}
                    color="hsl(var(--primary))"
                    fillOpacity={0.25}
                    legendLabel="Accuracy %"
                  />
                </div>
              </ChartContainer>
            )}
          </div>

          {/* Your Rank Card */}
          {userRank && userRank.rank && (
            <Card className="border-0 bg-gradient-to-r from-yellow-500/5 via-yellow-500/10 to-orange-500/5 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4 sm:gap-6 sm:p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 sm:h-16 sm:w-16">
                  <Trophy className="h-7 w-7 text-yellow-600 sm:h-8 sm:w-8" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Your Ranking</p>
                  <p className="text-3xl font-bold sm:text-4xl">
                    #{userRank.rank}
                    <span className="ml-2 text-base font-normal text-muted-foreground">
                      of {userRank.totalParticipants}
                    </span>
                  </p>
                </div>
                {userRank.rank <= 3 && (
                  <Badge variant="outline" className="bg-background px-3 py-1.5">
                    {userRank.rank === 1 ? "Gold" : userRank.rank === 2 ? "Silver" : "Bronze"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Answer Review</CardTitle>
                  <CardDescription>
                    Review all {questions.length} questions with explanations
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {attemptWithDetails.correct}/{questions.length} correct
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {questions.filter(Boolean).map((question, index) => {
                if (!question) return null;
                const answer = answers.find((a) => a.questionId === question._id);
                const selectedOptions = answer?.selected || [];
                const isCorrect =
                  selectedOptions.length === question.correctOptions.length &&
                  selectedOptions.every((s) => question.correctOptions.includes(s));

                return (
                  <div key={question._id} className="p-4 sm:p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                        isCorrect
                          ? "bg-success/10 text-success"
                          : selectedOptions.length === 0
                          ? "bg-muted text-muted-foreground"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {index + 1}
                      </span>
                      <Badge variant={isCorrect ? "success" : selectedOptions.length === 0 ? "secondary" : "destructive"}>
                        {isCorrect ? "Correct" : selectedOptions.length === 0 ? "Skipped" : "Incorrect"}
                      </Badge>
                    </div>

                    <QuestionCard
                      questionNumber={index + 1}
                      text={question.text}
                      options={question.options}
                      selectedOptions={selectedOptions}
                      correctOptions={question.correctOptions}
                      showAnswer={true}
                      isMultipleCorrect={question.correctOptions.length > 1}
                      onSelect={() => {}}
                    />

                    {question.explanation && (
                      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                          Explanation
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Test Leaderboard</CardTitle>
              <CardDescription>Top performers on this test</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {leaderboard ? (
                <div className="overflow-x-auto">
                  <LeaderboardTable
                    entries={leaderboard.map((entry) => ({
                      ...entry,
                      isCurrentUser: entry.userId === dbUser?._id,
                    })) as LeaderboardEntry[]}
                    variant="test"
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 h-8 w-8 opacity-50" />
                  <p>Loading leaderboard...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
