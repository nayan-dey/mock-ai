import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/database";
import { NewTestClient } from "./new-test-client";

export default async function NewTestPage() {
  const [preloadedQuestions, preloadedBatches] = await Promise.all([
    preloadQuery(api.questions.list, {}),
    preloadQuery(api.batches.list, { activeOnly: true }),
  ]);

  return (
    <NewTestClient
      preloadedQuestions={preloadedQuestions}
      preloadedBatches={preloadedBatches}
    />
  );
}
