"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  useToast,
  SortableHeader,
  type ColumnDef,
  formatDate,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { Layers, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { AdminTable, createActionsColumn, type ActionMenuItem } from "@/components/admin-table";
import { ExportDropdown } from "@/components/export-dropdown";
import {
  exportToExcel,
  exportToPdf,
  type ExportColumn,
} from "@/lib/export-utils";
import type { Id } from "@repo/database/dataModel";

const subjectExportColumns: ExportColumn[] = [
  { header: "Name", key: "name" },
  { header: "Created", key: "_creationTime", format: (v) => new Date(v).toLocaleDateString("en-IN") },
];

interface Subject {
  _id: string;
  name: string;
  _creationTime: number;
}

export function SubjectsClient() {
  const subjects = useQuery(api.subjects.list, {});
  const createSubject = useMutation(api.subjects.create);
  const updateSubject = useMutation(api.subjects.update);
  const removeSubject = useMutation(api.subjects.remove);
  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch association counts when delete dialog is open
  const associations = useQuery(
    api.subjects.countAssociations,
    deleteSubject ? { id: deleteSubject._id as Id<"subjects"> } : "skip"
  );

  const handleCreate = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await createSubject({ name: trimmed });
      toast({ title: "Subject created" });
      setInputValue("");
      setAddDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to create subject.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editSubject) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await updateSubject({ id: editSubject._id as Id<"subjects">, name: trimmed });
      toast({ title: "Subject updated" });
      setInputValue("");
      setEditSubject(null);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to update subject.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSubject) return;
    setIsSaving(true);
    try {
      await removeSubject({ id: deleteSubject._id as Id<"subjects"> });
      toast({ title: "Subject deleted" });
      setDeleteSubject(null);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to delete subject.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<Subject>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "_creationTime",
      header: ({ column }) => <SortableHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue("_creationTime") as number)}
        </span>
      ),
    },
    createActionsColumn<Subject>((subject) => {
      const actions: ActionMenuItem[] = [
        {
          label: "Edit",
          icon: <Pencil className="h-4 w-4" />,
          onClick: () => {
            setEditSubject(subject);
            setInputValue(subject.name);
          },
        },
        {
          label: "Delete",
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => setDeleteSubject(subject),
          variant: "destructive",
          separator: true,
        },
      ];
      return actions;
    }),
  ], []);

  const totalAssociations = associations
    ? associations.questions + associations.notes + associations.classes
    : 0;

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(subjects || [], subjectExportColumns, "Subjects", "Subjects");
  };

  const handleExportPdf = () => {
    exportToPdf(subjects || [], subjectExportColumns, "Subjects", "Subjects");
  };

  return (
    <>
      <AdminTable<Subject>
        columns={columns}
        data={(subjects as Subject[]) ?? []}
        isLoading={subjects === undefined}
        searchKey="name"
        searchPlaceholder="Search subjects..."
        title="Subjects"
        description="Manage subjects for questions, notes, and classes"
        primaryAction={{
          label: "Add Subject",
          onClick: () => {
            setInputValue("");
            setAddDialogOpen(true);
          },
        }}
        emptyIcon={<Layers className="h-6 w-6 text-muted-foreground" />}
        emptyTitle="No subjects yet"
        emptyDescription="Create your first subject to categorize content"
        emptyAction={{
          label: "Add Subject",
          onClick: () => {
            setInputValue("");
            setAddDialogOpen(true);
          },
        }}
        showColumnVisibility={true}
        toolbarExtra={
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={!subjects || subjects.length === 0}
          />
        }
      />

      {/* Add Subject Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>
              Create a new subject for organizing content.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Subject name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!inputValue.trim() || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={!!editSubject} onOpenChange={(open) => { if (!open) setEditSubject(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Rename this subject. All associated content will be updated.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Subject name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUpdate();
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSubject(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!inputValue.trim() || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteSubject} onOpenChange={(open) => { if (!open) setDeleteSubject(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteSubject?.name}&quot;</strong>?
            </DialogDescription>
          </DialogHeader>
          {associations === undefined && deleteSubject ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking associated content...
            </div>
          ) : totalAssociations > 0 ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <p className="font-medium text-destructive">Warning: This subject has associated content</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {associations!.questions > 0 && (
                  <li>• {associations!.questions} question{associations!.questions !== 1 ? "s" : ""}</li>
                )}
                {associations!.notes > 0 && (
                  <li>• {associations!.notes} note{associations!.notes !== 1 ? "s" : ""}</li>
                )}
                {associations!.classes > 0 && (
                  <li>• {associations!.classes} class{associations!.classes !== 1 ? "es" : ""}</li>
                )}
              </ul>
              <p className="mt-2 text-muted-foreground">
                This content will retain its subject label but the subject won&apos;t appear in selectors anymore.
              </p>
            </div>
          ) : associations ? (
            <p className="text-sm text-muted-foreground">
              No content is associated with this subject.
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSubject(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving || associations === undefined}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
