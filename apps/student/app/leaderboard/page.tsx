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

const PAGE_SIZE = 15;

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

  if (!isUserLoaded || (user && dbUser === undefined)) {
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
      <Card className="mb-4 sm:mb-6 border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="border-b bg-gradient-to-r from-yellow-500/5 via-gray-400/5 to-orange-500/5 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Top Performers</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Hall of Fame</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-6 sm:py-8">
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
        <Card className="mb-4 sm:mb-6 overflow-hidden border-2 border-primary/20">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <CardContent className="p-0">
              <div className="flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
                {/* Rank Display */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl text-lg sm:text-xl font-bold ${
                    userPosition.rank === 1
                      ? "bg-yellow-500/20 text-yellow-600 ring-4 ring-yellow-500/10"
                      : userPosition.rank === 2
                      ? "bg-gray-400/20 text-gray-500 ring-4 ring-gray-400/10"
                      : userPosition.rank === 3
                      ? "bg-orange-500/20 text-orange-600 ring-4 ring-orange-500/10"
                      : "bg-primary/10 text-primary ring-4 ring-primary/10"
                  }`}>
                    #{userPosition.rank}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Your Position</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg sm:text-xl font-bold">
                        {userPosition.userName}
                      </p>
                      <TierBadge tier={userPosition.tier as Tier} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Stats - Horizontal scroll on mobile */}
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex gap-4 sm:gap-6 min-w-max">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-background p-1.5 sm:p-2">
                        <Medal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-base sm:text-lg font-bold">
                          {userPosition.totalScore.toFixed(1)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Total Score</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-background p-1.5 sm:p-2">
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-base sm:text-lg font-bold">
                          {userPosition.testsCompleted}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Tests</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-background p-1.5 sm:p-2">
                        <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-base sm:text-lg font-bold">
                          {userPosition.avgAccuracy.toFixed(0)}%
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Accuracy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card className="border-2 border-transparent transition-all hover:border-primary/20">
        <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10">
                <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Global Rankings</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {globalLeaderboard?.length || 0} participants
                </CardDescription>
              </div>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-16 whitespace-nowrap py-3 pl-4 sm:pl-6">Rank</TableHead>
                <TableHead className="whitespace-nowrap py-3">Student</TableHead>
                <TableHead className="whitespace-nowrap py-3 text-right">Score</TableHead>
                <TableHead className="whitespace-nowrap py-3 text-right">Tests</TableHead>
                <TableHead className="whitespace-nowrap py-3 text-right">Accuracy</TableHead>
                <TableHead className="whitespace-nowrap py-3 pr-4 text-right sm:pr-6">Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((entry) => (
                  <TableRow
                    key={entry.userId}
                    onClick={() => handleUserClick(entry.userId)}
                    className={`cursor-pointer transition-colors ${
                      entry.isCurrentUser ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  >
                    <TableCell className="py-3 pl-4 sm:pl-6">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                        entry.rank === 1
                          ? "bg-yellow-500/20 text-yellow-600"
                          : entry.rank === 2
                          ? "bg-gray-400/20 text-gray-500"
                          : entry.rank === 3
                          ? "bg-orange-500/20 text-orange-600"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {entry.rank <= 3 ? <Medal className="h-4 w-4" /> : `#${entry.rank}`}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium whitespace-nowrap">{entry.userName}</span>
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">You</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="font-bold">{entry.totalScore.toFixed(0)}</span>
                    </TableCell>
                    <TableCell className="py-3 text-right text-muted-foreground">
                      {entry.testsCompleted}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Badge variant={entry.avgAccuracy >= 60 ? "success" : "secondary"} className="font-medium">
                        {entry.avgAccuracy.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 pr-4 text-right sm:pr-6">
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
