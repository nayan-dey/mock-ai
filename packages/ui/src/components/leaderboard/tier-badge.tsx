"use client";

import * as React from "react";
import {
  Star,
  Zap,
  TrendingUp,
  Trophy,
  Crown,
  Flame,
  User,
} from "lucide-react";
import { Badge } from "../badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { cn } from "../../lib/utils";

export interface Tier {
  tier: number;
  name: string;
  icon: string;
}

type IconComponent = React.ComponentType<{ className?: string }>;

const tierIcons: Record<string, IconComponent> = {
  User,
  Star,
  Zap,
  TrendingUp,
  Trophy,
  Crown,
  Flame,
};

const tierColors: Record<number, string> = {
  0: "bg-muted text-muted-foreground",
  1: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  2: "bg-green-500/10 text-green-500 border-green-500/20",
  3: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  4: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  5: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  6: "bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 text-red-500 border-red-500/20",
};

const tierDescriptions: Record<number, string> = {
  0: "Complete your first test to start climbing!",
  1: "1-5 tests completed. Keep going!",
  2: "6-15 tests with >50% accuracy. Great progress!",
  3: "16-30 tests with >60% accuracy. Consistent!",
  4: "31-50 tests with >70% accuracy. Champion!",
  5: "51+ tests with >80% accuracy. Master!",
  6: "100+ tests, >85% accuracy, top 10. Legendary!",
};

interface TierBadgeProps {
  tier: Tier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TierBadge({
  tier,
  size = "md",
  showLabel = true,
  className,
}: TierBadgeProps) {
  const Icon = tierIcons[tier.icon] || User;
  const colorClass = tierColors[tier.tier] || tierColors[0];

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
            <Icon className={cn(sizes.icon, tier.tier === 6 && "animate-pulse")} />
            {showLabel && <span>{tier.name}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="font-medium">{tier.name}</div>
          <div className="text-xs text-muted-foreground">
            {tierDescriptions[tier.tier]}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
