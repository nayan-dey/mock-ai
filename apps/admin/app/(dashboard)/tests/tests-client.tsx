"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Badge,
  useToast,
  SortableHeader,
  formatDate,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ColumnDef,
} from "@repo/ui";
import {
  FileText,
  Eye,
  Globe,
  Archive,
  ArchiveRestore,
  BookOpen,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminTable, createActionsColumn } from "@/components/admin-table";

interface Test {
  _id: string;
  title: string;
  questions: string[];
  duration: number;
  totalMarks: number;
  status: "draft" | "published" | "archived";
  answerKeyPublished?: boolean;
  batchIds?: string[];
  createdAt: number;
}

export function TestsClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [batchFilter, setBatchFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");

  const tests = useQuery(api.tests.list, {});
  const batches = useQuery(api.batches.list, {});
  const deleteTest = useMutation(api.tests.remove);
  const publishTest = useMutation(api.tests.publish);
  const archiveTest = useMutation(api.tests.archive);
  const unarchiveTest = useMutation(api.tests.unarchive);
  const toggleAnswerKey = useMutation(api.tests.toggleAnswerKey);

  const batchMap = useMemo(() => {
    const map = new Map<string, string>();
    if (batches) {
      for (const b of batches) map.set(b._id, b.name);
    }
    return map;
  }, [batches]);

  // Apply filters
  const filteredTests = useMemo(() => {
    if (!tests) return [];
    let result = tests as Test[];

    if (batchFilter !== "all") {
      result = result.filter(
        (t) =>
          !t.batchIds ||
          t.batchIds.length === 0 ||
          t.batchIds.includes(batchFilter)
      );
    }

    if (durationFilter !== "all") {
      result = result.filter((t) => {
        switch (durationFilter) {
          case "lt30": return t.duration < 30;
          case "30-60": return t.duration >= 30 && t.duration <= 60;
          case "60-120": return t.duration > 60 && t.duration <= 120;
          case "gt120": return t.duration > 120;
          default: return true;
        }
      });
    }

    return result;
  }, [tests, batchFilter, durationFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    try {
      await deleteTest({ id: id as any });
      toast({ title: "Test deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete test.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return <Badge variant="success">Published</Badge>;
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "archived": return <Badge variant="outline">Archived</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Test, any>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <SortableHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("title")}</span>
      ),
    },
    {
      accessorKey: "questions",
      header: "Qs",
      cell: ({ row }) => (
        <span className="tabular-nums">{(row.getValue("questions") as string[]).length}</span>
      ),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => <SortableHeader column={column} title="Duration" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("duration")} min</span>
      ),
    },
    {
      accessorKey: "totalMarks",
      header: ({ column }) => <SortableHeader column={column} title="Marks" />,
      cell: ({ row }) => (
        <span className="tabular-nums">{row.getValue("totalMarks")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(row.getValue("status"))}
          {row.original.status !== "draft" && (
            <Badge
              variant={row.original.answerKeyPublished ? "success" : "outline"}
              className="text-[10px] w-fit"
            >
              {row.original.answerKeyPublished ? "Key Published" : "Key Hidden"}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "batches",
      header: "Batches",
      cell: ({ row }) => {
        const ids = row.original.batchIds;
        if (!ids || ids.length === 0) {
          return <span className="text-xs text-muted-foreground">All</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {ids.slice(0, 2).map((id) => (
              <Badge key={id} variant="secondary" className="text-xs">
                {batchMap.get(id) || "..."}
              </Badge>
            ))}
            {ids.length > 2 && (
              <Badge variant="secondary" className="text-xs">+{ids.length - 2}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdAt") as number)}
        </span>
      ),
    },
    createActionsColumn<Test>((test) => {
      const actions: any[] = [
        {
          label: "View Details",
          icon: <Eye className="h-4 w-4" />,
          onClick: () => router.push(`/tests/${test._id}`),
        },
      ];

      if (test.status === "draft") {
        actions.push({
          label: "Publish",
          icon: <Globe className="h-4 w-4" />,
          onClick: async () => {
            try {
              await publishTest({ id: test._id as any });
              toast({ title: "Test published" });
            } catch {
              toast({ title: "Error", description: "Failed to publish.", variant: "destructive" });
            }
          },
        });
      }

      if (test.status === "published") {
        actions.push({
          label: "Archive",
          icon: <Archive className="h-4 w-4" />,
          onClick: async () => {
            try {
              await archiveTest({ id: test._id as any });
              toast({ title: "Test archived" });
            } catch {
              toast({ title: "Error", description: "Failed to archive.", variant: "destructive" });
            }
          },
        });
      }

      if (test.status === "archived") {
        actions.push({
          label: "Unarchive",
          icon: <ArchiveRestore className="h-4 w-4" />,
          onClick: async () => {
            try {
              await unarchiveTest({ id: test._id as any });
              toast({ title: "Test unarchived" });
            } catch {
              toast({ title: "Error", description: "Failed to unarchive.", variant: "destructive" });
            }
          },
        });
      }

      if (test.status !== "draft") {
        actions.push({
          label: test.answerKeyPublished ? "Hide Answer Key" : "Publish Answer Key",
          icon: <BookOpen className="h-4 w-4" />,
          onClick: async () => {
            try {
              await toggleAnswerKey({ id: test._id as any });
              toast({ title: test.answerKeyPublished ? "Answer key hidden" : "Answer key published" });
            } catch {
              toast({ title: "Error", description: "Failed to toggle answer key.", variant: "destructive" });
            }
          },
        });
      }

      actions.push({
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleDelete(test._id),
        variant: "destructive",
        separator: true,
      });

      return actions;
    }),
  ];

  return (
    <AdminTable<Test>
      columns={columns}
      data={filteredTests}
      isLoading={tests === undefined}
      searchKey="title"
      searchPlaceholder="Search tests..."
      title="Tests"
      description="Manage your mock tests"
      primaryAction={{
        label: "Create Test",
        onClick: () => router.push("/tests/new"),
      }}
      emptyIcon={<FileText className="h-6 w-6 text-muted-foreground" />}
      emptyTitle="No tests yet"
      emptyDescription="Create your first test to get started"
      emptyAction={{
        label: "Create Test",
        onClick: () => router.push("/tests/new"),
      }}
      toolbarExtra={
        <>
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches?.map((b) => (
                <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={durationFilter} onValueChange={setDurationFilter}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="All Durations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Durations</SelectItem>
              <SelectItem value="lt30">&lt; 30 min</SelectItem>
              <SelectItem value="30-60">30-60 min</SelectItem>
              <SelectItem value="60-120">60-120 min</SelectItem>
              <SelectItem value="gt120">&gt; 120 min</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
