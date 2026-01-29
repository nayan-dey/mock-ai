"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type QuestionStatus = "not-visited" | "not-answered" | "answered" | "marked" | "answered-marked" | "current";

interface TestNavigationProps {
  totalQuestions: number;
  currentQuestion: number;
  questionStatuses: QuestionStatus[];
  onQuestionSelect: (index: number) => void;
  className?: string;
}

export function TestNavigation({
  totalQuestions,
  currentQuestion,
  questionStatuses,
  onQuestionSelect,
  className,
}: TestNavigationProps) {
  const getStatusStyles = (status: QuestionStatus, isCurrent: boolean) => {
    const baseStyles = "rounded-lg border font-medium transition-all text-sm flex items-center justify-center";

    if (isCurrent) {
      return cn(baseStyles, "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2");
    }

    switch (status) {
      case "answered":
        return cn(baseStyles, "border-success bg-success/10 text-success hover:bg-success/20");
      case "not-answered":
        return cn(baseStyles, "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20");
      case "marked":
        return cn(baseStyles, "border-violet-500 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20");
      case "answered-marked":
        return cn(baseStyles, "border-success bg-success/10 text-success hover:bg-success/20 relative overflow-hidden");
      case "not-visited":
      default:
        return cn(baseStyles, "border-border bg-background text-muted-foreground hover:bg-muted");
    }
  };

  const statusCounts = React.useMemo(() => {
    return questionStatuses.reduce(
      (acc, status) => {
        if (status === "current") {
          // Current question: check if it has been answered or not for counting
          return acc;
        }
        acc[status]++;
        return acc;
      },
      { "answered": 0, "not-answered": 0, "marked": 0, "not-visited": 0, "answered-marked": 0, "current": 0 }
    );
  }, [questionStatuses]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 rounded-md bg-success/10 px-2.5 py-1.5">
          <div className="h-3 w-3 shrink-0 rounded-sm bg-success" />
          <span>Answered: {statusCounts.answered}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5">
          <div className="h-3 w-3 shrink-0 rounded-sm bg-destructive" />
          <span>Not Answered: {statusCounts["not-answered"]}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-violet-500/10 px-2.5 py-1.5">
          <div className="h-3 w-3 shrink-0 rounded-sm bg-violet-500" />
          <span>Marked: {statusCounts.marked}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5">
          <div className="h-3 w-3 shrink-0 rounded-sm border-2 border-muted-foreground" />
          <span>Not Visited: {statusCounts["not-visited"]}</span>
        </div>
        <div className="col-span-2 flex items-center gap-2 rounded-md bg-success/10 px-2.5 py-1.5">
          <div className="relative h-3 w-3 shrink-0 overflow-hidden rounded-sm bg-success">
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rotate-45 bg-violet-500" />
          </div>
          <span>Answered & Marked: {statusCounts["answered-marked"]}</span>
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))' }}>
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isCurrent = index === currentQuestion;
          const status = questionStatuses[index] || "not-visited";

          return (
            <button
              key={index}
              onClick={() => onQuestionSelect(index)}
              className={cn(getStatusStyles(status, isCurrent), "min-w-[40px] aspect-square")}
            >
              {status === "answered-marked" && !isCurrent && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rotate-45 bg-violet-500" />
              )}
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
