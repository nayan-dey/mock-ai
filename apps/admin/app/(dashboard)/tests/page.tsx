import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/database";
import { TestsClient } from "./tests-client";

export default async function TestsPage() {
  const preloadedTests = await preloadQuery(api.tests.list, {});

  return <TestsClient preloadedTests={preloadedTests} />;
}
