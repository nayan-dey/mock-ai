"use client";

import * as React from "react";
import { Trophy, Medal } from "lucide-react";
import { Avatar, AvatarFallback } from "../avatar";
import { Card } from "../card";
import { TierBadge, type Tier } from "./tier-badge";
import { cn } from "../../lib/utils";

export interface TopPerformer {
  rank: number;
  userId: string;
  userName: string;
  totalScore: number;
  testsCompleted: number;
  avgAccuracy: number;
  tier: Tier;
}

interface TopPerformersProps {
  performers: TopPerformer[];
  onUserClick?: (userId: string) => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const podiumColors = {
  1: {
    gradient: "from-yellow-400 via-yellow-500 to-amber-600",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-600",
    shadow: "shadow-yellow-500/20",
  },
  2: {
    gradient: "from-gray-300 via-gray-400 to-gray-500",
    bg: "bg-gray-500/10",
    border: "border-gray-400/30",
    text: "text-gray-500",
    shadow: "shadow-gray-400/20",
  },
  3: {
    gradient: "from-orange-400 via-orange-500 to-orange-700",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-600",
    shadow: "shadow-orange-500/20",
  },
};

const podiumHeights = {
  1: "h-32",
  2: "h-24",
  3: "h-20",
};

interface PodiumCardProps {
  performer: TopPerformer;
  onUserClick?: (userId: string) => void;
}

function PodiumCard({ performer, onUserClick }: PodiumCardProps) {
  const colors = podiumColors[performer.rank as 1 | 2 | 3];
  const height = podiumHeights[performer.rank as 1 | 2 | 3];

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        performer.rank === 1 ? "order-2" : performer.rank === 2 ? "order-1" : "order-3"
      )}
    >
      {/* Avatar with gradient border */}
      <button
        onClick={() => onUserClick?.(performer.userId)}
        className="group relative mb-2"
      >
        <div
          className={cn(
            "absolute -inset-1 rounded-full bg-gradient-to-br opacity-75 blur-sm transition-all group-hover:opacity-100 group-hover:blur",
            colors.gradient
          )}
        />
        <Avatar
          className={cn(
            "relative h-16 w-16 border-2 transition-transform group-hover:scale-105",
            performer.rank === 1 && "h-20 w-20",
            colors.border
          )}
        >
          <AvatarFallback
            className={cn(
              "bg-gradient-to-br text-white font-bold",
              colors.gradient,
              performer.rank === 1 ? "text-lg" : "text-base"
            )}
          >
            {getInitials(performer.userName)}
          </AvatarFallback>
        </Avatar>

        {/* Medal/Trophy badge */}
        <div
          className={cn(
            "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-lg",
            colors.border,
            "border"
          )}
        >
          {performer.rank === 1 ? (
            <Trophy className={cn("h-3.5 w-3.5", colors.text)} />
          ) : (
            <Medal className={cn("h-3.5 w-3.5", colors.text)} />
          )}
        </div>
      </button>

      {/* Name */}
      <button
        onClick={() => onUserClick?.(performer.userId)}
        className="max-w-[100px] truncate text-sm font-medium hover:underline"
      >
        {performer.userName}
      </button>

      {/* Tier badge */}
      <TierBadge tier={performer.tier} size="sm" showLabel={false} className="mt-1" />

      {/* Podium */}
      <Card
        className={cn(
          "mt-2 flex w-24 flex-col items-center justify-center rounded-t-lg border-2 transition-all",
          height,
          colors.bg,
          colors.border,
          `shadow-lg ${colors.shadow}`
        )}
      >
        <span className={cn("text-2xl font-bold", colors.text)}>
          #{performer.rank}
        </span>
        <span className="text-lg font-semibold">{performer.totalScore}</span>
        <span className="text-xs text-muted-foreground">points</span>
      </Card>
    </div>
  );
}

export function TopPerformers({
  performers,
  onUserClick,
  className,
}: TopPerformersProps) {
  // Only show top 3
  const topThree = performers.slice(0, 3);

  if (topThree.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground", className)}>
        No performers yet. Be the first!
      </div>
    );
  }

  return (
    <div className={cn("flex items-end justify-center gap-4 pb-4", className)}>
      {topThree.map((performer) => (
        <PodiumCard
          key={performer.userId}
          performer={performer}
          onUserClick={onUserClick}
        />
      ))}
    </div>
  );
}
