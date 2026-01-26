"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { Trophy, Medal } from "lucide-react";

interface RankBadgeProps {
  rank: number;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function RankBadge({ rank, className, size = "default" }: RankBadgeProps) {
  const sizeClasses = {
    sm: "h-5 w-5 text-xs",
    default: "h-7 w-7 text-sm",
    lg: "h-9 w-9 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (rank > 3) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-full font-medium text-muted-foreground",
          sizeClasses[size],
          className
        )}
      >
        {rank}
      </span>
    );
  }

  const styles = {
    1: {
      bg: "bg-gradient-to-br from-yellow-400/20 to-yellow-600/20",
      text: "text-yellow-600 dark:text-yellow-500",
      ring: "ring-2 ring-yellow-500/20",
    },
    2: {
      bg: "bg-gradient-to-br from-gray-300/20 to-gray-500/20",
      text: "text-gray-500 dark:text-gray-400",
      ring: "ring-2 ring-gray-400/20",
    },
    3: {
      bg: "bg-gradient-to-br from-orange-400/20 to-orange-600/20",
      text: "text-orange-600 dark:text-orange-500",
      ring: "ring-2 ring-orange-500/20",
    },
  };

  const style = styles[rank as 1 | 2 | 3];

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full",
        style.bg,
        style.text,
        style.ring,
        sizeClasses[size],
        className
      )}
    >
      {rank === 1 ? (
        <Trophy className={iconSizes[size]} />
      ) : (
        <Medal className={iconSizes[size]} />
      )}
    </span>
  );
}
