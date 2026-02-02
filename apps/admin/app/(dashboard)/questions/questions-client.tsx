"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Badge,
  useToast,
  SortableHeader,
  type ColumnDef,
  type FacetedFilterConfig,
} from "@repo/ui";
import { FileQuestion, Pencil, Trash2 } from "lucide-react";
import { SUBJECTS } from "@repo/types";
import { AdminTable, createActionsColumn } from "@/components/admin-table";
import { QuestionSheet } from "./question-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "subject",
    title: "Subject",
    options: SUBJECTS.map((s) => ({ label: s, value: s })),
  },
  {
    columnId: "difficulty",
    title: "Difficulty",
    options: [
      { label: "Easy", value: "easy" },
      { label: "Medium", value: "medium" },
      { label: "Hard", value: "hard" },
    ],
  },
];

interface Question {
  _id: string;
  text: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  options: string[];
  correctOptions: number[];
  explanation?: string;
}

export function QuestionsClient() {
  const { toast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  const questions = useQuery(api.questions.list, {});
  const deleteQuestion = useMutation(api.questions.remove);

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestion({ id: id as any });
      toast({ title: "Question deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete question.", variant: "destructive" });
    }
    setDeleteQuestionId(null);
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return <Badge variant="success">Easy</Badge>;
      case "medium": return <Badge variant="warning">Medium</Badge>;
      case "hard": return <Badge variant="destructive">Hard</Badge>;
      default: return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  const columns: ColumnDef<Question, any>[] = useMemo(() => [
    {
      accessorKey: "text",
      header: ({ column }) => <SortableHeader column={column} title="Question" />,
      cell: ({ row }) => (
        <p className="truncate max-w-[250px] font-medium">{row.getValue("text")}</p>
      ),
    },
    {
      accessorKey: "subject",
      header: ({ column }) => <SortableHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("subject")}</Badge>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "difficulty",
      header: ({ column }) => <SortableHeader column={column} title="Difficulty" />,
      cell: ({ row }) => getDifficultyBadge(row.getValue("difficulty")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
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
        onClick: () => setDeleteQuestionId(q._id),
        variant: "destructive",
        separator: true,
      },
    ]),
  ], [getDifficultyBadge, setEditingQuestionId, setSheetOpen, setDeleteQuestionId]);

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
        facetedFilters={facetedFilters}
      />

      <QuestionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        questionId={editingQuestionId}
      />

      <ConfirmDialog
        open={!!deleteQuestionId}
        onOpenChange={(open) => { if (!open) setDeleteQuestionId(null); }}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteQuestionId) return handleDelete(deleteQuestionId); }}
      />
    </>
  );
}
