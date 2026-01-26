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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-2 bg-muted" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Available Tests</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Choose a test and start your preparation
        </p>
      </div>

      {tests.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Tests Available</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              New tests are being prepared. Check back soon for fresh content!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test, index) => (
            <Card
              key={test._id}
              className="group flex flex-col overflow-hidden border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-primary/60 to-primary" />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{test.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                    {test.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-sm">
                  {test.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background">
                      <FileQuestion className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-serif text-lg font-bold">{test.questions.length}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Questions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-serif text-lg font-bold">{test.duration}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Minutes</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{test.totalMarks} Marks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <Zap className="h-3 w-3" />
                    <span>-{test.negativeMarking} per wrong</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t bg-muted/30 p-4">
                <Link href={`/tests/${test._id}`} className="w-full">
                  <Button className="w-full gap-2 transition-all group-hover:gap-3">
                    Start Test
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
