"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./card";
import { Progress } from "./progress";
import { Badge } from "./badge";
import { CheckCircle2, XCircle, MinusCircle, Trophy, Target, Clock, Award, Zap } from "lucide-react";

interface TestResultProps {
  score: number;
  totalMarks: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  totalQuestions: number;
  timeTaken?: number; // in milliseconds
  className?: string;
}

export function TestResult({
  score,
  totalMarks,
  correct,
  incorrect,
  unanswered,
  totalQuestions,
  timeTaken,
  className,
}: TestResultProps) {
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  const accuracy = totalQuestions > 0 ? (correct / (correct + incorrect)) * 100 : 0;

  const getGrade = () => {
    if (percentage >= 90) return { grade: "A+", color: "text-success", bg: "from-success/5 to-success/10", border: "border-success/20" };
    if (percentage >= 80) return { grade: "A", color: "text-success", bg: "from-success/5 to-success/10", border: "border-success/20" };
    if (percentage >= 70) return { grade: "B+", color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" };
    if (percentage >= 60) return { grade: "B", color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" };
    if (percentage >= 50) return { grade: "C", color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20" };
    if (percentage >= 40) return { grade: "D", color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20" };
    return { grade: "F", color: "text-destructive", bg: "from-destructive/5 to-destructive/10", border: "border-destructive/20" };
  };

  const { grade, color, bg, border } = getGrade();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Score Card */}
      <Card className={cn("overflow-hidden border-2", border)}>
        <div className={cn("bg-gradient-to-br", bg)}>
          <div className="px-6 py-10 text-center sm:px-8 sm:py-12">
            {/* Trophy Icon */}
            <div className={cn(
              "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl",
              "bg-background shadow-lg shadow-black/5 sm:h-24 sm:w-24"
            )}>
              <Trophy className={cn("h-10 w-10 sm:h-12 sm:w-12", color)} />
            </div>

            {/* Score Display */}
            <div className="mb-4">
              <span className={cn("font-serif text-6xl font-bold tracking-tight sm:text-7xl", color)}>
                {score.toFixed(1)}
              </span>
              <span className="text-3xl text-muted-foreground sm:text-4xl">
                /{totalMarks}
              </span>
            </div>

            {/* Grade Badge */}
            <Badge
              variant={percentage >= 50 ? "success" : "destructive"}
              className="px-5 py-1.5 text-sm font-semibold"
            >
              <Award className="mr-2 h-4 w-4" />
              Grade: {grade}
            </Badge>

            {/* Progress Bar */}
            <div className="mx-auto mt-8 max-w-sm">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Score Progress</span>
                <span className="font-semibold">{percentage.toFixed(1)}%</span>
              </div>
              <Progress value={percentage} className="h-2.5" />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Correct */}
        <Card className="group overflow-hidden border-2 border-transparent transition-all hover:border-success/30 hover:shadow-md hover:shadow-success/5">
          <CardContent className="p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 transition-colors group-hover:bg-success/15">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <p className="font-serif text-3xl font-bold text-success">{correct}</p>
            <p className="mt-1 text-xs text-muted-foreground">Correct Answers</p>
          </CardContent>
        </Card>

        {/* Incorrect */}
        <Card className="group overflow-hidden border-2 border-transparent transition-all hover:border-destructive/30 hover:shadow-md hover:shadow-destructive/5">
          <CardContent className="p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 transition-colors group-hover:bg-destructive/15">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <p className="font-serif text-3xl font-bold text-destructive">{incorrect}</p>
            <p className="mt-1 text-xs text-muted-foreground">Incorrect Answers</p>
          </CardContent>
        </Card>

        {/* Unanswered */}
        <Card className="group overflow-hidden border-2 border-transparent transition-all hover:border-muted-foreground/20 hover:shadow-md">
          <CardContent className="p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-muted/80">
              <MinusCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-serif text-3xl font-bold">{unanswered}</p>
            <p className="mt-1 text-xs text-muted-foreground">Unanswered</p>
          </CardContent>
        </Card>

        {/* Accuracy */}
        <Card className="group overflow-hidden border-2 border-transparent transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
          <CardContent className="p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <p className="font-serif text-3xl font-bold text-primary">
              {isNaN(accuracy) ? "0" : accuracy.toFixed(0)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Accuracy Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Taken */}
      {timeTaken && (
        <Card className="border-2 border-transparent">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Time Taken</p>
                <p className="text-xs text-muted-foreground">Total duration</p>
              </div>
            </div>
            <span className="font-serif text-2xl font-bold">{formatTime(timeTaken)}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
