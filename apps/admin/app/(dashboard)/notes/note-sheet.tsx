"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Input,
  Textarea,
  Label,
  useToast,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@repo/ui";
import { Upload, X, FileText } from "lucide-react";
import { AdminSheet } from "@/components/admin-sheet";
import { SUBJECTS, TOPICS } from "@repo/types";

interface NoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: {
    _id: string;
    title: string;
    description: string;
    subject: string;
    topic: string;
    storageId: string;
    batchIds?: string[];
  } | null;
}

export function NoteSheet({ open, onOpenChange, note }: NoteSheetProps) {
  const createNote = useMutation(api.notes.create);
  const updateNote = useMutation(api.notes.update);
  const generateUploadUrl = useMutation(api.notes.generateUploadUrl);
  const batches = useQuery(api.batches.list, {});
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadedStorageId, setUploadedStorageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!note;

  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "");
      setDescription(note?.description ?? "");
      setSubject(note?.subject ?? "");
      setTopic(note?.topic ?? "");
      setSelectedBatchIds(note?.batchIds ?? []);
      setFile(null);
      setUploadedStorageId(note?.storageId ?? null);
      setIsUploading(false);
    }
  }, [open, note]);

  // Reset topic when subject changes
  useEffect(() => {
    if (subject && note?.subject !== subject) {
      setTopic("");
    }
  }, [subject, note?.subject]);

  const topics = subject ? TOPICS[subject as keyof typeof TOPICS] || [] : [];

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast({ title: "Only PDF files are allowed", variant: "destructive" });
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({ title: "File must be under 50MB", variant: "destructive" });
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      const { storageId } = await result.json();
      setUploadedStorageId(storageId);
    } catch {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !subject || !topic) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!uploadedStorageId) {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateNote({
          id: note._id as any,
          title: title.trim(),
          description: description.trim(),
          subject,
          topic,
          ...(file ? { storageId: uploadedStorageId as any } : {}),
          batchIds: selectedBatchIds.length > 0 ? (selectedBatchIds as any[]) : undefined,
        });
        toast({ title: "Note updated" });
      } else {
        await createNote({
          title: title.trim(),
          description: description.trim(),
          subject,
          topic,
          storageId: uploadedStorageId as any,
          batchIds: selectedBatchIds.length > 0 ? (selectedBatchIds as any[]) : undefined,
        });
        toast({ title: "Note created" });
      }
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} note.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFile = file || uploadedStorageId;

  return (
    <AdminSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Note" : "Add Note"}
      description={isEdit ? "Update note details" : "Upload a new study note"}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Save Changes" : "Add Note"}
      isSubmitting={isSubmitting || isUploading}
      submitDisabled={!title.trim() || !subject || !topic || !hasFile}
      wide
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title *</Label>
          <Input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 5 - Algebra Basics"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note-desc">Description</Label>
          <Textarea
            id="note-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the note"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="note-subject">Subject *</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="note-subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-topic">Topic *</Label>
            <Select value={topic} onValueChange={setTopic} disabled={!subject}>
              <SelectTrigger id="note-topic">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* PDF Upload */}
        <div className="space-y-2">
          <Label htmlFor="note-file">PDF File *</Label>
          {hasFile ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <FileText className="h-8 w-8 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file?.name || (isEdit ? "Current file" : "Uploaded")}
                </p>
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
                {isUploading && (
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setUploadedStorageId(isEdit ? note?.storageId ?? null : null);
                }}
                aria-label="Remove file"
                className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drop PDF here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF up to 50MB</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            id="note-file"
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Batch Selection */}
        {batches && batches.length > 0 && (
          <div className="space-y-2">
            <Label id="note-batches-label">Batches</Label>
            <p className="text-xs text-muted-foreground">
              Leave empty to make available to all batches
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="note-batches-label">
              {batches.map((batch) => {
                const selected = selectedBatchIds.includes(batch._id);
                return (
                  <button
                    key={batch._id}
                    type="button"
                    onClick={() => toggleBatch(batch._id)}
                    aria-pressed={selected}
                    className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Badge
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {batch.name}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminSheet>
  );
}
