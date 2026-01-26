import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/database";
import { ProfileClient } from "./profile-client";
import type { Id } from "@repo/database/dataModel";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const userIdTyped = userId as Id<"users">;

  const [preloadedProfile, preloadedAnalytics, preloadedAchievements] = await Promise.all([
    preloadQuery(api.users.getPublicProfile, { userId: userIdTyped }),
    preloadQuery(api.analytics.getPublicStudentAnalytics, { userId: userIdTyped }),
    preloadQuery(api.analytics.getStudentAchievements, { userId: userIdTyped }),
  ]);

  return (
    <ProfileClient
      userId={userId}
      preloadedProfile={preloadedProfile}
      preloadedAnalytics={preloadedAnalytics}
      preloadedAchievements={preloadedAchievements}
    />
  );
}
