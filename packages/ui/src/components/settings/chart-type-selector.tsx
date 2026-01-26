"use client";

import * as React from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { cn } from "../../lib/utils";

export type ChartType = "heatmap" | "chart";

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (value: ChartType) => void;
  className?: string;
}

export function ChartTypeSelector({
  value,
  onChange,
  className,
}: ChartTypeSelectorProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">Dashboard Preference</CardTitle>
        <CardDescription>
          Choose how to display your activity on the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={value} onValueChange={(v) => onChange(v as ChartType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Activity Heatmap</span>
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Performance Chart</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="mt-3 text-xs text-muted-foreground">
          {value === "heatmap"
            ? "Shows your daily test activity in a GitHub-style heatmap"
            : "Shows your performance trend over your recent tests"}
        </p>
      </CardContent>
    </Card>
  );
}
