"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/database";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui";
import { AppSidebar } from "../../components/sidebar";
import { Header } from "../../components/header";
import { Monitor, Clock } from "lucide-react";

const BATCH_EXEMPT_ROUTES = ["/dashboard", "/batches", "/requests"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const batchCount = useQuery(api.batches.countForOrg);
  const organization = useQuery(api.organizations.getMyOrg);

  // Redirect to dashboard if no batches and on a non-exempt route
  useEffect(() => {
    if (batchCount === undefined) return; // still loading
    if (batchCount === 0 && !BATCH_EXEMPT_ROUTES.some((r) => pathname.startsWith(r))) {
      router.replace("/dashboard");
    }
  }, [batchCount, pathname, router]);

  // Wait for org query to resolve before checking verification
  if (organization === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show verification pending screen if org is not verified
  if (organization && organization.isVerified === false) {
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

        {/* Verification Pending Screen */}
        <div className="hidden min-h-svh md:flex md:items-center md:justify-center bg-gradient-to-b from-background to-muted/20 p-6">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-xl">Verification Pending</CardTitle>
              <CardDescription>
                Your organization is currently under review. You'll be able to
                access the admin panel once your organization has been verified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This process usually takes 24-48 hours. We'll notify you once
                your organization is verified.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

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
        <div className="hidden md:flex md:h-svh md:w-full">
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
