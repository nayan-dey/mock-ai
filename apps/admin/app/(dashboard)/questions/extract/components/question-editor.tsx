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
  Checkbox,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { Plus, Trash2, X, Check } from "lucide-react";
import { SUBJECTS, TOPICS, type ExtractedQuestion, type Subject } from "@repo/types";

interface QuestionEditorProps {
  question: ExtractedQuestion;
  onSave: (question: ExtractedQuestion) => void;
  onCancel: () => void;
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState(question.options);
  const [correctOptions, setCorrectOptions] = useState(question.correctOptions);
  const [explanation, setExplanation] = useState(question.explanation || "");
  const [subject, setSubject] = useState(question.subject);
  const [topic, setTopic] = useState(question.topic);
  const [difficulty, setDifficulty] = useState(question.difficulty);

  const availableTopics =
    subject && subject in TOPICS ? TOPICS[subject as Subject] : [];

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCorrectToggle = (index: number) => {
    if (correctOptions.includes(index)) {
      setCorrectOptions(correctOptions.filter((i) => i !== index));
    } else {
      setCorrectOptions([...correctOptions, index]);
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Adjust correct options indices
      setCorrectOptions(
        correctOptions
          .filter((i) => i !== index)
          .map((i) => (i > index ? i - 1 : i))
      );
    }
  };

  const handleSave = () => {
    const validOptions = options.filter((o) => o.trim() !== "");
    const validCorrectOptions = correctOptions.filter((i) => i < validOptions.length);

    onSave({
      ...question,
      text: text.trim(),
      options: validOptions,
      correctOptions: validCorrectOptions,
      explanation: explanation.trim() || undefined,
      subject,
      topic,
      difficulty,
      needsReview: false, // Clear review flag after manual edit
      reviewReason: undefined,
    });
  };

  const isValid =
    text.trim() &&
    options.filter((o) => o.trim()).length >= 2 &&
    correctOptions.length > 0 &&
    subject &&
    topic;

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
          <Label>Options (Mark correct answers)</Label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Checkbox
                checked={correctOptions.includes(index)}
                onCheckedChange={() => handleCorrectToggle(index)}
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
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Option
            </Button>
          )}
        </div>

        {/* Subject & Topic */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select
              value={subject}
              onValueChange={(value) => {
                setSubject(value);
                const newTopics = TOPICS[value as Subject];
                if (newTopics && !newTopics.includes(topic)) {
                  setTopic(newTopics[0]);
                }
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
            <Label>Topic</Label>
            <Select value={topic} onValueChange={setTopic}>
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

        {/* Difficulty */}
        <div className="space-y-2">
          <Label>Difficulty</Label>
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
