"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  BackButton,
} from "@repo/ui";
import { FileText, Download, BookOpen, LayoutGrid, LayoutList, ArrowUpDown, SortAsc, SortDesc, ChevronRight, Calendar } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery as useConvexQuery } from "convex/react";
import { SUBJECTS } from "@repo/types";

type SortOption = "default" | "title-asc" | "title-desc" | "date-asc" | "date-desc";
type ViewMode = "grid" | "list";

export default function NotesPage() {
  const { user } = useUser();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const dbUser = useConvexQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const notes = useQuery(api.notes.listForBatch, {
    batchId: dbUser?.batchId,
    subject: selectedSubject || undefined,
  });

  const sortedNotes = useMemo(() => {
    if (!notes) return [];

    const sorted = [...notes];
    switch (sortBy) {
      case "title-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "date-asc":
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case "date-desc":
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      default:
        return sorted;
    }
  }, [notes, sortBy]);

  const handleDownload = (fileUrl: string | null, title: string) => {
    if (!fileUrl) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton href="/me" />
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold tracking-tight">Study Notes</h1>
            <p className="text-sm text-muted-foreground">
              {notes ? `${notes.length} note${notes.length !== 1 ? "s" : ""} available` : "Loading..."}
            </p>
          </div>
        </div>

        {/* Controls */}
        {notes && notes.length > 0 && (
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
            {notes.length > 1 && (
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("date-desc")}>
                    <SortDesc className="mr-2 h-3.5 w-3.5" />
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("date-asc")}>
                    <SortAsc className="mr-2 h-3.5 w-3.5" />
                    Oldest First
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No notes found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedSubject
                ? "No notes match your filters."
                : "No study notes available yet."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedNotes.map((note) => (
            <Card
              key={note._id}
              className="flex flex-col border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">{note.title}</CardTitle>
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">{note.subject}</Badge>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => handleDownload(note.fileUrl, note.title)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {sortedNotes.map((note) => (
            <Card
              key={note._id}
              className="transition-colors hover:bg-muted/50"
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{note.title}</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{note.subject}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleDownload(note.fileUrl, note.title)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
