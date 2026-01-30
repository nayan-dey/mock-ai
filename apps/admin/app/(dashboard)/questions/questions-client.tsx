"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Badge,
  useToast,
  SortableHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ColumnDef,
} from "@repo/ui";
import { FileQuestion, Pencil, Trash2 } from "lucide-react";
import { SUBJECTS } from "@repo/types";
import { AdminTable, createActionsColumn } from "@/components/admin-table";
import { QuestionSheet } from "./question-sheet";

interface Question {
  _id: string;
  text: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  options: string[];
  correctOptions: number[];
  explanation?: string;
}

export function QuestionsClient() {
  const { toast } = useToast();
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const questions = useQuery(api.questions.list, {
    subject: subjectFilter !== "all" ? subjectFilter : undefined,
    difficulty: difficultyFilter !== "all" ? (difficultyFilter as any) : undefined,
  });
  const deleteQuestion = useMutation(api.questions.remove);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion({ id: id as any });
      toast({ title: "Question deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete question.", variant: "destructive" });
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return <Badge variant="success">Easy</Badge>;
      case "medium": return <Badge variant="warning">Medium</Badge>;
      case "hard": return <Badge variant="destructive">Hard</Badge>;
      default: return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  const columns: ColumnDef<Question, any>[] = [
    {
      accessorKey: "text",
      header: ({ column }) => <SortableHeader column={column} title="Question" />,
      cell: ({ row }) => (
        <p className="line-clamp-2 max-w-md font-medium">{row.getValue("text")}</p>
      ),
    },
    {
      accessorKey: "subject",
      header: ({ column }) => <SortableHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("subject")}</Badge>
      ),
    },
    {
      accessorKey: "topic",
      header: ({ column }) => <SortableHeader column={column} title="Topic" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("topic")}</span>
      ),
    },
    {
      accessorKey: "difficulty",
      header: ({ column }) => <SortableHeader column={column} title="Difficulty" />,
      cell: ({ row }) => getDifficultyBadge(row.getValue("difficulty")),
    },
    createActionsColumn<Question>((q) => [
      {
        label: "Edit",
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => {
          setEditingQuestionId(q._id);
          setSheetOpen(true);
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleDelete(q._id),
        variant: "destructive",
        separator: true,
      },
    ]),
  ];

  return (
    <>
      <AdminTable<Question>
        columns={columns}
        data={(questions as Question[]) ?? []}
        isLoading={questions === undefined}
        searchKey="text"
        searchPlaceholder="Search questions..."
        title="Questions"
        description="Manage your question bank"
        primaryAction={{
          label: "Add Question",
          onClick: () => {
            setEditingQuestionId(null);
            setSheetOpen(true);
          },
        }}
        emptyIcon={<FileQuestion className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No questions yet"
        emptyDescription="Get started by adding your first question"
        emptyAction={{
          label: "Add Question",
          onClick: () => {
            setEditingQuestionId(null);
            setSheetOpen(true);
          },
        }}
        toolbarExtra={
          <>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <QuestionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        questionId={editingQuestionId}
      />
    </>
  );
}
