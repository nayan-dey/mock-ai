"use client";

import * as React from "react";
import { Trophy, Medal } from "lucide-react";
import { Avatar, AvatarFallback } from "../avatar";
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

const rankStyles = {
  1: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    avatar: "bg-amber-500/10 text-amber-700",
  },
  2: {
    bg: "bg-slate-400/10",
    text: "text-slate-500",
    avatar: "bg-slate-400/10 text-slate-600",
  },
  3: {
    bg: "bg-orange-500/10",
    text: "text-orange-600",
    avatar: "bg-orange-500/10 text-orange-700",
  },
};

interface PerformerCardProps {
  performer: TopPerformer;
  onUserClick?: (userId: string) => void;
}

function PerformerCard({ performer, onUserClick }: PerformerCardProps) {
  const styles = rankStyles[performer.rank as 1 | 2 | 3];

  return (
    <button
      onClick={() => onUserClick?.(performer.userId)}
      className={cn(
        "flex flex-1 flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-muted/50",
        performer.rank === 1 && "order-2",
        performer.rank === 2 && "order-1",
        performer.rank === 3 && "order-3"
      )}
    >
      {/* Rank indicator */}
      <div className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full",
        styles.bg
      )}>
        {performer.rank === 1 ? (
          <Trophy className={cn("h-3.5 w-3.5", styles.text)} />
        ) : (
          <Medal className={cn("h-3.5 w-3.5", styles.text)} />
        )}
      </div>

      {/* Avatar */}
      <Avatar className={cn(
        "h-14 w-14 border border-border",
        performer.rank === 1 && "h-16 w-16"
      )}>
        <AvatarFallback className={cn("font-medium", styles.avatar)}>
          {getInitials(performer.userName)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="text-center">
        <p className="max-w-[100px] truncate text-sm font-medium">
          {performer.userName}
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums">
          {performer.totalScore.toFixed(0)}
        </p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>

      {/* Tier badge */}
      <TierBadge tier={performer.tier} size="sm" showLabel={false} />
    </button>
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
      <div className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        No performers yet. Be the first!
      </div>
    );
  }

  return (
    <div className={cn("flex items-start justify-center", className)}>
      {topThree.map((performer) => (
        <PerformerCard
          key={performer.userId}
          performer={performer}
          onUserClick={onUserClick}
        />
      ))}
    </div>
  );
}
