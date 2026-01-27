"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DataTable,
  SortableHeader,
  Skeleton,
  type ColumnDef,
} from "@repo/ui";
import { Plus, Edit, Trash2, FileQuestion } from "lucide-react";
import Link from "next/link";
import { SUBJECTS } from "@repo/types";
import type { Id } from "@repo/database/dataModel";

type QuestionId = Id<"questions">;

interface Question {
  _id: string;
  text: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export function QuestionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selectedSubject = searchParams.get("subject") || "";
  const selectedDifficulty = searchParams.get("difficulty") || "";

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const questions = useQuery(api.questions.list, {
    subject: selectedSubject || undefined,
    difficulty: (selectedDifficulty as "easy" | "medium" | "hard") || undefined,
  });
  const deleteQuestion = useMutation(api.questions.remove);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteQuestion({ id: deleteId as QuestionId });
      setDeleteId(null);
    }
  }, [deleteId, deleteQuestion]);

  const getDifficultyBadge = useCallback((difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="success">Easy</Badge>;
      case "medium":
        return <Badge variant="warning">Medium</Badge>;
      case "hard":
        return <Badge variant="destructive">Hard</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  }, []);

  const columns: ColumnDef<Question>[] = useMemo(() => [
    {
      accessorKey: "text",
      header: ({ column }) => (
        <SortableHeader column={column} title="Question" />
      ),
      cell: ({ row }) => (
        <p className="line-clamp-2 max-w-md font-medium">{row.getValue("text")}</p>
      ),
    },
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <SortableHeader column={column} title="Subject" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("subject")}</Badge>
      ),
    },
    {
      accessorKey: "topic",
      header: ({ column }) => (
        <SortableHeader column={column} title="Topic" />
      ),
    },
    {
      accessorKey: "difficulty",
      header: ({ column }) => (
        <SortableHeader column={column} title="Difficulty" />
      ),
      cell: ({ row }) => getDifficultyBadge(row.getValue("difficulty")),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-0.5">
          <Link href={`/questions/${row.original._id}`}>
            <Button variant="ghost" size="icon" aria-label="Edit question">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete question"
            onClick={() => setDeleteId(row.original._id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [getDifficultyBadge]);

  if (questions === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="mb-6">
          <CardContent className="p-4">
            <Skeleton className="h-10 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Questions</h1>
          <p className="text-sm text-muted-foreground">Manage your question bank</p>
        </div>
        <Link href="/questions/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Select
            value={selectedSubject || "all"}
            onValueChange={(value) => updateFilter("subject", value)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDifficulty || "all"}
            onValueChange={(value) => updateFilter("difficulty", value)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Questions Table */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <FileQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No questions yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding your first question.
            </p>
            <Link href="/questions/new">
              <Button className="mt-4" size="sm">Add Question</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Question Bank ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={questions as Question[]}
              searchKey="text"
              searchPlaceholder="Search questions..."
              showPagination
              pageSize={5}
              emptyMessage="No questions found."
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
