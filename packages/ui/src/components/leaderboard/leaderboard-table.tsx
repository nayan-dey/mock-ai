"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import { RankBadge } from "./rank-badge";
import { cn } from "../../lib/utils";
import { formatDuration } from "../../lib/utils";

export interface LeaderboardEntry {
  rank: number;
  userName: string;
  score: number;
  correct?: number;
  timeTaken?: number;
  totalScore?: number;
  testsCompleted?: number;
  avgAccuracy?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  variant?: "test" | "global";
  currentUserId?: string;
  className?: string;
}

export function LeaderboardTable({
  entries,
  variant = "test",
  className,
}: LeaderboardTableProps) {
  const isGlobal = variant === "global";

  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-16 py-4 pl-6">Rank</TableHead>
            <TableHead className="py-4">Name</TableHead>
            {isGlobal ? (
              <>
                <TableHead className="py-4 text-right">Total Score</TableHead>
                <TableHead className="py-4 text-right">Tests</TableHead>
                <TableHead className="py-4 pr-6 text-right">Accuracy</TableHead>
              </>
            ) : (
              <>
                <TableHead className="py-4 text-right">Score</TableHead>
                <TableHead className="py-4 text-right">Correct</TableHead>
                <TableHead className="py-4 pr-6 text-right">Time</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow
              key={`${entry.rank}-${entry.userName}`}
              className={cn(
                "transition-colors",
                entry.isCurrentUser && "bg-primary/5 hover:bg-primary/10",
                entry.rank <= 3 && !entry.isCurrentUser && "bg-muted/20"
              )}
            >
              <TableCell className="py-4 pl-6">
                <RankBadge rank={entry.rank} />
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium",
                    entry.rank <= 3 && "font-semibold"
                  )}>
                    {entry.userName}
                  </span>
                  {entry.isCurrentUser && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      You
                    </span>
                  )}
                </div>
              </TableCell>
              {isGlobal ? (
                <>
                  <TableCell className="py-4 text-right">
                    <span className="font-serif font-semibold">
                      {entry.totalScore?.toFixed(1) ?? entry.score.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right text-muted-foreground">
                    {entry.testsCompleted ?? 0}
                  </TableCell>
                  <TableCell className="py-4 pr-6 text-right">
                    <span className={cn(
                      "font-medium",
                      (entry.avgAccuracy ?? 0) >= 70 && "text-success",
                      (entry.avgAccuracy ?? 0) < 50 && "text-destructive"
                    )}>
                      {entry.avgAccuracy?.toFixed(0) ?? 0}%
                    </span>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="py-4 text-right">
                    <span className="font-serif font-semibold">
                      {entry.score.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right text-muted-foreground">
                    {entry.correct ?? 0}
                  </TableCell>
                  <TableCell className="py-4 pr-6 text-right text-sm text-muted-foreground">
                    {entry.timeTaken ? formatDuration(entry.timeTaken) : "-"}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {entries.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-12 text-center text-muted-foreground"
              >
                No rankings available yet. Be the first to complete a test!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
