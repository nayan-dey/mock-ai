"use client";

import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  Skeleton,
  Avatar,
  AvatarFallback,
  TierBadge,
  type Tier,
} from "@repo/ui";
import {
  FileText,
  BookOpen,
  Settings,
  ChevronRight,
  Trophy,
  Target,
  LogOut,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

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
      <div className="mb-6 flex flex-col items-center">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="mt-3 h-6 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

const menuItems = [
  { href: "/results", label: "My Results", icon: BarChart3, description: "View test history" },
  { href: "/notes", label: "Notes", icon: BookOpen, description: "Study materials" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Preferences & privacy" },
];

export default function ProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const analytics = useQuery(
    api.analytics.getStudentAnalytics,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  );

  if (!isUserLoaded || (user && dbUser === undefined)) {
    return <ProfileSkeleton />;
  }

  if (!dbUser) {
    return <ProfileSkeleton />;
  }

  const accuracy =
    analytics && analytics.totalCorrect + analytics.totalIncorrect > 0
      ? ((analytics.totalCorrect / (analytics.totalCorrect + analytics.totalIncorrect)) * 100).toFixed(0)
      : "0";

  const tier: Tier | null = analytics?.tier || null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Profile Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-border">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={dbUser.name} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {getInitials(dbUser.name)}
              </AvatarFallback>
            )}
          </Avatar>
          {tier && (
            <div className="absolute -bottom-1 -right-1">
              <TierBadge tier={tier} size="sm" showLabel={false} />
            </div>
          )}
        </div>
        <h1 className="mt-3 text-xl font-semibold">{dbUser.name}</h1>
        <p className="text-sm text-muted-foreground">{dbUser.email}</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-lg font-semibold tabular-nums">{analytics?.totalTestsTaken || 0}</p>
          <p className="text-[10px] text-muted-foreground">Tests</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-lg font-semibold tabular-nums text-emerald-600">{analytics?.totalCorrect || 0}</p>
          <p className="text-[10px] text-muted-foreground">Correct</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-lg font-semibold tabular-nums">{accuracy}%</p>
          <p className="text-[10px] text-muted-foreground">Accuracy</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="transition-colors hover:bg-muted/50 my-3">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Sign Out */}
      <div className="mt-6">
        <SignOutButton>
          <Card className="cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Sign Out</p>
                <p className="text-xs text-muted-foreground">Log out of your account</p>
              </div>
            </CardContent>
          </Card>
        </SignOutButton>
      </div>

      {/* View Public Profile Link */}
      <div className="mt-4 text-center">
        <Link
          href={`/profile/${dbUser._id}`}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          View public profile
        </Link>
      </div>
    </div>
  );
}
