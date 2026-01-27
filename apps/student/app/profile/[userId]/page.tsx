"use client";

import { useParams } from "next/navigation";
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
  Avatar,
  AvatarFallback,
  Badge,
  ActivityHeatmap,
  TierBadge,
  type Tier,
} from "@repo/ui";
import {
  User,
  Calendar,
  Trophy,
  Lock,
  EyeOff,
  Award,
  ArrowLeft,
  Users,
  Ban,
} from "lucide-react";
import { useMemo } from "react";
import type { GenericId } from "convex/values";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Id<T extends string> = GenericId<T>;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="mb-6 flex flex-col items-center">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="mt-4 h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Skeleton className="mb-4 h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function getTierGradient(tier: Tier | null): string {
  if (!tier) return "bg-gradient-to-br from-gray-300 to-gray-400";

  switch (tier.tier) {
    case 6: // Legend
      return "bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500";
    case 5: // Subject Master
      return "bg-gradient-to-br from-purple-400 to-purple-600";
    case 4: // Test Champion
      return "bg-gradient-to-br from-orange-400 to-orange-500";
    case 3: // Consistent Performer
      return "bg-gradient-to-br from-yellow-400 to-yellow-500";
    case 2: // Quick Learner
      return "bg-gradient-to-br from-green-400 to-green-500";
    case 1: // Rising Star
      return "bg-gradient-to-br from-blue-400 to-blue-500";
    default: // Newcomer
      return "bg-gradient-to-br from-gray-300 to-gray-400";
  }
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser } = useUser();
  const router = useRouter();

  const profile = useQuery(api.users.getPublicProfile, {
    userId: userId as Id<"users">,
  });

  const publicAnalytics = useQuery(api.analytics.getPublicStudentAnalytics, {
    userId: userId as Id<"users">,
  });

  const achievements = useQuery(api.analytics.getStudentAchievements, {
    userId: userId as Id<"users">,
  });

  const currentDbUser = useQuery(
    api.users.getByClerkId,
    currentUser?.id ? { clerkId: currentUser.id } : "skip"
  );

  // Get top performers for the avatar group
  const globalLeaderboard = useQuery(api.analytics.getGlobalLeaderboard, {
    limit: 10,
  });

  const isOwnProfile = currentDbUser?._id === userId;

  const heatmapDates = useMemo(() => {
    const today = new Date();
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    return {
      startDate: yearAgo.getTime(),
      endDate: today.getTime(),
    };
  }, []);

  const heatmapData = useQuery(
    api.analytics.getActivityHeatmapData,
    profile?.showHeatmap
      ? {
          userId: userId as Id<"users">,
          startDate: heatmapDates.startDate,
          endDate: heatmapDates.endDate,
        }
      : "skip"
  );

  // Get nearby competitors (exclude current profile user)
  const nearbyCompetitors = useMemo(() => {
    if (!globalLeaderboard || !publicAnalytics?.rank) return [];
    return globalLeaderboard
      .filter((entry) => entry.userId !== userId)
      .slice(0, 5);
  }, [globalLeaderboard, publicAnalytics?.rank, userId]);

  if (profile === undefined) {
    return <ProfileSkeleton />;
  }

  if (profile === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">User Not Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This profile doesn't exist or has been removed.
            </p>
            <Link href="/leaderboard" className="mt-4 text-sm text-primary hover:underline">
              Back to Leaderboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle suspended user
  if (profile.isSuspended) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link
          href="/leaderboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rankings
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-950/30">
              <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium">Account Suspended</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground max-w-xs">
              This user's account has been suspended and their profile is not available.
            </p>
            <Link href="/leaderboard" className="mt-4 text-sm text-primary hover:underline">
              Back to Leaderboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tier: Tier | null = publicAnalytics?.tier || null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Back button */}
      <Link
        href="/leaderboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Rankings
      </Link>

      {/* Profile Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        {/* Avatar with tier ring */}
        <div className="relative">
          <div className={`rounded-full p-1 ${getTierGradient(tier)}`}>
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarFallback className="bg-muted text-2xl font-semibold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <h1 className="mt-4 text-xl font-semibold">{profile.name}</h1>
        {profile.bio && (
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">{profile.bio}</p>
        )}

        {/* Age and Batch */}
        {(profile.age || profile.batchName) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {profile.batchName && (
              <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {profile.batchName}
              </div>
            )}
            {profile.age && (
              <div className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {profile.age} years old
              </div>
            )}
          </div>
        )}

        {/* Tier & badges */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {tier && <TierBadge tier={tier} size="md" />}
          {isOwnProfile && (
            <Badge variant="secondary" className="gap-1">
              Your Profile
            </Badge>
          )}
          {publicAnalytics?.rank && (
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3" />
              Rank #{publicAnalytics.rank}
            </Badge>
          )}
        </div>

        {/* Member since */}
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Joined {new Date(profile.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats and Activity */}
      {publicAnalytics?.isPrivate ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">Statistics Hidden</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
              This user has chosen to keep their statistics private.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Stats Card */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {publicAnalytics?.totalTestsTaken || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Tests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600">
                    {publicAnalytics?.avgAccuracy || 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Accuracy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {publicAnalytics?.totalScore?.toFixed(0) || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    #{publicAnalytics?.rank || "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Competitors - Avatar Group */}
          {nearbyCompetitors.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Top Competitors</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2 grayscale [&>*]:ring-2 [&>*]:ring-background">
                    {nearbyCompetitors.slice(0, 3).map((competitor) => (
                      <Avatar
                        key={competitor.userId}
                        className="h-10 w-10 cursor-pointer"
                        onClick={() => router.push(`/profile/${competitor.userId}`)}
                      >
                        <AvatarFallback className="bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {nearbyCompetitors.length > 3 && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        +{nearbyCompetitors.length - 3}
                      </div>
                    )}
                  </div>
                  <Link
                    href="/leaderboard"
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {achievements.length} unlocked
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex -space-x-2 [&>*]:ring-2 [&>*]:ring-background">
                  {achievements.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10"
                    >
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                  ))}
                  {achievements.length > 3 && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      +{achievements.length - 3}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Heatmap */}
          {profile.showHeatmap ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activity</CardTitle>
                <CardDescription className="text-xs">
                  Test activity over the past year
                </CardDescription>
              </CardHeader>
              <CardContent>
                {heatmapData ? (
                  <div className="overflow-x-auto -mx-2">
                    <div className="min-w-[600px] px-2">
                      <ActivityHeatmap data={heatmapData} />
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-32 w-full" />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <EyeOff className="mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Activity heatmap is hidden
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
