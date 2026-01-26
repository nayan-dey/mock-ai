"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  formatDate,
  PageHeader,
} from "@repo/ui";
import { FileText, Download, BookOpen } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery as useConvexQuery } from "convex/react";
import { SUBJECTS, TOPICS } from "@repo/types";

export default function NotesPage() {
  const { user } = useUser();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  const dbUser = useConvexQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const notes = useQuery(api.notes.listForBatch, {
    batchId: dbUser?.batchId,
    subject: selectedSubject || undefined,
    topic: selectedTopic || undefined,
  });

  const availableTopics =
    selectedSubject && selectedSubject in TOPICS
      ? TOPICS[selectedSubject as keyof typeof TOPICS]
      : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        title="Study Notes"
        description="Access study materials and notes by subject"
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:gap-4 sm:pt-6">
          <div className="w-full sm:w-48">
            <Select
              value={selectedSubject}
              onValueChange={(value) => {
                setSelectedSubject(value === "all" ? "" : value);
                setSelectedTopic("");
              }}
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

          {selectedSubject && availableTopics.length > 0 && (
            <div className="w-full sm:w-48">
              <Select
                value={selectedTopic}
                onValueChange={(value) =>
                  setSelectedTopic(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {availableTopics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes List */}
      {!notes ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card className="py-8 text-center sm:py-12">
          <CardContent>
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
            <h3 className="mt-4 text-base font-medium sm:text-lg">No Notes Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedSubject || selectedTopic
                ? "No notes match your filters. Try adjusting your selection."
                : "No study notes available yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note._id} className="flex flex-col border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">{note.title}</CardTitle>
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">{note.subject}</Badge>
                  <Badge variant="secondary" className="text-xs">{note.topic}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="line-clamp-3 text-sm">
                  {note.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDate(note.createdAt)}
                </span>
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
