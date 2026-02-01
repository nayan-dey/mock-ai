"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider } from "@repo/ui";
import { AppSidebar } from "../../components/sidebar";
import { Header } from "../../components/header";
import { Monitor } from "lucide-react";

const BATCH_EXEMPT_ROUTES = ["/dashboard", "/batches", "/requests"];

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
    <>
      {/* Mobile blocker */}
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center md:hidden">
        <Monitor className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Desktop Only</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          The admin panel is not available on mobile devices. Please use a
          desktop or laptop to access it.
        </p>
      </div>

      {/* Desktop layout */}
      <SidebarProvider>
        <div className="hidden md:contents">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
