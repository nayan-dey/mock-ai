"use client";

import { useRouter } from "next/navigation";
import { usePreloadedQuery, useMutation, Preloaded } from "convex/react";
import { api } from "@repo/database";
import { useState, useEffect, useCallback } from "react";
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
  Checkbox,
} from "@repo/ui";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { SUBJECTS, TOPICS } from "@repo/types";
import type { Id } from "@repo/database/dataModel";

type QuestionId = Id<"questions">;

interface EditQuestionClientProps {
  questionId: string;
  preloadedQuestion: Preloaded<typeof api.questions.getById>;
}

export function EditQuestionClient({ questionId, preloadedQuestion }: EditQuestionClientProps) {
  const router = useRouter();

  const question = usePreloadedQuery(preloadedQuestion);
  const updateQuestion = useMutation(api.questions.update);

  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [correctOptions, setCorrectOptions] = useState<number[]>([]);
  const [explanation, setExplanation] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (question) {
      setText(question.text);
      setOptions(question.options);
      setCorrectOptions(question.correctOptions);
      setExplanation(question.explanation || "");
      setSubject(question.subject);
      setTopic(question.topic);
      setDifficulty(question.difficulty);
    }
  }, [question]);

  const availableTopics =
    subject && subject in TOPICS ? TOPICS[subject as keyof typeof TOPICS] : [];

  const handleOptionChange = useCallback((index: number, value: string) => {
    setOptions(prev => {
      const newOptions = [...prev];
      newOptions[index] = value;
      return newOptions;
    });
  }, []);

  const handleCorrectToggle = useCallback((index: number) => {
    setCorrectOptions(prev =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateQuestion({
        id: questionId as QuestionId,
        text,
        options: options.filter((o) => o.trim() !== ""),
        correctOptions,
        explanation: explanation || undefined,
        subject,
        topic,
        difficulty,
      });
      router.push("/questions");
    } catch (error) {
      console.error("Failed to update question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Question not found</p>
      </div>
    );
  }

  const isValid =
    text.trim() &&
    options.filter((o) => o.trim()).length >= 2 &&
    correctOptions.length > 0 &&
    subject &&
    topic;

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
              <Label>Options * (Mark correct answers)</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Checkbox
                    id={`correct-option-${index}`}
                    checked={correctOptions.includes(index)}
                    onCheckedChange={() => handleCorrectToggle(index)}
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
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions([...options, ""])}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select
                  value={subject}
                  onValueChange={(value) => {
                    setSubject(value);
                    setTopic("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Topic *</Label>
                <Select value={topic} onValueChange={setTopic} disabled={!subject}>
                  <SelectTrigger>
                    <SelectValue />
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

            <div className="space-y-2">
              <Label>Difficulty *</Label>
              <Select
                value={difficulty}
                onValueChange={(value: "easy" | "medium" | "hard") =>
                  setDifficulty(value)
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
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
