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
} from "lucide-react";
import { useMemo } from "react";
import type { GenericId } from "convex/values";

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
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser } = useUser();

  const profile = useQuery(api.users.getPublicProfile, {
    userId: userId as Id<"users">,
  });

  const publicAnalytics = useQuery(api.analytics.getPublicStudentAnalytics, {
    userId: userId as Id<"users">,
  });

  const achievements = useQuery(api.analytics.getStudentAchievements, {
    userId: userId as Id<"users">,
  });

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

  // Loading state
  if (profile === undefined) {
    return <ProfileSkeleton />;
  }

  // User not found
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
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
                <h1 className="text-xl font-semibold">{profile.name}</h1>
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
        </CardContent>
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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tests Taken</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {publicAnalytics?.totalTestsTaken || 0}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-semibold tabular-nums text-emerald-600">
                      {publicAnalytics?.avgAccuracy || 0}%
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Target className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Score</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {publicAnalytics?.totalScore?.toFixed(0) || 0}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Trophy className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Global Rank</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      #{publicAnalytics?.rank || "-"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <CardDescription className="text-xs">
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
              <CardHeader>
                <CardTitle className="text-sm font-medium">Activity</CardTitle>
                <CardDescription className="text-xs">
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
              <CardContent className="flex flex-col items-center justify-center py-12">
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
