"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Clock } from "lucide-react";

interface TestTimerProps {
  durationMinutes: number;
  startTime: number;
  onTimeUp: () => void;
  className?: string;
}

export function TestTimer({
  durationMinutes,
  startTime,
  onTimeUp,
  className,
}: TestTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState<number>(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const total = durationMinutes * 60;
    return Math.max(0, total - elapsed);
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const total = durationMinutes * 60;
      const remaining = Math.max(0, total - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [durationMinutes, startTime, onTimeUp]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const isLowTime = timeLeft <= 300; // 5 minutes
  const isCritical = timeLeft <= 60; // 1 minute

  const formatTime = (value: number) => value.toString().padStart(2, "0");

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-lg font-semibold",
        isCritical
          ? "animate-pulse border-destructive bg-destructive/10 text-destructive"
          : isLowTime
            ? "border-warning bg-warning/10 text-warning"
            : "border-border bg-background",
        className
      )}
    >
      <Clock className="h-5 w-5" />
      <span>
        {hours > 0 && `${formatTime(hours)}:`}
        {formatTime(minutes)}:{formatTime(seconds)}
      </span>
    </div>
  );
}
