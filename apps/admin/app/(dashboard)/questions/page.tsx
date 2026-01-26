import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/database";
import { QuestionsClient } from "./questions-client";

interface QuestionsPageProps {
  searchParams: Promise<{ subject?: string; difficulty?: string }>;
}

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const params = await searchParams;

  const preloadedQuestions = await preloadQuery(api.questions.list, {
    subject: params.subject || undefined,
    difficulty: (params.difficulty as "easy" | "medium" | "hard") || undefined,
  });

  return <QuestionsClient preloadedQuestions={preloadedQuestions} />;
}
