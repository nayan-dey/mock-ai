"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";

interface ActivityData {
  date: string;
  count: number;
  totalScore?: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  className?: string;
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-primary/20";
  if (count === 2) return "bg-primary/40";
  if (count === 3) return "bg-primary/60";
  if (count >= 4) return "bg-primary/80";
  return "bg-primary";
}

function getMonthLabels(): { month: string; index: number }[] {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const today = new Date();
  const startMonth = (today.getMonth() + 1) % 12; // Start from next month of last year

  const labels: { month: string; index: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const monthIndex = (startMonth + i) % 12;
    labels.push({ month: months[monthIndex], index: i });
  }

  return labels;
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  // Create a map for quick lookup
  const activityMap = React.useMemo(() => {
    const map = new Map<string, ActivityData>();
    data.forEach((item) => map.set(item.date, item));
    return map;
  }, [data]);

  // Generate the last 52 weeks of dates
  const weeks = React.useMemo(() => {
    const result: (string | null)[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 52 weeks ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364 - startDate.getDay());

    for (let week = 0; week < 53; week++) {
      const weekDays: (string | null)[] = [];
      for (let day = 0; day < 7; day++) {
        const current = new Date(startDate);
        current.setDate(current.getDate() + week * 7 + day);

        if (current <= today) {
          const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
          weekDays.push(dateKey);
        } else {
          weekDays.push(null);
        }
      }
      result.push(weekDays);
    }

    return result;
  }, []);

  const monthLabels = getMonthLabels();

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const totalContributions = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <TooltipProvider>
      <div className={cn("w-full", className)}>
        <div className="inline-block min-w-max">
          {/* Month labels - evenly spaced across the grid width */}
          <div className="mb-2 flex text-xs text-muted-foreground">
            <div className="w-7 shrink-0" />
            {/* Grid width: 53 cells * 11px + 52 gaps * 2px = 687px */}
            <div className="grid grid-cols-12" style={{ width: '687px' }}>
              {monthLabels.map(({ month, index }) => (
                <span
                  key={`${month}-${index}`}
                  className="text-[10px]"
                >
                  {month}
                </span>
              ))}
            </div>
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="mr-1.5 flex w-5 flex-col justify-between py-0.5 text-[10px] text-muted-foreground">
              {dayLabels.map((day, index) => (
                <span key={day} className={index % 2 === 1 ? "opacity-100" : "opacity-0"}>
                  {day.slice(0, 1)}
                </span>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((dateStr, dayIndex) => {
                    if (dateStr === null) {
                      return (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="h-[11px] w-[11px]"
                        />
                      );
                    }

                    const activity = activityMap.get(dateStr);
                    const count = activity?.count || 0;
                    const totalScore = activity?.totalScore || 0;

                    return (
                      <Tooltip key={dateStr}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-[11px] w-[11px] rounded-sm transition-colors hover:ring-1 hover:ring-foreground/50",
                              getIntensityClass(count)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="font-medium">
                            {count === 0
                              ? "No tests"
                              : `${count} test${count > 1 ? "s" : ""}`}
                            {count > 0 && totalScore > 0 && (
                              <span className="ml-1 text-muted-foreground">
                                ({totalScore} pts)
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(dateStr).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{totalContributions} tests in the last year</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className={cn("h-[11px] w-[11px] rounded-sm", "bg-muted")} />
              <div className={cn("h-[11px] w-[11px] rounded-sm", "bg-primary/20")} />
              <div className={cn("h-[11px] w-[11px] rounded-sm", "bg-primary/40")} />
              <div className={cn("h-[11px] w-[11px] rounded-sm", "bg-primary/60")} />
              <div className={cn("h-[11px] w-[11px] rounded-sm", "bg-primary/80")} />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
