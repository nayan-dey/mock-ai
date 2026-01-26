"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type QuestionStatus = "unanswered" | "answered" | "marked" | "current";

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
      case "marked":
        return cn(baseStyles, "border-warning bg-warning/10 text-warning hover:bg-warning/20");
      case "unanswered":
      default:
        return cn(baseStyles, "border-border bg-background text-muted-foreground hover:bg-muted");
    }
  };

  const statusCounts = React.useMemo(() => {
    return questionStatuses.reduce(
      (acc, status) => {
        acc[status]++;
        return acc;
      },
      { answered: 0, unanswered: 0, marked: 0, current: 0 }
    );
  }, [questionStatuses]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-1.5 text-sm">
          <div className="h-3 w-3 rounded-sm bg-success" />
          <span>Answered: {statusCounts.answered}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-warning/10 px-3 py-1.5 text-sm">
          <div className="h-3 w-3 rounded-sm bg-warning" />
          <span>Marked: {statusCounts.marked}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm">
          <div className="h-3 w-3 rounded-sm border-2 border-muted-foreground" />
          <span>Unanswered: {statusCounts.unanswered}</span>
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))' }}>
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isCurrent = index === currentQuestion;
          const status = questionStatuses[index] || "unanswered";

          return (
            <button
              key={index}
              onClick={() => onQuestionSelect(index)}
              className={cn(getStatusStyles(status, isCurrent), "min-w-[40px] aspect-square")}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
