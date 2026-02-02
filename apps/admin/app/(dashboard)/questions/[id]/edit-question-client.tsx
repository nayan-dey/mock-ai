"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
} from "@repo/ui";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Id } from "@repo/database/dataModel";
import { SubjectSelector } from "@/components/subject-selector";

type QuestionId = Id<"questions">;

interface EditQuestionClientProps {
  questionId: string;
}

export function EditQuestionClient({ questionId }: EditQuestionClientProps) {
  const router = useRouter();

  const question = useQuery(api.questions.getById, { id: questionId as Id<"questions"> });
  const updateQuestion = useMutation(api.questions.update);

  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [explanation, setExplanation] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitialized = useRef(false);

  // Reset when the question ID changes so a fresh load populates the form
  useEffect(() => {
    hasInitialized.current = false;
  }, [questionId]);

  useEffect(() => {
    if (!hasInitialized.current && question) {
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
      hasInitialized.current = true;
    }
  }, [question, questionId]);

  const handleOptionChange = useCallback((index: number, value: string) => {
    setOptions(prev => {
      const newOptions = [...prev];
      newOptions[index] = value;
      return newOptions;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (correctOption === null) return;

    setIsSubmitting(true);
    try {
      await updateQuestion({
        id: questionId as QuestionId,
        text,
        options,
        correctOptions: [correctOption],
        explanation: explanation || undefined,
        subject,
        difficulty,
      });
      toast.success("Question updated successfully");
      router.push("/questions");
    } catch (error) {
      console.error("Failed to update question:", error);
      toast.error("Failed to update question");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (question === undefined) {
    return (
      <div className="p-8">
        <Link href="/questions">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Questions
          </Button>
        </Link>
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Question not found</p>
      </div>
    );
  }

  const isValid =
    text.trim() &&
    options.every((o) => o.trim()) &&
    correctOption !== null &&
    subject;

  return (
    <div className="p-8">
      <Link href="/questions">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Button>
      </Link>

      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Edit Question</CardTitle>
          <CardDescription>Update question details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text">Question Text *</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Options * (select the correct answer)</Label>
              <RadioGroup
                value={correctOption !== null ? String(correctOption) : ""}
                onValueChange={(val) => setCorrectOption(Number(val))}
              >
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <RadioGroupItem
                      value={String(index)}
                      id={`correct-option-${index}`}
                      aria-label={`Mark option ${String.fromCharCode(65 + index)} as correct`}
                    />
                    <label htmlFor={`correct-option-${index}`} className="w-8 font-medium cursor-pointer">
                      {String.fromCharCode(65 + index)}.
                    </label>
                    <Input
                      name={`option-${index}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1"
                      aria-label={`Option ${String.fromCharCode(65 + index)} text`}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <SubjectSelector value={subject} onValueChange={setSubject} />
              </div>

              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <Select
                  value={difficulty}
                  onValueChange={(value: "easy" | "medium" | "hard") =>
                    setDifficulty(value)
                  }
                >
                  <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/questions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
