"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Badge,
  cn,
} from "@repo/ui";
import {
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ExtractedQuestion } from "@repo/types";
import { QuestionEditor } from "./question-editor";

interface ExtractedQuestionsProps {
  questions: ExtractedQuestion[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onQuestionUpdate: (index: number, question: ExtractedQuestion) => void;
  onQuestionDelete: (index: number) => void;
}

export function ExtractedQuestions({
  questions,
  selectedIds,
  onSelectionChange,
  onQuestionUpdate,
  onQuestionDelete,
}: ExtractedQuestionsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(questions.map((_, i) => i)));
    }
  };

  const handleSelectOne = (index: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    onSelectionChange(newSet);
  };

  const needsReviewCount = questions.filter((q) => q.needsReview).length;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      easy: "secondary",
      medium: "default",
      hard: "destructive",
    };
    return (
      <Badge variant={variants[difficulty] || "default"}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === questions.length && questions.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.size} of {questions.length} selected
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {questions.length - needsReviewCount} ready
              </span>
              {needsReviewCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {needsReviewCount} need review
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
          >
            {editingIndex === index ? (
              <QuestionEditor
                question={question}
                onSave={(updated) => {
                  onQuestionUpdate(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <Card
                className={cn(
                  "transition-colors",
                  question.needsReview && "border-yellow-400 bg-yellow-50/50",
                  selectedIds.has(index) && "ring-2 ring-primary"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(index)}
                      onCheckedChange={() => handleSelectOne(index)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-muted-foreground">
                              Q{index + 1}
                            </span>
                            {question.needsReview && (
                              <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Needs Review
                              </Badge>
                            )}
                            <span className={cn("text-xs", getConfidenceColor(question.confidence))}>
                              {Math.round(question.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{question.text}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedIndex(expandedIndex === index ? null : index)
                            }
                            className="h-8 w-8"
                          >
                            {expandedIndex === index ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingIndex(index)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onQuestionDelete(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Review Reason */}
                      {question.needsReview && question.reviewReason && (
                        <p className="mt-1 text-xs text-yellow-700">
                          Reason: {question.reviewReason}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{question.subject}</Badge>
                        <Badge variant="outline">{question.topic}</Badge>
                        {getDifficultyBadge(question.difficulty)}
                      </div>

                      {/* Expanded Content */}
                      {expandedIndex === index && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          {/* Options */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Options:
                            </p>
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={cn(
                                  "flex items-start gap-2 text-sm",
                                  question.correctOptions.includes(optIndex) &&
                                    "text-green-700 font-medium"
                                )}
                              >
                                <span className="w-6 shrink-0">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span>{option}</span>
                                {question.correctOptions.includes(optIndex) && (
                                  <CheckCircle className="h-4 w-4 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Explanation */}
                          {question.explanation && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Explanation:
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
