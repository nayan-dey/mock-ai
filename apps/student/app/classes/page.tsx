"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  BackButton,
} from "@repo/ui";
import { Video, Play, LayoutGrid, LayoutList, ArrowUpDown, SortAsc, SortDesc, ChevronRight } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import dynamic from "next/dynamic";
import { SUBJECTS } from "@repo/types";

const VideoPlayer = dynamic(() => import("@repo/ui").then(m => ({ default: m.VideoPlayer })), { ssr: false });

type SortOption = "default" | "title-asc" | "title-desc";
type ViewMode = "grid" | "list";

export default function ClassesPage() {
  const { dbUser } = useCurrentUser();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<{
    title: string;
    videoUrl: string;
  } | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const classes = useQuery(api.classes.listForBatch, {
    batchId: dbUser?.batchId,
    subject: selectedSubject || undefined,
  });

  const sortedClasses = useMemo(() => {
    if (!classes) return [];

    const sorted = [...classes];
    switch (sortBy) {
      case "title-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }, [classes, sortBy]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton href="/me" />
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold tracking-tight">Recorded Classes</h1>
            <p className="text-sm text-muted-foreground">
              {classes ? `${classes.length} class${classes.length !== 1 ? "es" : ""} available` : "Loading..."}
            </p>
          </div>
        </div>

        {/* Controls */}
        {classes && classes.length > 0 && (
          <div className="flex items-center gap-1">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            {classes.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("default")}>
                    Default
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("title-asc")}>
                    <SortAsc className="mr-2 h-3.5 w-3.5" />
                    Title (A to Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("title-desc")}>
                    <SortDesc className="mr-2 h-3.5 w-3.5" />
                    Title (Z to A)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Select
          value={selectedSubject || "all"}
          onValueChange={(value) => {
            setSelectedSubject(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No classes found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedSubject
                ? "No classes match your filters."
                : "No recorded classes available yet."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedClasses.map((classItem) => (
            <Card
              key={classItem._id}
              className="cursor-pointer overflow-hidden transition-colors hover:bg-muted/50"
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
                    <Video className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <div className="rounded-full bg-white/90 p-3">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>

              <CardHeader className="pb-4">
                <CardTitle className="line-clamp-1 text-base">
                  {classItem.title}
                </CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px]">{classItem.subject}</Badge>
                </div>
                {classItem.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {classItem.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {sortedClasses.map((classItem) => (
            <Card
              key={classItem._id}
              className="cursor-pointer transition-colors hover:bg-muted/50 my-3"
              onClick={() =>
                setSelectedClass({
                  title: classItem.title,
                  videoUrl: classItem.videoUrl,
                })
              }
            >
              <CardContent className="flex items-center gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {classItem.thumbnail ? (
                    <img
                      src={classItem.thumbnail}
                      alt={classItem.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{classItem.title}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{classItem.subject}</Badge>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardContent>
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
