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
import { SUBJECTS, TOPICS } from "@repo/types";

interface ClassSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem?: {
    _id: string;
    title: string;
    description: string;
    subject: string;
    topic: string;
    videoUrl: string;
    duration: number;
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
  const [topic, setTopic] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!classItem;

  useEffect(() => {
    if (open) {
      setTitle(classItem?.title ?? "");
      setDescription(classItem?.description ?? "");
      setSubject(classItem?.subject ?? "");
      setTopic(classItem?.topic ?? "");
      setVideoUrl(classItem?.videoUrl ?? "");
      setDuration(classItem?.duration?.toString() ?? "");
      setThumbnail(classItem?.thumbnail ?? "");
      setSelectedBatchIds(classItem?.batchIds ?? []);
    }
  }, [open, classItem]);

  useEffect(() => {
    if (subject && classItem?.subject !== subject) {
      setTopic("");
    }
  }, [subject, classItem?.subject]);

  const topics = subject ? TOPICS[subject as keyof typeof TOPICS] || [] : [];

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
    if (!title.trim() || !subject || !topic || !videoUrl.trim() || !duration) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      toast({ title: "Please enter a valid YouTube URL", variant: "destructive" });
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast({ title: "Please enter a valid duration", variant: "destructive" });
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
          topic,
          videoUrl: videoUrl.trim(),
          duration: durationNum,
          thumbnail: thumbnail.trim() || undefined,
          batchIds: selectedBatchIds.length > 0 ? (selectedBatchIds as any[]) : undefined,
        });
        toast({ title: "Class updated" });
      } else {
        await createClass({
          title: title.trim(),
          description: description.trim(),
          subject,
          topic,
          videoUrl: videoUrl.trim(),
          duration: durationNum,
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
      submitDisabled={!title.trim() || !subject || !topic || !videoUrl.trim() || !duration}
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
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
            <Label>Topic *</Label>
            <Select value={topic} onValueChange={setTopic} disabled={!subject}>
              <SelectTrigger>
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="class-duration">Duration (minutes) *</Label>
            <Input
              id="class-duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 45"
            />
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
        </div>

        {/* Batch Selection */}
        {batches && batches.length > 0 && (
          <div className="space-y-2">
            <Label>Batches</Label>
            <p className="text-xs text-muted-foreground">
              Leave empty to make available to all batches
            </p>
            <div className="flex flex-wrap gap-2">
              {batches.map((batch) => {
                const selected = selectedBatchIds.includes(batch._id);
                return (
                  <Badge
                    key={batch._id}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleBatch(batch._id)}
                  >
                    {batch.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminSheet>
  );
}
