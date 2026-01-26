"use client";

import * as React from "react";
import { Card, CardContent } from "./card";
import { cn } from "../lib/utils";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
  };
  color?: "primary" | "success" | "warning" | "destructive" | "blue" | "purple";
  className?: string;
}

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
  },
  destructive: {
    bg: "bg-red-500/10",
    text: "text-red-500",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-500",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "primary",
  className,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <Card
      className={cn(
        "border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              {label}
            </p>
            <p className="text-lg font-bold sm:text-2xl">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs",
                  trend.value >= 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              colors.bg
            )}
          >
            <Icon className={cn("h-5 w-5", colors.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
