"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Save, RotateCcw, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SUBJECTS, TOPICS, type ExtractedQuestion, type ExtractionResult, type Subject, EXTRACTION_MODEL_OPTIONS } from "@repo/types";
import { FileUploader } from "./components/file-uploader";
import { ExtractionProgress } from "./components/extraction-progress";
import { ExtractedQuestions } from "./components/extracted-questions";
import { CreateTestModal, type TestFormData } from "./components/create-test-modal";

type ExtractionState = "upload" | "processing" | "review" | "saving" | "complete";

export default function ExtractQuestionsPage() {
  const router = useRouter();
  const { user } = useUser();
  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const bulkCreate = useMutation(api.questions.bulkCreate);
  const createTest = useMutation(api.tests.create);

  // State
  const [state, setState] = useState<ExtractionState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Default subject/topic for new extractions
  const [defaultSubject, setDefaultSubject] = useState<string>("");
  const [defaultTopic, setDefaultTopic] = useState<string>("");

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>(EXTRACTION_MODEL_OPTIONS[0].id);

  // Create test modal
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const availableTopics =
    defaultSubject && defaultSubject in TOPICS
      ? TOPICS[defaultSubject as Subject]
      : [];

  const handleFileSelect = async (file: File, base64: string) => {
    setSelectedFile(file);
    setFileBase64(base64);
    setError(null);
  };

  const handleExtract = async () => {
    if (!selectedFile || !fileBase64) return;

    setState("processing");
    setError(null);

    try {
      const response = await fetch("/api/extract-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileBase64,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
          model: selectedModel,
        }),
      });

      const result: ExtractionResult = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to extract questions");
        setState("upload");
        return;
      }

      if (result.questions.length === 0) {
        setError("No questions found in the document. Please try a different file.");
        setState("upload");
        return;
      }

      // Apply default subject/topic if set
      let questions = result.questions;
      if (defaultSubject && defaultTopic) {
        questions = questions.map((q) => ({
          ...q,
          subject: defaultSubject,
          topic: defaultTopic,
        }));
      }

      setExtractedQuestions(questions);
      setSelectedIds(new Set(questions.map((_, i) => i)));
      setState("review");

      toast.success(`Extracted ${result.totalExtracted} questions`, {
        description: result.needsReviewCount > 0
          ? `${result.needsReviewCount} questions need review`
          : "All questions are ready to save",
      });
    } catch (err) {
      console.error("Extraction error:", err);
      setError("Failed to connect to extraction service. Please try again.");
      setState("upload");
    }
  };

  const handleQuestionUpdate = (index: number, question: ExtractedQuestion) => {
    const newQuestions = [...extractedQuestions];
    newQuestions[index] = question;
    setExtractedQuestions(newQuestions);
  };

  const handleQuestionDelete = (index: number) => {
    const newQuestions = extractedQuestions.filter((_, i) => i !== index);
    setExtractedQuestions(newQuestions);

    // Update selected IDs
    const newSelectedIds = new Set<number>();
    selectedIds.forEach((id) => {
      if (id < index) {
        newSelectedIds.add(id);
      } else if (id > index) {
        newSelectedIds.add(id - 1);
      }
    });
    setSelectedIds(newSelectedIds);
  };

  const handleSaveSelected = async () => {
    if (!dbUser || selectedIds.size === 0) return;

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
          topic: q.topic,
          difficulty: q.difficulty,
        }));

      await bulkCreate({
        questions: questionsToSave,
      });

      setState("complete");
      toast.success(`Successfully saved ${questionsToSave.length} questions to the question bank`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save questions. Please try again.");
      setState("review");
    }
  };

  const handleCreateTest = async (testData: TestFormData) => {
    if (!dbUser || selectedIds.size === 0) return;

    setIsCreatingTest(true);

    try {
      // First, save the selected questions
      const questionsToSave = extractedQuestions
        .filter((_, i) => selectedIds.has(i))
        .map((q) => ({
          text: q.text,
          options: q.options,
          correctOptions: q.correctOptions,
          explanation: q.explanation,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
        }));

      const questionIds = await bulkCreate({
        questions: questionsToSave,
      });

      // Then create the test with those question IDs
      await createTest({
        title: testData.title,
        description: testData.description,
        questions: questionIds,
        duration: testData.duration,
        totalMarks: testData.totalMarks,
        negativeMarking: testData.negativeMarking,
        status: testData.status,
        batchIds: testData.batchIds.length > 0 ? (testData.batchIds as any) : undefined,
      });

      setShowCreateTestModal(false);
      setState("complete");
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
    setSelectedFile(null);
    setFileBase64(null);
    setExtractedQuestions([]);
    setSelectedIds(new Set());
    setError(null);
  };

  const needsReviewCount = extractedQuestions.filter((q) => q.needsReview).length;

  return (
    <div className="p-8">
      <Link href="/questions">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Button>
      </Link>

      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Extract Questions from File
          </CardTitle>
          <CardDescription>
            Upload an image, PDF, or Excel file containing questions, and AI will extract them automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload State */}
          {state === "upload" && (
            <div className="space-y-6">
              <FileUploader
                onFileSelect={handleFileSelect}
                disabled={false}
              />

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTRACTION_MODEL_OPTIONS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Default Subject/Topic */}
              {selectedFile && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="mb-4 text-sm text-muted-foreground">
                      Optionally set a default subject and topic for all extracted questions:
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Default Subject</Label>
                        <Select
                          value={defaultSubject}
                          onValueChange={(value) => {
                            setDefaultSubject(value);
                            setDefaultTopic("");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Auto-detect" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Default Topic</Label>
                        <Select
                          value={defaultTopic}
                          onValueChange={setDefaultTopic}
                          disabled={!defaultSubject}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={defaultSubject ? "Select topic" : "Select subject first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTopics.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Card className="border-destructive bg-destructive/10">
                  <CardContent className="flex items-center gap-3 py-4">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleExtract}
                  disabled={!selectedFile}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Extract Questions
                </Button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {state === "processing" && selectedFile && (
            <ExtractionProgress fileName={selectedFile.name} />
          )}

          {/* Review State */}
          {state === "review" && (
            <div className="space-y-6">
              {/* Summary Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    Extracted {extractedQuestions.length} Questions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {needsReviewCount > 0 && (
                      <span className="text-yellow-600">
                        {needsReviewCount} questions need review.{" "}
                      </span>
                    )}
                    Select questions to save to your question bank.
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Start Over
                </Button>
              </div>

              {/* Questions List */}
              <ExtractedQuestions
                questions={extractedQuestions}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onQuestionUpdate={handleQuestionUpdate}
                onQuestionDelete={handleQuestionDelete}
              />

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size} questions selected
                </p>
                <div className="flex gap-3">
                  <Link href="/questions">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  <Button
                    onClick={handleSaveSelected}
                    disabled={selectedIds.size === 0}
                    variant="outline"
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save to Question Bank
                  </Button>
                  <Button
                    onClick={() => setShowCreateTestModal(true)}
                    disabled={selectedIds.size === 0}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Create Test
                  </Button>
                </div>
              </div>

              {/* Create Test Modal */}
              <CreateTestModal
                open={showCreateTestModal}
                onOpenChange={setShowCreateTestModal}
                questionCount={selectedIds.size}
                onCreateTest={handleCreateTest}
                isCreating={isCreatingTest}
              />
            </div>
          )}

          {/* Saving State */}
          {state === "saving" && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none" />
              <p className="text-muted-foreground">Saving questions to the database...</p>
            </div>
          )}

          {/* Complete State */}
          {state === "complete" && (
            <div className="flex flex-col items-center justify-center gap-6 py-12">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold">Success!</h3>
                <p className="mt-1 text-muted-foreground">
                  Your questions have been saved and are ready to use.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset}>
                  Extract More Questions
                </Button>
                <Link href="/questions">
                  <Button variant="outline">View Question Bank</Button>
                </Link>
                <Link href="/tests">
                  <Button>View Tests</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
