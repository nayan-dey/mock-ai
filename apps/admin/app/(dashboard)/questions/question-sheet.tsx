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
  RadioGroup,
  RadioGroupItem,
} from "@repo/ui";
import { AdminSheet } from "@/components/admin-sheet";
import { SubjectSelector } from "@/components/subject-selector";

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
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [explanation, setExplanation] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!questionId;

  useEffect(() => {
    if (open && question && isEdit) {
      setText(question.text);
      setOptions(
        question.options.length === 4
          ? question.options
          : [...question.options, ...Array(4 - question.options.length).fill("")].slice(0, 4)
      );
      setCorrectOption(question.correctOptions[0] ?? null);
      setExplanation(question.explanation || "");
      setSubject(question.subject);
      setDifficulty(question.difficulty);
    } else if (open && !isEdit) {
      setText("");
      setOptions(["", "", "", ""]);
      setCorrectOption(null);
      setExplanation("");
      setSubject("");
      setDifficulty("medium");
    }
  }, [open, question, isEdit]);

  const handleOptionChange = useCallback((index: number, value: string) => {
    setOptions((prev) => {
      const newOptions = [...prev];
      newOptions[index] = value;
      return newOptions;
    });
  }, []);

  const isValid =
    text.trim() &&
    options.every((o) => o.trim()) &&
    correctOption !== null &&
    subject;

  const handleSubmit = async () => {
    if (!isValid || correctOption === null) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateQuestion({
          id: questionId as any,
          text: text.trim(),
          options,
          correctOptions: [correctOption],
          explanation: explanation.trim() || undefined,
          subject,
          difficulty,
        });
        toast({ title: "Question updated" });
      } else {
        await createQuestion({
          text: text.trim(),
          options,
          correctOptions: [correctOption],
          explanation: explanation.trim() || undefined,
          subject,
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
          <Label id="options-label">Options * (select the correct answer)</Label>
          <RadioGroup
            value={correctOption !== null ? String(correctOption) : ""}
            onValueChange={(val) => setCorrectOption(Number(val))}
          >
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <RadioGroupItem
                  value={String(index)}
                  id={`option-${index}`}
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
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Subject & Difficulty */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="q-subject">Subject *</Label>
            <SubjectSelector value={subject} onValueChange={setSubject} id="q-subject" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="q-difficulty">Difficulty *</Label>
            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
              <SelectTrigger id="q-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
