import { Suspense } from "react";
import { TestDetailClient } from "./test-detail-client";

interface TestDetailPageProps {
  params: Promise<{ id: string }>;
}

function TestDetailLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<TestDetailLoading />}>
      <TestDetailClient testId={id} />
    </Suspense>
  );
}
