"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
} from "@repo/ui";
import { Clock, FileQuestion, Trophy, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default function TestsPage() {
  const tests = useQuery(api.tests.listPublished);

  if (!tests) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Available Tests</h1>
        <p className="text-sm text-muted-foreground">
          Choose a test and start your preparation
        </p>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <FileQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No tests available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New tests are being prepared. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test._id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{test.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {test.status}
                  </Badge>
                </div>
                {test.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {test.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-1 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">{test.questions.length}</p>
                    <p className="text-[10px] text-muted-foreground">Questions</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">{test.duration}</p>
                    <p className="text-[10px] text-muted-foreground">Minutes</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">{test.totalMarks}</p>
                    <p className="text-[10px] text-muted-foreground">Marks</p>
                  </div>
                </div>

                {test.negativeMarking > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span>-{test.negativeMarking} per wrong answer</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <Link href={`/tests/${test._id}`} className="w-full">
                  <Button className="w-full">
                    Start Test
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
