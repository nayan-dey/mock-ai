"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@repo/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SUBJECTS, TOPICS } from "@repo/types";

export default function NewNotePage() {
  const router = useRouter();
  const { user } = useUser();
  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const createNote = useMutation(api.notes.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTopics =
    subject && subject in TOPICS ? TOPICS[subject as keyof typeof TOPICS] : [];

  const batches = useQuery(api.batches.list, { activeOnly: true });

  const handleBatchToggle = (batchId: string) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(selectedBatches.filter((id) => id !== batchId));
    } else {
      setSelectedBatches([...selectedBatches, batchId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) return;

    setIsSubmitting(true);
    try {
      await createNote({
        title,
        description,
        subject,
        topic,
        fileUrl,
        batchIds: selectedBatches.length > 0 ? (selectedBatches as any) : undefined,
      });
      router.push("/notes");
    } catch (error) {
      console.error("Failed to create note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = title.trim() && subject && topic && fileUrl.trim();

  return (
    <div className="p-8">
      <Link href="/notes">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notes
        </Button>
      </Link>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Add New Note</CardTitle>
          <CardDescription>Upload study material</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select
                  value={subject}
                  onValueChange={(value) => {
                    setSubject(value);
                    setTopic("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Topic *</Label>
                <Select
                  value={topic}
                  onValueChange={setTopic}
                  disabled={!subject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTopics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/notes.pdf"
                type="url"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL of the PDF or document
              </p>
            </div>

            {/* Batch Selection */}
            <div className="space-y-2">
              <Label>Target Batches (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Leave empty to make available to all students
              </p>
              <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                {batches && batches.length > 0 ? (
                  batches.map((batch) => (
                    <Badge
                      key={batch._id}
                      variant={selectedBatches.includes(batch._id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleBatchToggle(batch._id)}
                    >
                      {batch.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No batches available
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/notes">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
