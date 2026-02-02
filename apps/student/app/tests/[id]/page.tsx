"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  QuestionCard,
  TestTimer,
  TestNavigation,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  cn,
  BackButton,
  type QuestionStatus,
} from "@repo/ui";
import { Clock, ClipboardList, Trophy, AlertTriangle, ArrowLeft, ArrowRight, Play, RotateCcw, CheckCircle, List, X, Flag, Brain, Info } from "lucide-react";
import type { Id } from "@repo/database/dataModel";

type TestId = Id<"tests">;
type QuestionId = Id<"questions">;
type AttemptId = Id<"attempts">;

const EMPTY_OPTIONS: number[] = [];

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const { dbUser } = useCurrentUser();
  const testId = params.id as string;
  const testWithQuestions = useQuery(api.tests.getWithQuestions, {
    id: testId as TestId,
  });
  const existingAttempt = useQuery(
    api.attempts.getByUserAndTest,
    dbUser?._id
      ? { userId: dbUser._id, testId: testId as TestId }
      : "skip"
  );

  const startAttempt = useMutation(api.attempts.start);
  const saveAnswer = useMutation(api.attempts.saveAnswer);
  const submitAttempt = useMutation(api.attempts.submit);

  const [attemptId, setAttemptId] = useState<AttemptId | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number[]>>(new Map());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [showInstructions, setShowInstructions] = useState(false);
  const [questionOrder, setQuestionOrder] = useState<Id<"questions">[] | null>(null);

  // Swipe navigation refs — direct DOM manipulation during drag for zero re-renders
  const questionAreaRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ startX: number; startY: number; locked: boolean | null } | null>(null);
  const isAnimatingRef = useRef(false);

  // Reorder questions based on the attempt's randomized questionOrder
  const orderedQuestionDetails = useMemo(() => {
    if (!testWithQuestions) return [];
    if (!questionOrder || !isStarted) return testWithQuestions.questionDetails;
    const detailsMap = new Map(
      testWithQuestions.questionDetails.map((q) => [q._id, q])
    );
    const ordered = questionOrder
      .map((id) => detailsMap.get(id))
      .filter((q): q is NonNullable<typeof q> => q != null);
    // Fallback: if questionOrder doesn't match (old attempt without it), use original order
    return ordered.length > 0 ? ordered : testWithQuestions.questionDetails;
  }, [testWithQuestions, questionOrder, isStarted]);

  const totalQuestions = testWithQuestions?.questionDetails.length ?? 0;

  // Animated navigation: slides current question out, switches, slides new one in
  const navigateToQuestion = useCallback((newIndex: number, direction?: "left" | "right") => {
    const el = questionAreaRef.current;
    if (!el || isAnimatingRef.current || newIndex === currentQuestion) return;
    if (newIndex < 0 || newIndex >= totalQuestions) return;

    isAnimatingRef.current = true;
    const dir = direction ?? (newIndex > currentQuestion ? "left" : "right");
    const sign = dir === "left" ? -1 : 1;

    // Slide out
    el.style.transition = "transform 0.2s ease-out, opacity 0.15s ease-out";
    el.style.transform = `translateX(${sign * 80}px)`;
    el.style.opacity = "0";

    setTimeout(() => {
      // Instantly reposition off-screen on the opposite side
      el.style.transition = "none";
      el.style.transform = `translateX(${-sign * 80}px)`;
      setCurrentQuestion(newIndex);

      // Double rAF ensures browser paints the repositioned element before animating in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = "transform 0.25s ease-out, opacity 0.2s ease-out";
          el.style.transform = "translateX(0)";
          el.style.opacity = "1";
          setTimeout(() => { isAnimatingRef.current = false; }, 250);
        });
      });
    }, 200);
  }, [currentQuestion, totalQuestions]);

  // Touch handlers — direct DOM for max perf during drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimatingRef.current) return;
    touchRef.current = {
      startX: e.touches[0]!.clientX,
      startY: e.touches[0]!.clientY,
      locked: null,
    };
    const el = questionAreaRef.current;
    if (el) {
      el.style.transition = "none";
      el.style.willChange = "transform";
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = touchRef.current;
    const el = questionAreaRef.current;
    if (!touch || !el) return;

    const dx = e.touches[0]!.clientX - touch.startX;
    const dy = e.touches[0]!.clientY - touch.startY;

    // Decide direction lock on first significant movement
    if (touch.locked === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        touch.locked = Math.abs(dx) > Math.abs(dy); // true = horizontal swipe
      }
      return;
    }

    if (!touch.locked) return; // vertical scroll, don't interfere

    // Prevent vertical scroll while swiping horizontally
    e.preventDefault();

    // Apply resistance at boundaries (first/last question)
    let offset = dx;
    if ((currentQuestion === 0 && dx > 0) || (currentQuestion === totalQuestions - 1 && dx < 0)) {
      offset = dx * 0.15;
    }

    el.style.transform = `translateX(${offset}px)`;
    // Fade proportional to swipe distance
    el.style.opacity = String(Math.max(0.3, 1 - Math.abs(dx) / 400));
  }, [currentQuestion, totalQuestions]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = touchRef.current;
    const el = questionAreaRef.current;
    touchRef.current = null;

    if (!touch || !el || touch.locked !== true) {
      if (el) el.style.willChange = "";
      return;
    }

    const dx = e.changedTouches[0]!.clientX - touch.startX;
    const threshold = 60;

    if (dx < -threshold && currentQuestion < totalQuestions - 1) {
      // Swipe left → next question
      isAnimatingRef.current = true;
      el.style.transition = "transform 0.15s ease-out, opacity 0.15s ease-out";
      el.style.transform = `translateX(${-window.innerWidth * 0.4}px)`;
      el.style.opacity = "0";

      setTimeout(() => {
        el.style.transition = "none";
        el.style.transform = `translateX(${window.innerWidth * 0.3}px)`;
        setCurrentQuestion((p) => p + 1);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = "transform 0.25s ease-out, opacity 0.2s ease-out";
            el.style.transform = "translateX(0)";
            el.style.opacity = "1";
            el.style.willChange = "";
            setTimeout(() => { isAnimatingRef.current = false; }, 250);
          });
        });
      }, 150);
    } else if (dx > threshold && currentQuestion > 0) {
      // Swipe right → previous question
      isAnimatingRef.current = true;
      el.style.transition = "transform 0.15s ease-out, opacity 0.15s ease-out";
      el.style.transform = `translateX(${window.innerWidth * 0.4}px)`;
      el.style.opacity = "0";

      setTimeout(() => {
        el.style.transition = "none";
        el.style.transform = `translateX(${-window.innerWidth * 0.3}px)`;
        setCurrentQuestion((p) => p - 1);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = "transform 0.25s ease-out, opacity 0.2s ease-out";
            el.style.transform = "translateX(0)";
            el.style.opacity = "1";
            el.style.willChange = "";
            setTimeout(() => { isAnimatingRef.current = false; }, 250);
          });
        });
      }, 150);
    } else {
      // Snap back
      el.style.transition = "transform 0.2s ease-out, opacity 0.15s ease-out";
      el.style.transform = "translateX(0)";
      el.style.opacity = "1";
      el.style.willChange = "";
    }
  }, [currentQuestion, totalQuestions]);

  useEffect(() => {
    if (isStarted && attemptId) {
      localStorage.setItem(`test-${testId}-currentQuestion`, currentQuestion.toString());
    }
  }, [currentQuestion, isStarted, attemptId, testId]);

  // Track visited questions
  useEffect(() => {
    if (isStarted && testWithQuestions) {
      const q = orderedQuestionDetails[currentQuestion];
      if (q) {
        setVisitedQuestions((prev) => {
          if (prev.has(q._id)) return prev;
          const next = new Set(prev);
          next.add(q._id);
          return next;
        });
      }
    }
  }, [currentQuestion, isStarted, testWithQuestions]);

  const handleStartTest = async (forceNew: boolean = false) => {
    if (!dbUser) return;
    setIsLoading(true);
    try {
      if (forceNew) {
        localStorage.removeItem(`test-${testId}-currentQuestion`);
      }
      const id = await startAttempt({
        testId: testId as TestId,
        forceNew,
      });
      setAttemptId(id);
      setStartTime(Date.now());
      setCurrentQuestion(0);
      setAnswers(new Map());
      setMarkedForReview(new Set());
      setQuestionOrder(null); // Will be picked up from existingAttempt via effect
      setIsStarted(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync questionOrder from existingAttempt when it becomes available after starting
  useEffect(() => {
    if (isStarted && existingAttempt?.questionOrder && !questionOrder) {
      setQuestionOrder(existingAttempt.questionOrder as Id<"questions">[]);
    }
  }, [isStarted, existingAttempt, questionOrder]);

  const handleResumeTest = () => {
    if (!existingAttempt || existingAttempt.status !== "in_progress") return;

    setAttemptId(existingAttempt._id);
    setStartTime(existingAttempt.startedAt);
    if (existingAttempt.questionOrder) {
      setQuestionOrder(existingAttempt.questionOrder as Id<"questions">[]);
    }
    const answersMap = new Map<string, number[]>();
    existingAttempt.answers.forEach((a) => {
      answersMap.set(a.questionId, a.selected);
    });
    setAnswers(answersMap);

    const savedQuestion = localStorage.getItem(`test-${testId}-currentQuestion`);
    if (savedQuestion !== null) {
      const questionIndex = parseInt(savedQuestion, 10);
      if (!isNaN(questionIndex) && questionIndex >= 0) {
        setCurrentQuestion(questionIndex);
      }
    }
    setIsStarted(true);
  };

  const handleSelectAnswer = async (selected: number[]) => {
    if (!attemptId || !testWithQuestions) return;
    const question = orderedQuestionDetails[currentQuestion];
    if (!question) return;

    setAnswers((prev) => new Map(prev).set(question._id, selected));

    await saveAnswer({
      attemptId,
      questionId: question._id as QuestionId,
      selected,
    });
  };

  const handleMarkForReview = () => {
    if (!testWithQuestions) return;
    const question = orderedQuestionDetails[currentQuestion];
    if (!question) return;

    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(question._id)) {
        next.delete(question._id);
      } else {
        next.add(question._id);
      }
      return next;
    });
  };

  const answeredCount = useMemo(() => [...answers.values()].filter((a) => a.length > 0).length, [answers]);

  const questionStatuses = useMemo((): QuestionStatus[] => {
    if (!testWithQuestions) return [];
    return orderedQuestionDetails.map((q, index) => {
      if (!q) return "not-visited";
      if (index === currentQuestion) return "current";
      const isAnswered = answers.has(q._id) && answers.get(q._id)!.length > 0;
      const isMarked = markedForReview.has(q._id);
      const isVisited = visitedQuestions.has(q._id);

      if (isAnswered && isMarked) return "answered-marked";
      if (isAnswered) return "answered";
      if (isMarked) return "marked";
      if (isVisited) return "not-answered";
      return "not-visited";
    });
  }, [testWithQuestions, orderedQuestionDetails, currentQuestion, answers, markedForReview, visitedQuestions]);

  const handleSubmit = async () => {
    if (!attemptId) return;
    await submitAttempt({ attemptId });
    localStorage.removeItem(`test-${testId}-currentQuestion`);
    router.push(`/results/${attemptId}`);
  };

  const handleTimeUp = useCallback(() => {
    if (attemptId) {
      submitAttempt({ attemptId }).then(() => {
        localStorage.removeItem(`test-${testId}-currentQuestion`);
        router.push(`/results/${attemptId}`);
      });
    }
  }, [attemptId, submitAttempt, router, testId]);

  if (!testWithQuestions || !dbUser || existingAttempt === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 sm:h-8" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full sm:h-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTimeRemaining = () => {
    if (!existingAttempt || existingAttempt.status !== "in_progress") return null;
    const elapsed = Date.now() - existingAttempt.startedAt;
    const totalMs = testWithQuestions.duration * 60 * 1000;
    const remaining = Math.max(0, totalMs - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return { minutes, seconds, expired: remaining <= 0 };
  };

  const timeRemaining = getTimeRemaining();

  if (!isStarted) {
    const hasInProgress = existingAttempt?.status === "in_progress";
    const hasCompleted = existingAttempt?.status === "submitted";

    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex items-center gap-3">
          <BackButton href="/tests" />
          <h1 className="text-lg font-semibold">Test Details</h1>
        </div>
        <Card className="overflow-hidden border-2">
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-8 text-center sm:px-8 sm:py-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-lg shadow-black/5">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">{testWithQuestions.title}</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-md text-sm">{testWithQuestions.description}</CardDescription>
          </div>

          <CardContent className="space-y-4 p-6 sm:space-y-5">
            {hasCompleted && (
              <div className="overflow-hidden rounded-xl border-2 border-success/30 bg-success/5">
                <div className="border-b border-success/20 bg-success/10 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <p className="text-sm font-semibold text-success">Previous Attempt Completed</p>
                  </div>
                </div>
                <div className="p-4">
                  {existingAttempt.answerKeyPublished ? (
                    <>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-lg bg-background p-3">
                          <p className="font-serif text-xl font-bold">{existingAttempt.score.toFixed(1)}</p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</p>
                        </div>
                        <div className="rounded-lg bg-background p-3">
                          <p className="font-serif text-xl font-bold text-success">{existingAttempt.correct}</p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Correct</p>
                        </div>
                        <div className="rounded-lg bg-background p-3">
                          <p className="font-serif text-xl font-bold text-destructive">{existingAttempt.incorrect}</p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Wrong</p>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="mt-3 h-auto p-0 text-sm text-success"
                        onClick={() => router.push(`/results/${existingAttempt._id}`)}
                      >
                        View Detailed Results
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Results Pending</p>
                        <p className="text-xs text-muted-foreground">The answer key has not been published yet.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasInProgress && !timeRemaining?.expired && (
              <div className="overflow-hidden rounded-xl border-2 border-primary/30 bg-primary/5">
                <div className="border-b border-primary/20 bg-primary/10 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-primary">Test In Progress</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Time remaining</p>
                      <p className="font-serif text-2xl font-bold text-primary">
                        {timeRemaining?.minutes}m {timeRemaining?.seconds}s
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Answered</p>
                      <p className="font-serif text-2xl font-bold">
                        {existingAttempt.answers.filter(a => a.selected.length > 0).length}
                        <span className="text-base text-muted-foreground">/{existingAttempt.totalQuestions}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasInProgress && timeRemaining?.expired && (
              <div className="overflow-hidden rounded-xl border-2 border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-destructive">Time Expired</p>
                    <p className="text-sm text-muted-foreground">
                      Your previous attempt has expired. Start a new attempt.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border-2 border-transparent bg-muted/50 p-4 text-center transition-colors hover:border-primary/20">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <p className="font-serif text-2xl font-bold">
                  {testWithQuestions.questions.length}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Questions</p>
              </div>
              <div className="rounded-xl border-2 border-transparent bg-muted/50 p-4 text-center transition-colors hover:border-primary/20">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <p className="font-serif text-2xl font-bold">
                  {testWithQuestions.duration}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Minutes</p>
              </div>
              <div className="rounded-xl border-2 border-transparent bg-muted/50 p-4 text-center transition-colors hover:border-primary/20">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="font-serif text-2xl font-bold">
                  {testWithQuestions.totalMarks}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Marks</p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-warning/50 bg-warning/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-warning">Instructions</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground sm:text-sm">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      Once started, the test cannot be paused
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      Negative marking: -{testWithQuestions.negativeMarking} for each wrong answer
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      You can mark questions for review
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      Auto-submit when time runs out
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 p-6">
            {hasInProgress && !timeRemaining?.expired && (
              <Button onClick={handleResumeTest} className="w-full gap-2" size="lg">
                <Play className="h-4 w-4" />
                Resume Test ({timeRemaining?.minutes}m {timeRemaining?.seconds}s left)
              </Button>
            )}

            {hasCompleted || (hasInProgress && timeRemaining?.expired) ? (
              <Button
                onClick={() => handleStartTest(true)}
                className="w-full gap-2"
                size="lg"
                variant={hasInProgress && !timeRemaining?.expired ? "outline" : "default"}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4" />
                {isLoading ? "Starting..." : "Retake Test"}
              </Button>
            ) : !hasInProgress ? (
              <Button
                onClick={() => handleStartTest(false)}
                className="w-full gap-2"
                size="lg"
                disabled={isLoading}
              >
                <Play className="h-4 w-4" />
                {isLoading ? "Starting..." : "Start Test"}
              </Button>
            ) : null}

            {hasInProgress && !timeRemaining?.expired && (
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => handleStartTest(true)}
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Abandon & Start New Attempt"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQ = orderedQuestionDetails[currentQuestion];
  if (!currentQ) return null;

  return (
    <div className="-mb-20 bg-muted/30 md:-mb-0">
      {/* Header */}
      <div className="sticky top-14 z-40 border-b bg-background px-4 py-2 sm:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold sm:text-base lg:text-lg">{testWithQuestions.title}</h1>
            <p className="text-xs text-muted-foreground md:hidden">
              Q{currentQuestion + 1}/{orderedQuestionDetails.length}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {startTime && (
              <TestTimer
                durationMinutes={testWithQuestions.duration}
                startTime={startTime}
                onTimeUp={handleTimeUp}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowInstructions(true)}
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowSubmitDialog(true)}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 pb-20 sm:py-6 md:pb-6">
        <div className="grid gap-4 md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_280px] md:gap-5 lg:gap-6">
          {/* Question Area — swipeable */}
          <div className="space-y-4 sm:space-y-6">
            <div
              className="overflow-hidden touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div ref={questionAreaRef} className="will-change-transform">
                <QuestionCard
                  questionNumber={currentQuestion + 1}
                  text={currentQ.text}
                  options={currentQ.options}
                  selectedOptions={answers.get(currentQ._id) ?? EMPTY_OPTIONS}
                  isMultipleCorrect={currentQ.correctOptions.length > 1}
                  markedForReview={markedForReview.has(currentQ._id)}
                  onSelect={handleSelectAnswer}
                  onMarkForReview={handleMarkForReview}
                />
              </div>
            </div>

            {/* Desktop Navigation Buttons */}
            <div className="hidden justify-between sm:flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToQuestion(currentQuestion - 1, "right")}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Previous
              </Button>
              <Button
                size="sm"
                onClick={() => navigateToQuestion(currentQuestion + 1, "left")}
                disabled={
                  currentQuestion === orderedQuestionDetails.length - 1
                }
              >
                Next
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tablet/Desktop Sidebar */}
          <div className="hidden md:block">
            <Card className="sticky top-32">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <TestNavigation
                  totalQuestions={orderedQuestionDetails.length}
                  currentQuestion={currentQuestion}
                  questionStatuses={questionStatuses}
                  onQuestionSelect={setCurrentQuestion}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex items-center justify-around py-2">
          {/* Previous Button */}
          <button
            onClick={() => navigateToQuestion(currentQuestion - 1, "right")}
            disabled={currentQuestion === 0}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1.5",
              currentQuestion === 0 ? "opacity-40" : "active:scale-95"
            )}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[10px]">Previous</span>
          </button>

          {/* Questions Grid Button */}
          <button
            onClick={() => setShowNavDrawer(true)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 active:scale-95"
          >
            <div className="relative">
              <List className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[9px] font-bold text-white">
                {answeredCount}
              </span>
            </div>
            <span className="text-[10px]">Questions</span>
          </button>

          {/* Mark for Review */}
          <button
            onClick={handleMarkForReview}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1.5 active:scale-95",
              markedForReview.has(currentQ._id) && "text-warning"
            )}
          >
            <div className="relative h-5 w-5">
              {markedForReview.has(currentQ._id) ? (
                <Flag className="h-5 w-5 text-warning fill-warning" />
              ) : (
                <Flag className="h-5 w-5" />
              )}
            </div>
            <span className="text-[10px]">{markedForReview.has(currentQ._id) ? "Marked" : "Mark"}</span>
          </button>

          {/* Next Button */}
          <button
            onClick={() => navigateToQuestion(currentQuestion + 1, "left")}
            disabled={currentQuestion === orderedQuestionDetails.length - 1}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1.5",
              currentQuestion === orderedQuestionDetails.length - 1
                ? "opacity-40"
                : "active:scale-95"
            )}
          >
            <ArrowRight className="h-5 w-5" />
            <span className="text-[10px]">Next</span>
          </button>

        </div>
      </div>

      {/* Mobile Navigation Right Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity md:hidden",
          showNavDrawer ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setShowNavDrawer(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[280px] border-l bg-background shadow-2xl transition-transform duration-300 ease-out md:hidden",
          showNavDrawer ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Question Navigator</h2>
              <p className="text-xs text-muted-foreground">
                {answeredCount} of {orderedQuestionDetails.length} answered
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowNavDrawer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <TestNavigation
              totalQuestions={orderedQuestionDetails.length}
              currentQuestion={currentQuestion}
              questionStatuses={questionStatuses}
              onQuestionSelect={(q) => {
                setCurrentQuestion(q);
                setShowNavDrawer(false);
              }}
            />
          </div>
        </div>
      </div>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Instructions</DialogTitle>
          </DialogHeader>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              Once started, the test cannot be paused
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              Negative marking: -{testWithQuestions.negativeMarking} for each wrong answer
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              You can mark questions for review
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              Auto-submit when time runs out
            </li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstructions(false)} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-success sm:text-2xl">
                  {answeredCount}
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">Answered</p>
              </div>
              <div>
                <p className="text-xl font-bold text-warning sm:text-2xl">
                  {markedForReview.size}
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">Marked</p>
              </div>
              <div>
                <p className="text-xl font-bold sm:text-2xl">
                  {orderedQuestionDetails.length - answeredCount}
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">Unanswered</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="w-full sm:w-auto">
              Continue Test
            </Button>
            <Button variant="destructive" onClick={handleSubmit} className="w-full sm:w-auto">
              Submit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
