"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Input,
  Textarea,
  Label,
  useToast,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Button,
} from "@repo/ui";
import { Plus, X } from "lucide-react";
import { AdminSheet } from "@/components/admin-sheet";
import { SUBJECTS, TOPICS } from "@repo/types";

interface QuestionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId?: string | null;
}

export function QuestionSheet({ open, onOpenChange, questionId }: QuestionSheetProps) {
  const question = useQuery(
    api.questions.getById,
    questionId ? { id: questionId as any } : "skip"
  );
  const createQuestion = useMutation(api.questions.create);
  const updateQuestion = useMutation(api.questions.update);
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptions, setCorrectOptions] = useState<number[]>([]);
  const [explanation, setExplanation] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!questionId;

  useEffect(() => {
    if (open && question && isEdit) {
      setText(question.text);
      setOptions(question.options);
      setCorrectOptions(question.correctOptions);
      setExplanation(question.explanation || "");
      setSubject(question.subject);
      setTopic(question.topic);
      setDifficulty(question.difficulty);
    } else if (open && !isEdit) {
      setText("");
      setOptions(["", "", "", ""]);
      setCorrectOptions([]);
      setExplanation("");
      setSubject("");
      setTopic("");
      setDifficulty("medium");
    }
  }, [open, question, isEdit]);

  const topics = subject ? TOPICS[subject as keyof typeof TOPICS] || [] : [];

  const handleOptionChange = useCallback((index: number, value: string) => {
    setOptions((prev) => {
      const newOptions = [...prev];
      newOptions[index] = value;
      return newOptions;
    });
  }, []);

  const handleCorrectToggle = useCallback((index: number) => {
    setCorrectOptions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  const removeOption = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectOptions((prev) =>
      prev
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i))
    );
  }, []);

  const isValid =
    text.trim() &&
    options.filter((o) => o.trim()).length >= 2 &&
    correctOptions.length > 0 &&
    subject &&
    topic;

  const handleSubmit = async () => {
    if (!isValid) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const cleanOptions = options.filter((o) => o.trim() !== "");
    // Remap correctOptions indices to match cleaned array
    const indexMap = new Map<number, number>();
    let newIdx = 0;
    for (let i = 0; i < options.length; i++) {
      if (options[i].trim() !== "") {
        indexMap.set(i, newIdx++);
      }
    }
    const mappedCorrect = correctOptions
      .filter((i) => indexMap.has(i))
      .map((i) => indexMap.get(i)!);

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateQuestion({
          id: questionId as any,
          text: text.trim(),
          options: cleanOptions,
          correctOptions: mappedCorrect,
          explanation: explanation.trim() || undefined,
          subject,
          topic,
          difficulty,
        });
        toast({ title: "Question updated" });
      } else {
        await createQuestion({
          text: text.trim(),
          options: cleanOptions,
          correctOptions: mappedCorrect,
          explanation: explanation.trim() || undefined,
          subject,
          topic,
          difficulty,
        });
        toast({ title: "Question created" });
      }
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} question.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Question" : "Add Question"}
      description={isEdit ? "Update question details" : "Create a new question"}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Save Changes" : "Add Question"}
      isSubmitting={isSubmitting}
      submitDisabled={!isValid}
      wide
    >
      <div className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="question-text">Question Text *</Label>
          <Textarea
            id="question-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Enter the question text..."
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <Label id="options-label">Options * (check correct answers)</Label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Checkbox
                checked={correctOptions.includes(index)}
                onCheckedChange={() => handleCorrectToggle(index)}
                aria-label={`Mark option ${String.fromCharCode(65 + index)} as correct`}
              />
              <span className="w-6 text-sm font-medium text-muted-foreground">
                {String.fromCharCode(65 + index)}.
              </span>
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1"
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                aria-label={`Option ${String.fromCharCode(65 + index)} text`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  aria-label={`Remove option ${String.fromCharCode(65 + index)}`}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOptions([...options, ""])}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Option
            </Button>
          )}
        </div>

        {/* Subject & Topic */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="q-subject">Subject *</Label>
            <Select
              value={subject}
              onValueChange={(v) => {
                setSubject(v);
                setTopic("");
              }}
            >
              <SelectTrigger id="q-subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="q-topic">Topic *</Label>
            <Select value={topic} onValueChange={setTopic} disabled={!subject}>
              <SelectTrigger id="q-topic">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <Label htmlFor="q-difficulty">Difficulty *</Label>
          <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
            <SelectTrigger id="q-difficulty" className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <Label htmlFor="q-explanation">Explanation (optional)</Label>
          <Textarea
            id="q-explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            placeholder="Explain the correct answer..."
          />
        </div>
      </div>
    </AdminSheet>
  );
}
