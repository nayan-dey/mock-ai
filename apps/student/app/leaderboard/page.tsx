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
  PageHeader,
  TierBadge,
  TopPerformers,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Input,
  type Tier,
  type TopPerformer,
} from "@repo/ui";
import { Trophy, Medal, TrendingUp, Target, Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>
      <Skeleton className="mb-6 h-64 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
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

const PAGE_SIZE = 5;

export default function LeaderboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const globalLeaderboard = useQuery(api.analytics.getGlobalLeaderboard, {
    limit: 100,
  });

  const userPosition = globalLeaderboard?.find(
    (entry) => entry.userId === dbUser?._id
  );

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Prepare top performers for podium
  const topPerformers: TopPerformer[] = useMemo(() => {
    return (globalLeaderboard?.slice(0, 3) || []).map((entry) => ({
      rank: entry.rank,
      userId: entry.userId as string,
      userName: entry.userName,
      totalScore: entry.totalScore,
      testsCompleted: entry.testsCompleted,
      avgAccuracy: entry.avgAccuracy,
      tier: entry.tier as Tier,
    }));
  }, [globalLeaderboard]);

  // Prepare data with isCurrentUser flag and filtering
  const filteredData = useMemo(() => {
    const data = (globalLeaderboard || []).map((entry) => ({
      ...entry,
      tier: entry.tier as Tier,
      isCurrentUser: entry.userId === dbUser?._id,
    }));

    if (!searchQuery.trim()) return data;

    return data.filter((entry) =>
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [globalLeaderboard, dbUser?._id, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  if (!isUserLoaded || (user && dbUser === undefined) || globalLeaderboard === undefined) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <PageHeader
        title="Leaderboard"
        description="Top performers across all tests"
      />

      {/* Top 3 Podium */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Trophy className="h-4 w-4 text-amber-600" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">Top Performers</CardTitle>
              <CardDescription className="text-xs">Hall of Fame</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {globalLeaderboard && globalLeaderboard.length > 0 ? (
            <TopPerformers
              performers={topPerformers}
              onUserClick={handleUserClick}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="mb-3 h-10 w-10 opacity-50" />
              <p>No performers yet. Be the first!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Position Card */}
      {userPosition && (
        <Card className="mb-6 bg-muted/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Rank Display */}
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-semibold ${
                  userPosition.rank === 1
                    ? "bg-amber-500/10 text-amber-600"
                    : userPosition.rank === 2
                    ? "bg-slate-400/10 text-slate-500"
                    : userPosition.rank === 3
                    ? "bg-orange-500/10 text-orange-600"
                    : "bg-primary/10 text-primary"
                }`}>
                  #{userPosition.rank}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Your Position</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">
                      {userPosition.userName}
                    </p>
                    <TierBadge tier={userPosition.tier as Tier} size="sm" />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <div className="space-y-0.5">
                  <p className="text-lg font-semibold tabular-nums">
                    {userPosition.totalScore.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-semibold tabular-nums">
                    {userPosition.testsCompleted}
                  </p>
                  <p className="text-xs text-muted-foreground">Tests</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-semibold tabular-nums">
                    {userPosition.avgAccuracy.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Global Rankings</CardTitle>
              <CardDescription className="text-xs">
                {globalLeaderboard?.length || 0} participants
              </CardDescription>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
                className="h-9 w-full pl-9 sm:w-64"
              />
            </div>
          </div>
        </CardHeader>

        {/* Table - Full width horizontal scroll */}
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 whitespace-nowrap py-3 pl-6">Rank</TableHead>
                <TableHead className="whitespace-nowrap py-3">Student</TableHead>
                <TableHead className="whitespace-nowrap py-3 text-right">Score</TableHead>
                <TableHead className="whitespace-nowrap py-3 text-right">Tests</TableHead>
                <TableHead className="whitespace-nowrap py-3 text-right">Accuracy</TableHead>
                <TableHead className="whitespace-nowrap py-3 pr-6 text-right">Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((entry) => (
                  <TableRow
                    key={entry.userId}
                    onClick={() => handleUserClick(entry.userId)}
                    className={`cursor-pointer ${
                      entry.isCurrentUser ? "bg-muted/50" : ""
                    }`}
                  >
                    <TableCell className="py-3 pl-6">
                      <div className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${
                        entry.rank === 1
                          ? "bg-amber-500/10 text-amber-600"
                          : entry.rank === 2
                          ? "bg-slate-400/10 text-slate-500"
                          : entry.rank === 3
                          ? "bg-orange-500/10 text-orange-600"
                          : "text-muted-foreground"
                      }`}>
                        {entry.rank <= 3 ? <Medal className="h-3.5 w-3.5" /> : entry.rank}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.userName}</span>
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px]">You</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium tabular-nums">
                      {entry.totalScore.toFixed(0)}
                    </TableCell>
                    <TableCell className="py-3 text-right text-muted-foreground tabular-nums">
                      {entry.testsCompleted}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Badge variant={entry.avgAccuracy >= 60 ? "success" : "secondary"}>
                        {entry.avgAccuracy.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 pr-6 text-right">
                      <TierBadge tier={entry.tier} size="sm" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {searchQuery ? "No students found matching your search." : "No rankings available yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">
              Showing {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length)} of {filteredData.length}
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
              <span className="flex h-8 min-w-[80px] items-center justify-center text-sm">
                Page {currentPage + 1} of {totalPages}
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
      </Card>
    </div>
  );
}
