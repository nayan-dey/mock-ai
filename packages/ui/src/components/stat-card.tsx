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
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs",
                  trend.value >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
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
