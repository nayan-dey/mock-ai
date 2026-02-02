"use client";

import { useState } from "react";
import {
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { X, Check } from "lucide-react";
import { type ExtractedQuestion } from "@repo/types";
import { SubjectSelector } from "@/components/subject-selector";

interface QuestionEditorProps {
  question: ExtractedQuestion;
  onSave: (question: ExtractedQuestion) => void;
  onCancel: () => void;
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState(
    question.options.length === 4
      ? question.options
      : [...question.options, ...Array(4 - question.options.length).fill("")].slice(0, 4)
  );
  const [correctOption, setCorrectOption] = useState(question.correctOptions[0] ?? 0);
  const [explanation, setExplanation] = useState(question.explanation || "");
  const [subject, setSubject] = useState(question.subject);
  const [difficulty, setDifficulty] = useState(question.difficulty);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    onSave({
      ...question,
      text: text.trim(),
      options,
      correctOptions: [correctOption],
      explanation: explanation.trim() || undefined,
      subject,
      difficulty,
      needsReview: false,
      reviewReason: undefined,
    });
  };

  const isValid =
    text.trim() &&
    options.every((o) => o.trim()) &&
    subject;

  return (
    <Card className="border-primary">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Edit Question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="edit-text">Question Text</Label>
          <Textarea
            id="edit-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <Label>Options (select the correct answer)</Label>
          <RadioGroup
            value={String(correctOption)}
            onValueChange={(val) => setCorrectOption(Number(val))}
          >
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <RadioGroupItem
                  value={String(index)}
                  id={`edit-option-${index}`}
                />
                <span className="w-6 text-sm font-medium">
                  {String.fromCharCode(65 + index)}.
                </span>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="flex-1"
                />
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Subject & Difficulty */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Subject</Label>
            <SubjectSelector value={subject} onValueChange={setSubject} />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
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

        {/* Explanation */}
        <div className="space-y-2">
          <Label htmlFor="edit-explanation">Explanation (Optional)</Label>
          <Textarea
            id="edit-explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            <Check className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
