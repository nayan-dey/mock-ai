"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Confetti,
  type ConfettiRef,
  cn,
} from "@repo/ui";
import {
  CheckCircle,
  AlertTriangle,
  Save,
  RotateCcw,
  FileText,
  Sparkles,
  CircleCheck,
  CircleX,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  type ExtractedQuestion,
  type ExtractionResult,
  EXTRACTION_MODEL_OPTIONS,
} from "@repo/types";
import { FileUploader, type SelectedFile } from "./components/file-uploader";
import { ExtractionProgress } from "./components/extraction-progress";
import { ExtractedQuestions } from "./components/extracted-questions";
import { CreateTestModal, type TestFormData } from "./components/create-test-modal";
import { ShimmeringText } from "./components/shimmering-text";

type ExtractionState = "upload" | "processing" | "review" | "saving" | "complete";

export default function ExtractQuestionsPage() {
  const router = useRouter();
  const { user } = useUser();
  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const bulkCreate = useMutation(api.questions.bulkCreate);
  const consumeExtractLimit = useMutation(api.chat.consumeExtractLimit);
  const subjectsData = useQuery(api.subjects.list, {});
  const createTest = useMutation(api.tests.create);
  const confettiRef = useRef<ConfettiRef>(null);

  // State
  const [state, setState] = useState<ExtractionState>("upload");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>(EXTRACTION_MODEL_OPTIONS[0].id);

  // Create test modal
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const handleFilesSelect = (files: SelectedFile[]) => {
    setSelectedFiles(files);
    setError(null);
  };

  const [isExtracting, startExtracting] = useTransition();

  const handleExtract = async () => {
    if (selectedFiles.length === 0) return;

    // Check extraction rate limit before processing
    try {
      const rateLimitResult = await consumeExtractLimit();
      if (!rateLimitResult.allowed) {
        toast.error(`Daily extraction limit reached (${rateLimitResult.limit}/day). Try again tomorrow.`);
        return;
      }
    } catch {
      // If rate limit check fails, allow the extraction (fail open)
    }

    // Set these synchronously BEFORE the transition so the UI updates immediately
    setState("processing");
    setError(null);
    setProcessingIndex(0);

    startExtracting(async () => {

      const allQuestions: ExtractedQuestion[] = [];
      const errors: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        setProcessingIndex(i);
        const { file, base64 } = selectedFiles[i];

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 360000);

          const response = await fetch("/api/extract-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileBase64: base64,
              mimeType: file.type,
              fileName: file.name,
              model: selectedModel,
              subjects: subjectsData?.map((s) => s.name),
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorMsg = `Server error (${response.status})`;
            try {
              const errorResult = await response.json();
              if (errorResult.error) errorMsg = errorResult.error;
            } catch {
              // Response wasn't JSON
            }
            errors.push(`${file.name}: ${errorMsg}`);
            continue;
          }

          const result: ExtractionResult = await response.json();

          if (!result.success) {
            errors.push(`${file.name}: ${result.error || "Failed to extract"}`);
            continue;
          }

          if (result.questions.length > 0) {
            allQuestions.push(...result.questions);
          }
        } catch (err) {
          console.error(`Extraction error for ${file.name}:`, err);
          if (err instanceof DOMException && err.name === "AbortError") {
            errors.push(
              `${file.name}: Request timed out. The file may be too complex or the AI service is slow. Please try with different model or a smaller file.`
            );
          } else {
            errors.push(`${file.name}: Failed to connect to extraction service`);
          }
        }
      }

      if (allQuestions.length === 0) {
        setError(
          errors.length > 0
            ? errors.join(". ")
            : "No questions found in any of the documents. Please try different files."
        );
        setState("upload");
        return;
      }

      const questions = allQuestions;

      setExtractedQuestions(questions);
      setSelectedIds(new Set(questions.map((_, i) => i)));
      setState("review");

      const needsReview = questions.filter((q) => q.needsReview).length;
      toast.success(
        `Extracted ${questions.length} questions from ${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""}`,
        {
          description:
            errors.length > 0
              ? `${errors.length} file(s) had errors. ${needsReview > 0 ? `${needsReview} questions need review.` : ""}`
              : needsReview > 0
                ? `${needsReview} questions need review`
                : "All questions are ready to save",
        }
      );
    });
  };

  const handleQuestionUpdate = (index: number, question: ExtractedQuestion) => {
    const newQuestions = [...extractedQuestions];
    newQuestions[index] = question;
    setExtractedQuestions(newQuestions);
  };

  const handleQuestionDelete = (index: number) => {
    const newQuestions = extractedQuestions.filter((_, i) => i !== index);
    setExtractedQuestions(newQuestions);

    const newSelectedIds = new Set<number>();
    selectedIds.forEach((id) => {
      if (id < index) newSelectedIds.add(id);
      else if (id > index) newSelectedIds.add(id - 1);
    });
    setSelectedIds(newSelectedIds);
  };

  const triggerComplete = () => {
    setState("complete");
    confettiRef.current?.fire({});
  };

  const [isSaving, startSaving] = useTransition();

  const handleSaveSelected = () => {
    if (!dbUser || selectedIds.size === 0) return;
    startSaving(async () => {
      setState("saving");

      try {
        const questionsToSave = extractedQuestions
          .filter((_, i) => selectedIds.has(i))
          .map((q) => ({
            text: q.text,
            options: q.options,
            correctOptions: q.correctOptions,
            explanation: q.explanation,
            subject: q.subject,
            difficulty: q.difficulty,
          }));

        await bulkCreate({ questions: questionsToSave });

        triggerComplete();
        toast.success(
          `Successfully saved ${questionsToSave.length} questions to the question bank`
        );
      } catch (err) {
        console.error("Save error:", err);
        toast.error("Failed to save questions. Please try again.");
        setState("review");
      }
    });
  };

  const handleCreateTest = async (testData: TestFormData) => {
    if (!dbUser || selectedIds.size === 0) return;

    setIsCreatingTest(true);

    try {
      const questionsToSave = extractedQuestions
        .filter((_, i) => selectedIds.has(i))
        .map((q) => ({
          text: q.text,
          options: q.options,
          correctOptions: q.correctOptions,
          explanation: q.explanation,
          subject: q.subject,
          difficulty: q.difficulty,
        }));

      const questionIds = await bulkCreate({ questions: questionsToSave });

      await createTest({
        title: testData.title,
        description: testData.description,
        questions: questionIds,
        duration: testData.duration,
        totalMarks: testData.totalMarks,
        negativeMarking: testData.negativeMarking,
        status: testData.status,
        batchIds:
          testData.batchIds.length > 0
            ? (testData.batchIds as any)
            : undefined,
      });

      setShowCreateTestModal(false);
      triggerComplete();
      toast.success("Test created successfully!", {
        description: `${questionsToSave.length} questions saved and test "${testData.title}" created.`,
      });
    } catch (err) {
      console.error("Create test error:", err);
      toast.error("Failed to create test. Please try again.");
    } finally {
      setIsCreatingTest(false);
    }
  };

  const handleReset = () => {
    setState("upload");
    setSelectedFiles([]);
    setProcessingIndex(0);
    setExtractedQuestions([]);
    setSelectedIds(new Set());
    setError(null);
  };

  const needsReviewCount = extractedQuestions.filter(
    (q) => q.needsReview
  ).length;

  const selectedModelName = EXTRACTION_MODEL_OPTIONS.find(
    (m) => m.id === selectedModel
  )?.name;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Confetti overlay */}
      <Confetti ref={confettiRef} manualstart />


      {/* Main content area */}
      <div className={cn(
        "mx-auto max-w-4xl",
        (state === "processing" || state === "saving" || state === "complete") &&
          "flex min-h-[70vh] items-center justify-center"
      )}>
        <AnimatePresence mode="wait">
          {/* Upload State */}
          {state === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <FileUploader onFilesSelect={handleFilesSelect} disabled={false} />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardContent className="flex items-center gap-3 py-3">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{error}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Extract button */}
              <div className="flex justify-between">
                   {state === "upload" && (
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXTRACTION_MODEL_OPTIONS.map((model) => (
                <SelectItem key={model.id} value={model.id} className="text-xs">
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
                <Button
                  onClick={handleExtract}
                  disabled={selectedFiles.length === 0 || isExtracting}
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Extract Questions
                </Button>
              </div>

              {/* Tips — Do's and Don'ts */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Tips for best results</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Do&apos;s</p>
                    <ul className="space-y-1.5">
                      {[
                        "Use clear, high-resolution images or scanned PDFs",
                        "Crop images to show only the questions area",
                        "Try switching AI models if results aren't accurate",
                        "Review and edit extracted questions before saving",
                      ].map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                          <CircleCheck className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-destructive">Don&apos;ts</p>
                    <ul className="space-y-1.5">
                      {[
                        "Don't upload blurry or low-quality images",
                        "Don't overuse — each extraction uses AI token credits",
                        "Don't upload files larger than 20MB",
                        "Don't rely on AI for 100% accuracy — always verify",
                      ].map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                          <CircleX className="h-3 w-3 mt-0.5 shrink-0 text-destructive/70" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Processing State */}
          {state === "processing" && selectedFiles.length > 0 && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ExtractionProgress
                files={selectedFiles.map((sf) => ({ name: sf.file.name }))}
                currentIndex={processingIndex}
              />
            </motion.div>
          )}

          {/* Review State */}
          {state === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium">
                    {extractedQuestions.length} Questions Extracted
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {needsReviewCount > 0 && (
                      <span className="text-yellow-600">
                        {needsReviewCount} need review.{" "}
                      </span>
                    )}
                    Select questions to save.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Start Over
                </Button>
              </div>

              {/* Questions */}
              <ExtractedQuestions
                questions={extractedQuestions}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onQuestionUpdate={handleQuestionUpdate}
                onQuestionDelete={handleQuestionDelete}
              />

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  {selectedIds.size} of {extractedQuestions.length} selected
                </p>
                <div className="flex gap-2">
                  <Link href="/questions">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSaveSelected}
                    disabled={selectedIds.size === 0}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                  >
                    <Save className="h-3 w-3" />
                    Save to Bank
                  </Button>
                  <Button
                    onClick={() => setShowCreateTestModal(true)}
                    disabled={selectedIds.size === 0}
                    size="sm"
                    className="gap-1.5 text-xs"
                  >
                    <FileText className="h-3 w-3" />
                    Create Test
                  </Button>
                </div>
              </div>

              <CreateTestModal
                open={showCreateTestModal}
                onOpenChange={setShowCreateTestModal}
                questionCount={selectedIds.size}
                onCreateTest={handleCreateTest}
                isCreating={isCreatingTest}
              />
            </motion.div>
          )}

          {/* Saving State */}
          {state === "saving" && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-6 py-16"
            >
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12 text-primary"
                >
                  <path d="m12.99 6.74 1.93 3.44" />
                  <path d="M19.136 12a10 10 0 0 1-14.271 0" />
                  <path d="m21 21-2.16-3.84" />
                  <path d="m3 21 8.02-14.26" />
                  <circle cx="12" cy="5" r="2" />
                </svg>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              </div>
              <ShimmeringText
                text="Nindo AI is saving your questions..."
                className="text-sm font-medium"
                duration={2}
                repeatDelay={0.5}
                spread={3}
              />
            </motion.div>
          )}

          {/* Complete State */}
          {state === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="flex flex-col items-center justify-center gap-6 py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                className="rounded-full bg-emerald-500/10 p-4"
              >
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h3 className="text-lg font-semibold">All done!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your questions have been saved and are ready to use.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex gap-2"
              >
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Extract More
                </Button>
                <Link href="/questions">
                  <Button variant="outline" size="sm">
                    Question Bank
                  </Button>
                </Link>
                <Link href="/tests">
                  <Button size="sm">View Tests</Button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
