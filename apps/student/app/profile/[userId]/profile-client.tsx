"use client";

import { useUser } from "@clerk/nextjs";
import { usePreloadedQuery, useQuery, Preloaded } from "convex/react";
import { api } from "@repo/database";
import type { Id } from "@repo/database/dataModel";
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
  AchievementList,
  type Tier,
  type Achievement,
} from "@repo/ui";
import {
  User,
  Calendar,
  Trophy,
  Target,
  FileText,
  Lock,
  EyeOff,
  TrendingUp,
  Award,
} from "lucide-react";
import { useMemo } from "react";

interface ProfileClientProps {
  userId: string;
  preloadedProfile: Preloaded<typeof api.users.getPublicProfile>;
  preloadedAnalytics: Preloaded<typeof api.analytics.getPublicStudentAnalytics>;
  preloadedAchievements: Preloaded<typeof api.analytics.getStudentAchievements>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileClient({
  userId,
  preloadedProfile,
  preloadedAnalytics,
  preloadedAchievements,
}: ProfileClientProps) {
  const { user: currentUser } = useUser();

  const profile = usePreloadedQuery(preloadedProfile);
  const publicAnalytics = usePreloadedQuery(preloadedAnalytics);
  const achievements = usePreloadedQuery(preloadedAchievements);

  // Get current user's db record to check if viewing own profile
  const currentDbUser = useQuery(
    api.users.getByClerkId,
    currentUser?.id ? { clerkId: currentUser.id } : "skip"
  );

  const isOwnProfile = currentDbUser?._id === userId;

  // Generate dates for heatmap (last year)
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

  if (profile === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="py-8 text-center sm:py-12">
          <CardContent>
            <User className="mx-auto mb-4 h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
            <h3 className="mb-2 text-base font-medium sm:text-lg">
              User Not Found
            </h3>
            <p className="text-sm text-muted-foreground">
              This profile doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tier: Tier | null = publicAnalytics?.tier || null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Profile Header Card */}
      <Card className="mb-6 overflow-hidden border-0 shadow-lg">
        <div className="relative">
          {/* Banner gradient */}
          <div className="h-24 bg-gradient-to-br from-primary via-primary/80 to-primary/60 sm:h-32" />

          {/* Profile content */}
          <div className="px-4 pb-6 sm:px-6">
            {/* Avatar - positioned to overlap banner */}
            <div className="-mt-12 mb-4 flex flex-col items-center sm:-mt-14 sm:flex-row sm:items-end sm:gap-5">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl sm:h-28 sm:w-28">
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-2xl font-bold text-white sm:text-3xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>

              <div className="mt-3 flex-1 text-center sm:mb-1 sm:mt-0 sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
                  <h1 className="text-xl font-bold sm:text-2xl">{profile.name}</h1>
                  <div className="flex items-center gap-2">
                    {tier && <TierBadge tier={tier} size="md" />}
                    {isOwnProfile && (
                      <Badge variant="secondary" className="text-xs">
                        Your Profile
                      </Badge>
                    )}
                  </div>
                </div>
                {profile.bio && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {profile.bio}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-start">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats and Activity */}
      {publicAnalytics?.isPrivate ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12">
            <Lock className="mb-4 h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
            <h3 className="mb-2 font-medium">Statistics Hidden</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              This user has chosen to keep their statistics private.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {publicAnalytics?.totalTestsTaken || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Tests Taken</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Target className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 sm:text-3xl">
                    {publicAnalytics?.avgAccuracy || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-500/5 to-purple-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                    <Trophy className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {publicAnalytics?.totalScore?.toFixed(0) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Score</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    #{publicAnalytics?.rank || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">Global Rank</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg">Achievements</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AchievementList
                  achievements={achievements as Achievement[]}
                  size="md"
                />
              </CardContent>
            </Card>
          )}

          {/* Activity Heatmap */}
          {profile.showHeatmap ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Test activity over the past year
                </CardDescription>
              </CardHeader>
              <CardContent>
                {heatmapData ? (
                  <div className="overflow-x-auto">
                    <ActivityHeatmap data={heatmapData} />
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <EyeOff className="mb-3 h-8 w-8 text-muted-foreground" />
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
