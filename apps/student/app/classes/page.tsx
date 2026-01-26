"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  VideoPlayer,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  formatDuration,
  PageHeader,
} from "@repo/ui";
import { Video, Play } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery as useConvexQuery } from "convex/react";
import { SUBJECTS, TOPICS } from "@repo/types";

export default function ClassesPage() {
  const { user } = useUser();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<{
    title: string;
    videoUrl: string;
  } | null>(null);

  const dbUser = useConvexQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const classes = useQuery(api.classes.listForBatch, {
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
        title="Recorded Classes"
        description="Watch video lectures at your own pace"
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

      {/* Classes List */}
      {!classes ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video w-full" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card className="py-8 text-center sm:py-12">
          <CardContent>
            <Video className="mx-auto h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
            <h3 className="mt-4 text-base font-medium sm:text-lg">No Classes Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedSubject || selectedTopic
                ? "No classes match your filters. Try adjusting your selection."
                : "No recorded classes available yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card
              key={classItem._id}
              className="cursor-pointer overflow-hidden border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              onClick={() =>
                setSelectedClass({
                  title: classItem.title,
                  videoUrl: classItem.videoUrl,
                })
              }
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted">
                {classItem.thumbnail ? (
                  <img
                    src={classItem.thumbnail}
                    alt={classItem.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <div className="rounded-full bg-white/90 p-3 sm:p-4">
                    <Play className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                  </div>
                </div>
                {/* Duration badge */}
                <Badge className="absolute bottom-2 right-2 text-xs">
                  {formatDuration(classItem.duration)}
                </Badge>
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-1 text-base sm:text-lg">
                  {classItem.title}
                </CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">{classItem.subject}</Badge>
                  <Badge variant="secondary" className="text-xs">{classItem.topic}</Badge>
                </div>
                <CardDescription className="line-clamp-2 text-sm">
                  {classItem.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog
        open={!!selectedClass}
        onOpenChange={() => setSelectedClass(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0">
          <DialogHeader className="p-4 pb-0 sm:p-6 sm:pb-0">
            <DialogTitle className="text-base sm:text-lg">{selectedClass?.title}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-3 sm:p-6 sm:pt-4">
            {selectedClass && (
              <VideoPlayer
                url={selectedClass.videoUrl}
                className="aspect-video w-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
