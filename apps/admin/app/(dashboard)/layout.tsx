"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";

const BATCH_EXEMPT_ROUTES = ["/dashboard", "/batches/new", "/requests"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const batchCount = useQuery(api.batches.countForOrg);

  // Redirect to dashboard if no batches and on a non-exempt route
  useEffect(() => {
    if (batchCount === undefined) return; // still loading
    if (batchCount === 0 && !BATCH_EXEMPT_ROUTES.some((r) => pathname.startsWith(r))) {
      router.replace("/dashboard");
    }
  }, [batchCount, pathname, router]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <div className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
