import { Suspense } from "react";
import { QuestionsClient } from "./questions-client";

function QuestionsLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<QuestionsLoading />}>
      <QuestionsClient />
    </Suspense>
  );
}
