"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Button,
  Input,
  Label,
  PrivacyToggles,
  ChartTypeSelector,
  BackButton,
  type PrivacySettings,
  type ChartType,
  useToast,
  sonnerToast,
} from "@repo/ui";
import { FlaskConical, Loader2 } from "lucide-react";
import { useState } from "react";

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div>
          <Skeleton className="mb-2 h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const userSettings = useQuery(
    api.userSettings.getOrCreateDefault,
    dbUser?._id ? {} : "skip"
  );

  const upsertSettings = useMutation(api.userSettings.upsert);
  const seedMockAttempts = useMutation(api.seed.seedMockAttempts);

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  if (!isUserLoaded || (user && (dbUser === undefined || userSettings === undefined))) {
    return <SettingsSkeleton />;
  }

  if (!dbUser) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="py-8 text-center sm:py-12">
          <CardContent>
            <h3 className="mb-2 text-base font-medium sm:text-lg">
              Account Not Found
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Please sign in to access settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePrivacyChange = async (settings: PrivacySettings) => {
    setIsSavingSettings(true);
    try {
      await upsertSettings({
        showHeatmap: settings.showHeatmap,
        showStats: settings.showStats,
        showOnLeaderboard: settings.showOnLeaderboard,
      });
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleChartTypeChange = async (chartType: ChartType) => {
    setIsSavingSettings(true);
    try {
      await upsertSettings({
        preferredChartType: chartType,
      });
      toast({
        title: "Dashboard preference updated",
        description: `Your dashboard will now show the ${chartType === "heatmap" ? "activity heatmap" : "performance chart"}.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update dashboard preference.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const privacySettings: PrivacySettings = {
    showHeatmap: userSettings?.showHeatmap ?? true,
    showStats: userSettings?.showStats ?? true,
    showOnLeaderboard: userSettings?.showOnLeaderboard ?? true,
  };

  const handleSeedAttempts = async () => {
    if (!dbUser?._id) return;
    setIsSeeding(true);
    try {
      const result = await seedMockAttempts({
        userId: dbUser._id,
        count: 15,
      });
      sonnerToast.success(`Created ${result.attempts?.length || 15} mock test attempts`);
    } catch (error: any) {
      sonnerToast.error(error.message || "Failed to seed attempts");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <BackButton href="/me" />
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Chart Type Selector */}
        {/* <ChartTypeSelector
          value={(userSettings?.preferredChartType as ChartType) || "chart"}
          onChange={handleChartTypeChange}
        /> */}

        {/* Privacy Toggles */}
        <PrivacyToggles
          settings={privacySettings}
          onSettingsChange={handlePrivacyChange}
        />

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
            <CardDescription>
              Your account details (read-only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={dbUser.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Member Since</Label>
              <Input
                value={new Date(dbUser.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Developer Tools
            </CardTitle>
            <CardDescription>
              Testing utilities for development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Create 15 mock test attempts spread across the last 60 days.
                Useful for testing the dashboard, heatmap, results page, and confetti.
              </p>
              <Button
                onClick={handleSeedAttempts}
                disabled={isSeeding}
                variant="outline"
                className="gap-2"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating attempts...
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-4 w-4" />
                    Seed My Attempts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
