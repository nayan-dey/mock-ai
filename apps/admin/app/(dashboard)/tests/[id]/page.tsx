import { TestDetailClient } from "./test-detail-client";

interface TestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params;
  return <TestDetailClient testId={id} />;
}
