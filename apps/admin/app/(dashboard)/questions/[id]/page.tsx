import { EditQuestionClient } from "./edit-question-client";

interface EditQuestionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { id } = await params;
  return <EditQuestionClient questionId={id} />;
}
