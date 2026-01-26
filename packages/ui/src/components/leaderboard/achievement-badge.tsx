"use client";

import * as React from "react";
import {
  Award,
  Rocket,
  RefreshCcw,
  Flame,
} from "lucide-react";
import { Badge } from "../badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { cn } from "../../lib/utils";

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  earnedAt: number;
}

type IconComponent = React.ComponentType<{ className?: string }>;

const achievementIcons: Record<string, IconComponent> = {
  Award,
  Rocket,
  RefreshCcw,
  Flame,
};

const achievementColors: Record<string, string> = {
  perfectionist: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "speed-demon": "bg-sky-500/10 text-sky-500 border-sky-500/20",
  "comeback-king": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "streak-master": "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const achievementDescriptions: Record<string, string> = {
  perfectionist: "Scored 100% on a test",
  "speed-demon": "Completed a test in less than 50% of allotted time",
  "comeback-king": "Improved by 30%+ on a retry",
  "streak-master": "Maintained a 7-day activity streak",
};

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function AchievementBadge({
  achievement,
  size = "md",
  showLabel = false,
  className,
}: AchievementBadgeProps) {
  const Icon = achievementIcons[achievement.icon] || Award;
  const colorClass = achievementColors[achievement.id] || "bg-muted text-muted-foreground";

  const sizeClasses = {
    sm: { icon: "h-3 w-3", text: "text-xs", padding: "px-1.5 py-0.5" },
    md: { icon: "h-4 w-4", text: "text-sm", padding: "px-2 py-1" },
    lg: { icon: "h-5 w-5", text: "text-base", padding: "px-3 py-1.5" },
  };

  const sizes = sizeClasses[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "inline-flex items-center gap-1 font-medium transition-all hover:scale-105",
              colorClass,
              sizes.padding,
              sizes.text,
              className
            )}
          >
            <Icon className={sizes.icon} />
            {showLabel && <span>{achievement.name}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="font-medium">{achievement.name}</div>
          <div className="text-xs text-muted-foreground">
            {achievementDescriptions[achievement.id]}
          </div>
          <div className="mt-1 text-xs text-muted-foreground/70">
            Earned {new Date(achievement.earnedAt).toLocaleDateString()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AchievementListProps {
  achievements: Achievement[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AchievementList({
  achievements,
  size = "sm",
  className,
}: AchievementListProps) {
  if (achievements.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          size={size}
        />
      ))}
    </div>
  );
}
