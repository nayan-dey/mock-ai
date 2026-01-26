import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/database";
import { EditQuestionClient } from "./edit-question-client";
import type { Id } from "@repo/database/dataModel";

interface EditQuestionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { id } = await params;

  const preloadedQuestion = await preloadQuery(api.questions.getById, {
    id: id as Id<"questions">,
  });

  return <EditQuestionClient questionId={id} preloadedQuestion={preloadedQuestion} />;
}
