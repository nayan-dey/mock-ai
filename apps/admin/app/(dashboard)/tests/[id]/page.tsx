import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/database";
import { TestDetailClient } from "./test-detail-client";
import type { Id } from "@repo/database/dataModel";

interface TestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params;
  const testId = id as Id<"tests">;

  const [preloadedTest, preloadedAnalytics, preloadedLeaderboard] = await Promise.all([
    preloadQuery(api.tests.getWithQuestions, { id: testId }),
    preloadQuery(api.analytics.getTestAnalytics, { testId }),
    preloadQuery(api.analytics.getLeaderboard, { testId }),
  ]);

  return (
    <TestDetailClient
      preloadedTest={preloadedTest}
      preloadedAnalytics={preloadedAnalytics}
      preloadedLeaderboard={preloadedLeaderboard}
    />
  );
}
