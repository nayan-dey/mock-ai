"use client";

import * as React from "react";
import { Eye, BarChart3, Trophy } from "lucide-react";
import { Switch } from "../switch";
import { Label } from "../label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { cn } from "../../lib/utils";

export interface PrivacySettings {
  showHeatmap: boolean;
  showStats: boolean;
  showOnLeaderboard: boolean;
}

interface PrivacyTogglesProps {
  settings: PrivacySettings;
  onSettingsChange: (settings: PrivacySettings) => void;
  className?: string;
}

const privacyOptions = [
  {
    key: "showHeatmap" as const,
    label: "Show Activity Heatmap",
    description: "Display your test activity heatmap on your public profile",
    icon: BarChart3,
  },
  {
    key: "showStats" as const,
    label: "Show Statistics",
    description: "Display your test statistics on your public profile",
    icon: Eye,
  },
  {
    key: "showOnLeaderboard" as const,
    label: "Appear on Leaderboard",
    description: "Show your name and rank on the global leaderboard",
    icon: Trophy,
  },
];

export function PrivacyToggles({
  settings,
  onSettingsChange,
  className,
}: PrivacyTogglesProps) {
  const handleToggle = (key: keyof PrivacySettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">Privacy Settings</CardTitle>
        <CardDescription>
          Control what information is visible to other students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {privacyOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <option.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <Label
                  htmlFor={option.key}
                  className="cursor-pointer text-sm font-medium"
                >
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            <Switch
              id={option.key}
              checked={settings[option.key]}
              onCheckedChange={() => handleToggle(option.key)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
