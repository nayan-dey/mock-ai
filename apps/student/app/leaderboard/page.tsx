"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  TierBadge,
  TopPerformers,
  Button,
  Input,
  Avatar,
  AvatarFallback,
  type Tier,
  type TopPerformer,
} from "@repo/ui";
import { Trophy, Medal, Users, Search, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Target, FileText, ChevronRight as ChevronRightIcon, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="mb-6 h-40 w-full rounded-lg" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

interface LeaderboardEntryData {
  rank: number;
  userId: string;
  userName: string;
  totalScore: number;
  testsCompleted: number;
  avgAccuracy: number;
  tier: Tier;
  isCurrentUser?: boolean;
}

type ViewMode = "list" | "card";
type LeaderboardMode = "global" | "batch";
const PAGE_SIZE = 10;

export default function LeaderboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>("batch");

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const batch = useQuery(
    api.batches.getById,
    dbUser?.batchId ? { id: dbUser.batchId } : "skip"
  );

  const globalLeaderboard = useQuery(api.analytics.getGlobalLeaderboard, {
    limit: 100,
  });

  const batchLeaderboard = useQuery(
    api.analytics.getBatchLeaderboard,
    dbUser?.batchId ? { batchId: dbUser.batchId, limit: 100 } : "skip"
  );

  const activeLeaderboard = leaderboardMode === "batch" && batchLeaderboard
    ? batchLeaderboard
    : globalLeaderboard;

  const userPosition = activeLeaderboard?.find(
    (entry) => entry.userId === dbUser?._id
  );

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Prepare top performers for podium
  const topPerformers: TopPerformer[] = useMemo(() => {
    return (activeLeaderboard?.slice(0, 3) || []).map((entry) => ({
      rank: entry.rank,
      userId: entry.userId as string,
      userName: entry.userName,
      totalScore: entry.totalScore,
      testsCompleted: entry.testsCompleted,
      avgAccuracy: entry.avgAccuracy,
      tier: entry.tier as Tier,
    }));
  }, [activeLeaderboard]);

  // Prepare data with isCurrentUser flag and filtering
  const filteredData = useMemo(() => {
    const data = (activeLeaderboard || []).map((entry) => ({
      ...entry,
      tier: entry.tier as Tier,
      isCurrentUser: entry.userId === dbUser?._id,
    }));

    if (!searchQuery.trim()) return data;

    return data.filter((entry) =>
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeLeaderboard, dbUser?._id, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  if (!isUserLoaded || (user && dbUser === undefined) || activeLeaderboard === undefined) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            {activeLeaderboard?.length || 0} participants competing
            {leaderboardMode === "batch" && batch && ` in ${batch.name}`}
          </p>
        </div>

        {/* Leaderboard Mode Toggle */}
        {dbUser?.batchId && (
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              <button
                onClick={() => {
                  setLeaderboardMode("global");
                  setCurrentPage(0);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  leaderboardMode === "global"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="h-4 w-4" />
                Global
              </button>
              <button
                onClick={() => {
                  setLeaderboardMode("batch");
                  setCurrentPage(0);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  leaderboardMode === "batch"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                {batch?.name || "Batch"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 Podium */}
      {activeLeaderboard && activeLeaderboard.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <TopPerformers
              performers={topPerformers}
              onUserClick={handleUserClick}
            />
          </CardContent>
        </Card>
      )}

      {/* User's Position Card */}
      {userPosition && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold ${
                  userPosition.rank === 1
                    ? "bg-amber-500/10 text-amber-600"
                    : userPosition.rank === 2
                    ? "bg-slate-400/10 text-slate-500"
                    : userPosition.rank === 3
                    ? "bg-orange-500/10 text-orange-600"
                    : "bg-background text-foreground"
                }`}>
                  #{userPosition.rank}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your Rank</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{userPosition.userName}</p>
                    <TierBadge tier={userPosition.tier as Tier} size="sm" showLabel={false} />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-lg font-semibold tabular-nums">{userPosition.totalScore.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-lg font-semibold tabular-nums">{userPosition.avgAccuracy.toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings Section */}
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="h-8 pl-9 text-sm"
            />
          </div>

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
              onClick={() => setViewMode("card")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "card" ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Rankings */}
        {paginatedData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No students found" : "No rankings available"}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-2">
            {paginatedData.map((entry) => (
              <Card
                key={entry.userId}
                onClick={() => handleUserClick(entry.userId)}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  entry.isCurrentUser ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                  {/* Rank */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                    entry.rank === 1
                      ? "bg-amber-500/10 text-amber-600"
                      : entry.rank === 2
                      ? "bg-slate-400/10 text-slate-500"
                      : entry.rank === 3
                      ? "bg-orange-500/10 text-orange-600"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {entry.rank <= 3 ? <Medal className="h-4 w-4" /> : entry.rank}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{entry.userName}</span>
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {entry.testsCompleted} tests
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {entry.avgAccuracy.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Score & Tier */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{entry.totalScore.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">points</p>
                    </div>
                    <TierBadge tier={entry.tier} size="sm" showLabel={false} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Card View */
          <div className="grid gap-3 sm:grid-cols-2">
            {paginatedData.map((entry) => (
              <Card
                key={entry.userId}
                onClick={() => handleUserClick(entry.userId)}
                className={`cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md ${
                  entry.isCurrentUser ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-4">
                  {/* Header with rank and tier */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      entry.rank === 1
                        ? "bg-amber-500 text-white"
                        : entry.rank === 2
                        ? "bg-slate-400 text-white"
                        : entry.rank === 3
                        ? "bg-orange-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {entry.rank}
                    </div>
                    <TierBadge tier={entry.tier} size="sm" />
                  </div>

                  {/* User info with avatar */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className={`h-12 w-12 border-2 ${
                      entry.rank === 1
                        ? "border-amber-400"
                        : entry.rank === 2
                        ? "border-slate-400"
                        : entry.rank === 3
                        ? "border-orange-400"
                        : "border-border"
                    }`}>
                      <AvatarFallback className={`text-sm font-semibold ${
                        entry.rank === 1
                          ? "bg-amber-500/10 text-amber-600"
                          : entry.rank === 2
                          ? "bg-slate-400/10 text-slate-500"
                          : entry.rank === 3
                          ? "bg-orange-500/10 text-orange-600"
                          : "bg-muted"
                      }`}>
                        {getInitials(entry.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{entry.userName}</span>
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">You</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.testsCompleted} tests completed</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-xl font-bold tabular-nums">{entry.totalScore.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total Score</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold tabular-nums text-emerald-600">{entry.avgAccuracy.toFixed(0)}%</p>
                      <p className="text-[10px] text-muted-foreground">Accuracy</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length)} of {filteredData.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex h-8 min-w-[60px] items-center justify-center text-xs text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
