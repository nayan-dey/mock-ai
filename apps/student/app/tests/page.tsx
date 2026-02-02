"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useCurrentUser } from "@/hooks/use-current-user";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@repo/ui";
import { FileQuestion, Zap, ArrowUpDown, SortAsc, SortDesc, LayoutGrid, LayoutList, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

type SortOption = "default" | "duration-asc" | "duration-desc" | "questions-asc" | "questions-desc";
type ViewMode = "grid" | "list";

export default function TestsPage() {
  const { dbUser } = useCurrentUser();
  const tests = useQuery(
    api.tests.listPublishedForBatch,
    dbUser ? { batchId: dbUser.batchId } : "skip"
  );
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const sortedTests = useMemo(() => {
    if (!tests) return [];

    const sorted = [...tests];
    switch (sortBy) {
      case "duration-asc":
        return sorted.sort((a, b) => a.duration - b.duration);
      case "duration-desc":
        return sorted.sort((a, b) => b.duration - a.duration);
      case "questions-asc":
        return sorted.sort((a, b) => a.questions.length - b.questions.length);
      case "questions-desc":
        return sorted.sort((a, b) => b.questions.length - a.questions.length);
      default:
        return sorted;
    }
  }, [tests, sortBy]);

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
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Available Tests</h1>
          <p className="text-sm text-muted-foreground">
            {tests.length} test{tests.length !== 1 && "s"} available
          </p>
        </div>

        {/* Controls */}
        {tests.length > 0 && (
          <div className="flex items-center gap-1">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            {tests.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("default")}>
                    Default
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("duration-asc")}>
                    <SortAsc className="mr-2 h-3.5 w-3.5" />
                    Duration (Low to High)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("duration-desc")}>
                    <SortDesc className="mr-2 h-3.5 w-3.5" />
                    Duration (High to Low)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("questions-asc")}>
                    <SortAsc className="mr-2 h-3.5 w-3.5" />
                    Questions (Few to Many)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("questions-desc")}>
                    <SortDesc className="mr-2 h-3.5 w-3.5" />
                    Questions (Many to Few)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
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
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTests.map((test) => (
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
      ) : (
        /* List View */
        <div className="space-y-2">
          {sortedTests.map((test) => (
            <Link key={test._id} href={`/tests/${test._id}`}>
              <Card className="transition-colors hover:bg-muted/50 my-3">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{test.title}</h3>
                      {test.negativeMarking > 0 && (
                        <Zap className="h-3 w-3 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{test.questions.length} questions</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {test.duration} min
                      </span>
                      <span>{test.totalMarks} marks</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
