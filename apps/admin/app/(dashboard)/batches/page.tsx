"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Badge,
  useToast,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DataTable,
  SortableHeader,
  type ColumnDef,
} from "@repo/ui";
import {
  Users,
  Plus,
  MoreHorizontal,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
} from "lucide-react";
import Link from "next/link";

interface Batch {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  referralCode: string;
  createdAt: number;
}

export default function BatchesPage() {
  const batches = useQuery(api.batches.list, {});
  const updateBatch = useMutation(api.batches.update);
  const removeBatch = useMutation(api.batches.remove);
  const { toast } = useToast();

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateBatch({
        id: id as any,
        isActive: !currentStatus,
      });
      toast({
        title: "Batch updated",
        description: `Batch has been ${!currentStatus ? "activated" : "deactivated"}.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update batch status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;

    try {
      await removeBatch({ id: id as any });
      toast({
        title: "Batch deleted",
        description: "The batch has been removed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete batch.",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Batch>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("description") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "referralCode",
      header: "Referral Code",
      cell: ({ row }) => {
        const code = row.getValue("referralCode") as string;
        const studentBaseUrl =
          process.env.NEXT_PUBLIC_STUDENT_APP_URL || "http://localhost:3000";
        const referralUrl = `${studentBaseUrl}/sign-up?ref=${code}`;
        return (
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
              {code}
            </code>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                navigator.clipboard.writeText(referralUrl);
                toast({
                  title: "Referral link copied!",
                  description: referralUrl,
                });
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <SortableHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.getValue("isActive") ? "success" : "secondary"}>
          {row.getValue("isActive") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const batch = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleToggleActive(batch._id, batch.isActive)}
              >
                {batch.isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(batch._id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (batches === undefined) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batches</h1>
          <p className="text-muted-foreground">
            Manage student batches and groups
          </p>
        </div>
        <Link href="/batches/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Batch
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>All Batches</CardTitle>
              <CardDescription>
                {batches.length} batch{batches.length !== 1 ? "es" : ""} created
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {batches.length > 0 ? (
            <DataTable
              columns={columns}
              data={batches as Batch[]}
              searchKey="name"
              searchPlaceholder="Search batches..."
              showPagination
              pageSize={5}
              emptyMessage="No batches found."
            />
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 font-medium">No batches yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first batch to organize students
              </p>
              <Link href="/batches/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Batch
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
