"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
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
  formatDate,
} from "@repo/ui";
import { ArrowLeft, FileQuestion, Clock, Trophy, Users } from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database";

type TestId = Id<"tests">;

export default function TestDetailPage() {
  const params = useParams();
  const testId = params.id as string;

  const testWithQuestions = useQuery(api.tests.getWithQuestions, {
    id: testId as TestId,
  });
  const testAnalytics = useQuery(api.analytics.getTestAnalytics, {
    testId: testId as TestId,
  });
  const leaderboard = useQuery(api.analytics.getLeaderboard, {
    testId: testId as TestId,
  });

  if (!testWithQuestions) {
    return (
      <div className="p-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
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
    <div className="p-8">
      <Link href="/tests">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{testWithQuestions.title}</h1>
          {getStatusBadge(testWithQuestions.status)}
        </div>
        <p className="text-muted-foreground">{testWithQuestions.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <FileQuestion className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {testWithQuestions.questions.length}
              </p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{testWithQuestions.duration}</p>
              <p className="text-sm text-muted-foreground">Minutes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{testWithQuestions.totalMarks}</p>
              <p className="text-sm text-muted-foreground">Total Marks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {testAnalytics?.totalAttempts || 0}
              </p>
              <p className="text-sm text-muted-foreground">Attempts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Test Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testWithQuestions.questionDetails.map((question, index) => (
                  <div key={question._id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
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
                    <p className="mb-3 font-medium">{question.text}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`rounded-md border p-2 text-sm ${
                            question.correctOptions.includes(optIndex)
                              ? "border-success bg-success/10"
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
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Attempts</span>
                  <span className="font-medium">
                    {testAnalytics?.totalAttempts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-medium">
                    {testAnalytics?.averageScore.toFixed(1) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Highest Score</span>
                  <span className="font-medium text-success">
                    {testAnalytics?.highestScore || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lowest Score</span>
                  <span className="font-medium text-destructive">
                    {testAnalytics?.lowestScore || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {testAnalytics?.scoreDistribution.map((item) => (
                  <div key={item.range} className="mb-2 flex items-center gap-2">
                    <span className="w-20 text-sm text-muted-foreground">
                      {item.range}
                    </span>
                    <div className="flex-1 rounded-full bg-muted">
                      <div
                        className="h-4 rounded-full bg-primary"
                        style={{
                          width: `${
                            testAnalytics.totalAttempts > 0
                              ? (item.count / testAnalytics.totalAttempts) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium">
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
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {!leaderboard || leaderboard.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No attempts yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Correct</TableHead>
                      <TableHead>Time Taken</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry) => (
                      <TableRow key={entry.userId}>
                        <TableCell>
                          <Badge
                            variant={
                              entry.rank === 1
                                ? "default"
                                : entry.rank === 2
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            #{entry.rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.userName}
                        </TableCell>
                        <TableCell>{entry.score.toFixed(1)}</TableCell>
                        <TableCell>{entry.correct}</TableCell>
                        <TableCell>
                          {Math.floor(entry.timeTaken / 60000)}m{" "}
                          {Math.floor((entry.timeTaken % 60000) / 1000)}s
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
