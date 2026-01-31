"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider } from "@repo/ui";
import { AppSidebar } from "../../components/sidebar";
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
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
