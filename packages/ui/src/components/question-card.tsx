"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Card, CardContent, CardHeader } from "./card";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { Badge } from "./badge";
import { Button } from "./button";
import { X } from "lucide-react";

interface QuestionCardProps {
  questionNumber: number;
  text: string;
  options: string[];
  selectedOptions: number[];
  correctOptions?: number[];
  showAnswer?: boolean;
  isMultipleCorrect?: boolean;
  markedForReview?: boolean;
  onSelect: (selected: number[]) => void;
  onMarkForReview?: () => void;
  className?: string;
}

export function QuestionCard({
  questionNumber,
  text,
  options,
  selectedOptions,
  correctOptions,
  showAnswer = false,
  isMultipleCorrect = false,
  markedForReview = false,
  onSelect,
  onMarkForReview,
  className,
}: QuestionCardProps) {
  const handleSingleSelect = (index: number) => {
    if (selectedOptions.includes(index)) {
      onSelect([]); // Deselect on re-click
    } else {
      onSelect([index]);
    }
  };

  const handleMultiSelect = (index: number, checked: boolean) => {
    if (checked) {
      onSelect([...selectedOptions, index]);
    } else {
      onSelect(selectedOptions.filter((i) => i !== index));
    }
  };

  const getOptionStyle = (index: number) => {
    if (!showAnswer) return "";

    const isSelected = selectedOptions.includes(index);
    const isCorrect = correctOptions?.includes(index);

    if (isCorrect) {
      return "border-success bg-success/10";
    }
    if (isSelected && !isCorrect) {
      return "border-destructive bg-destructive/10";
    }
    return "";
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm font-medium">
              Q{questionNumber}
            </Badge>
            {markedForReview && (
              <Badge variant="warning" className="text-xs">
                Marked for Review
              </Badge>
            )}
            {isMultipleCorrect && (
              <Badge variant="secondary" className="text-xs">
                Multiple Correct
              </Badge>
            )}
          </div>
          {onMarkForReview && !showAnswer && (
            <button
              onClick={onMarkForReview}
              className={cn(
                "text-sm underline-offset-4 hover:underline",
                markedForReview
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            >
              {markedForReview ? "Unmark Review" : "Mark for Review"}
            </button>
          )}
        </div>
        <p className="mt-2 text-base font-medium leading-relaxed">{text}</p>
      </CardHeader>
      <CardContent>
        {isMultipleCorrect ? (
          <div className="space-y-3">
            {options.map((option, index) => (
              <div
                key={index}
                onClick={() => !showAnswer && handleMultiSelect(index, !selectedOptions.includes(index))}
                className={cn(
                  "flex items-center space-x-3 rounded-lg border p-3 transition-colors cursor-pointer",
                  selectedOptions.includes(index) && !showAnswer
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                  getOptionStyle(index),
                  showAnswer && "cursor-default"
                )}
              >
                <Checkbox
                  id={`option-${questionNumber}-${index}`}
                  checked={selectedOptions.includes(index)}
                  onCheckedChange={(checked) =>
                    handleMultiSelect(index, checked as boolean)
                  }
                  disabled={showAnswer}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label
                  htmlFor={`option-${questionNumber}-${index}`}
                  className="flex-1 cursor-pointer text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="mr-2 font-medium">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((option, index) => (
              <div
                key={index}
                onClick={() => !showAnswer && handleSingleSelect(index)}
                className={cn(
                  "flex items-center space-x-3 rounded-lg border p-3 transition-colors cursor-pointer",
                  selectedOptions.includes(index) && !showAnswer
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                  getOptionStyle(index),
                  showAnswer && "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    selectedOptions.includes(index)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground",
                    showAnswer && "opacity-50"
                  )}
                >
                  {selectedOptions.includes(index) && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <Label
                  className="flex-1 cursor-pointer text-sm"
                >
                  <span className="mr-2 font-medium">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )}

        {/* Clear Answer Button */}
        {selectedOptions.length > 0 && !showAnswer && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect([])}
            className="mt-4 w-full gap-2 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear Answer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
