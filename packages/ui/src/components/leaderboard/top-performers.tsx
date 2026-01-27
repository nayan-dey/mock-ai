"use client";

import * as React from "react";
import { Trophy, Medal, Sparkles } from "lucide-react";
import { motion } from "motion/react";
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
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
    glowColor: "rgba(245,158,11,0.6)",
    particleColor: "#f59e0b",
  },
  2: {
    bg: "bg-slate-400/10",
    text: "text-slate-500",
    avatar: "bg-slate-400/10 text-slate-600",
    glow: "shadow-[0_0_15px_rgba(148,163,184,0.4)]",
    glowColor: "rgba(148,163,184,0.5)",
    particleColor: "#94a3b8",
  },
  3: {
    bg: "bg-orange-500/10",
    text: "text-orange-600",
    avatar: "bg-orange-500/10 text-orange-700",
    glow: "shadow-[0_0_12px_rgba(249,115,22,0.35)]",
    glowColor: "rgba(249,115,22,0.5)",
    particleColor: "#f97316",
  },
};

// Sparkle particle component for dramatic effect
function SparkleParticle({ delay, color, size = 4 }: { delay: number; color: string; size?: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        x: [0, (Math.random() - 0.5) * 40],
        y: [0, (Math.random() - 0.5) * 40],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
        ease: "easeOut",
      }}
    />
  );
}

interface PerformerCardProps {
  performer: TopPerformer;
  onUserClick?: (userId: string) => void;
}

function PerformerCard({ performer, onUserClick }: PerformerCardProps) {
  const styles = rankStyles[performer.rank as 1 | 2 | 3];
  const isFirst = performer.rank === 1;

  return (
    <motion.button
      onClick={() => onUserClick?.(performer.userId)}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: performer.rank === 1 ? 0.2 : performer.rank === 2 ? 0 : 0.4,
        ease: "easeOut",
      }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-muted/50",
        performer.rank === 1 && "order-2",
        performer.rank === 2 && "order-1",
        performer.rank === 3 && "order-3"
      )}
    >
      {/* Sparkle particles for top 3 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(isFirst ? 6 : 4)].map((_, i) => (
          <SparkleParticle
            key={i}
            delay={i * 0.3}
            color={styles.particleColor}
            size={isFirst ? 5 : 3}
          />
        ))}
      </div>

      {/* Rank indicator with bounce animation */}
      <motion.div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full",
          styles.bg
        )}
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {performer.rank === 1 ? (
          <Trophy className={cn("h-3.5 w-3.5", styles.text)} />
        ) : (
          <Medal className={cn("h-3.5 w-3.5", styles.text)} />
        )}
      </motion.div>

      {/* Avatar with glow effect */}
      <motion.div
        className="relative"
        animate={{
          boxShadow: [
            `0 0 ${isFirst ? 20 : 12}px ${styles.glowColor}`,
            `0 0 ${isFirst ? 30 : 18}px ${styles.glowColor}`,
            `0 0 ${isFirst ? 20 : 12}px ${styles.glowColor}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ borderRadius: "50%" }}
      >
        <Avatar className={cn(
          "border border-border",
          performer.rank === 1 ? "h-16 w-16" : "h-14 w-14"
        )}>
          <AvatarFallback className={cn("font-medium", styles.avatar)}>
            {getInitials(performer.userName)}
          </AvatarFallback>
        </Avatar>

        {/* Sparkle icon for first place */}
        {isFirst && (
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
          </motion.div>
        )}
      </motion.div>

      {/* Info */}
      <div className="text-center">
        <p className="max-w-[100px] truncate text-sm font-medium">
          {performer.userName}
        </p>
        <motion.p
          className="mt-0.5 text-lg font-semibold tabular-nums"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {performer.totalScore.toFixed(0)}
        </motion.p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>

      {/* Tier badge */}
      <TierBadge tier={performer.tier} size="sm" showLabel={false} />
    </motion.button>
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
