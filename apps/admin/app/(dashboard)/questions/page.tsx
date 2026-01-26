"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
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
  type ColumnDef,
} from "@repo/ui";
import { Plus, Edit, Trash2, FileQuestion } from "lucide-react";
import Link from "next/link";
import { SUBJECTS } from "@repo/types";
import type { Id } from "@repo/database";

type QuestionId = Id<"questions">;

interface Question {
  _id: string;
  text: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export default function QuestionsPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const questions = useQuery(api.questions.list, {
    subject: selectedSubject || undefined,
    difficulty: (selectedDifficulty as "easy" | "medium" | "hard") || undefined,
  });

  const deleteQuestion = useMutation(api.questions.remove);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteQuestion({ id: deleteId as QuestionId });
      setDeleteId(null);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
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
  };

  const columns: ColumnDef<Question>[] = [
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
        <div className="flex justify-end gap-2">
          <Link href={`/questions/${row.original._id}`}>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.original._id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Questions</h1>
          <p className="text-muted-foreground">Manage your question bank</p>
        </div>
        <Link href="/questions/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="w-full sm:w-48">
            <Select
              value={selectedSubject}
              onValueChange={(value) =>
                setSelectedSubject(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
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
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={selectedDifficulty}
              onValueChange={(value) =>
                setSelectedDifficulty(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      {!questions ? (
        <Card>
          <CardContent className="p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="mb-4 h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : questions.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Questions Found</h3>
            <p className="mt-2 text-muted-foreground">
              Get started by adding your first question.
            </p>
            <Link href="/questions/new">
              <Button className="mt-4">Add Question</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Question Bank ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={questions as Question[]}
              searchKey="text"
              searchPlaceholder="Search questions..."
              showPagination
              pageSize={10}
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
