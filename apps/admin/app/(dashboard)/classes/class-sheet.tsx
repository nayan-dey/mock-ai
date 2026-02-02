"use client";

import { useState, useEffect } from "react";
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
import { AdminSheet } from "@/components/admin-sheet";
import { SUBJECTS } from "@repo/types";

interface ClassSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem?: {
    _id: string;
    title: string;
    description: string;
    subject: string;
    videoUrl: string;
    thumbnail?: string;
    batchIds?: string[];
  } | null;
}

export function ClassSheet({ open, onOpenChange, classItem }: ClassSheetProps) {
  const createClass = useMutation(api.classes.create);
  const updateClass = useMutation(api.classes.update);
  const batches = useQuery(api.batches.list, {});
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!classItem;

  useEffect(() => {
    if (open) {
      setTitle(classItem?.title ?? "");
      setDescription(classItem?.description ?? "");
      setSubject(classItem?.subject ?? "");
      setVideoUrl(classItem?.videoUrl ?? "");
      setThumbnail(classItem?.thumbnail ?? "");
      setSelectedBatchIds(classItem?.batchIds ?? []);
    }
  }, [open, classItem]);

  const isValidYouTubeUrl = (url: string) =>
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !subject || !videoUrl.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      toast({ title: "Please enter a valid YouTube URL", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateClass({
          id: classItem._id as any,
          title: title.trim(),
          description: description.trim(),
          subject,
          videoUrl: videoUrl.trim(),
          thumbnail: thumbnail.trim() || undefined,
          batchIds: selectedBatchIds.length > 0 ? (selectedBatchIds as any[]) : undefined,
        });
        toast({ title: "Class updated" });
      } else {
        await createClass({
          title: title.trim(),
          description: description.trim(),
          subject,
          videoUrl: videoUrl.trim(),
          thumbnail: thumbnail.trim() || undefined,
          batchIds: selectedBatchIds.length > 0 ? (selectedBatchIds as any[]) : undefined,
        });
        toast({ title: "Class created" });
      }
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} class.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Class" : "Add Class"}
      description={isEdit ? "Update class details" : "Add a new recorded class"}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Save Changes" : "Add Class"}
      isSubmitting={isSubmitting}
      submitDisabled={!title.trim() || !subject || !videoUrl.trim()}
      wide
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="class-title">Title *</Label>
          <Input
            id="class-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Algebra"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="class-desc">Description</Label>
          <Textarea
            id="class-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the class"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="class-subject">Subject *</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger id="class-subject">
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
          <Label htmlFor="class-video">YouTube URL *</Label>
          <Input
            id="class-video"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          {videoUrl && !isValidYouTubeUrl(videoUrl) && (
            <p className="text-xs text-destructive">Enter a valid YouTube URL</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="class-thumb">Thumbnail URL</Label>
          <Input
            id="class-thumb"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="Optional thumbnail URL"
          />
        </div>

        {/* Batch Selection */}
        {batches && batches.length > 0 && (
          <div className="space-y-2">
            <Label id="class-batches-label">Batches</Label>
            <p className="text-xs text-muted-foreground">
              Leave empty to make available to all batches
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="class-batches-label">
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
