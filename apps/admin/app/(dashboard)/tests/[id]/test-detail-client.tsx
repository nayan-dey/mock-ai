"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
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
} from "@repo/ui";
import { ArrowLeft, FileQuestion, Clock, Trophy, Users } from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database/dataModel";

interface TestDetailClientProps {
  testId: string;
}

export function TestDetailClient({ testId }: TestDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "questions";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "questions") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const testWithQuestions = useQuery(api.tests.getWithQuestions, { id: testId as Id<"tests"> });
  const testAnalytics = useQuery(api.analytics.getTestAnalytics, { testId: testId as Id<"tests"> });
  const leaderboard = useQuery(api.analytics.getLeaderboard, { testId: testId as Id<"tests"> });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <Link href="/tests">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </Button>
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{testWithQuestions.title}</h1>
          {getStatusBadge(testWithQuestions.status)}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{testWithQuestions.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {testWithQuestions.questions.length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileQuestion className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-2xl font-semibold tabular-nums">{testWithQuestions.duration} min</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-semibold tabular-nums">{testWithQuestions.totalMarks}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Attempts</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {testAnalytics?.totalAttempts || 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="questions" className="flex-1 sm:flex-none">Questions</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 sm:flex-none">Analytics</TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none">Leaderboard</TabsTrigger>
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
                  <div key={question._id} className="rounded-lg border p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
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
                    <p className="mb-3 text-sm font-medium">{question.text}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optIndex) => (
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
                  </div>
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
                {testAnalytics?.scoreDistribution.map((item) => (
                  <div key={item.range} className="mb-2 flex items-center gap-2">
                    <span className="w-16 text-xs text-muted-foreground">
                      {item.range}
                    </span>
                    <div className="flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${
                            testAnalytics.totalAttempts > 0
                              ? (item.count / testAnalytics.totalAttempts) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-medium tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))}
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
      </Tabs>
    </div>
  );
}
