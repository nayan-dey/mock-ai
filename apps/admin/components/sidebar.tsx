"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, SignedIn, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";
import {
  LayoutDashboard,
  FileQuestion,
  FileText,
  BookOpen,
  Video,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Database,
  UserCog,
  Sparkles,
  IndianRupee,
  UserPlus,
  Shield,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: UserCog },
  { href: "/batches", label: "Batches", icon: Users },
  { href: "/fees", label: "Fees", icon: IndianRupee },
  { href: "/questions", label: "Questions", icon: FileQuestion, exact: true },
  { href: "/questions/extract", label: "AI Extract", icon: Sparkles },
  { href: "/tests", label: "Tests", icon: FileText },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/classes", label: "Classes", icon: Video },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admins", label: "Admins", icon: Shield },
  { href: "/requests", label: "Join Requests", icon: UserPlus },
  { href: "/seed", label: "Seed Data", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [collapsed, setCollapsed] = useState(false);

  const pendingCount = useQuery(api.orgJoinRequests.getPendingCount) ?? 0;

  const handleSignOut = () => {
    signOut().then(() => router.replace("/"));
  };

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r bg-background transition-all",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Nindo" className="h-8 w-8 dark:invert" />
            <span className="text-xl font-bold">Nindo Admin</span>
          </Link>
        )}
        {collapsed && (
          <img src="/logo.svg" alt="Nindo" className="mx-auto h-8 w-8" />
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href || pathname === item.href + "/"
              : pathname.startsWith(item.href);

            const showBadge = item.href === "/requests" && pendingCount > 0;

            const button = (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-transform duration-200 hover:translate-x-0.5",
                  collapsed && "justify-center px-2"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && collapsed && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {pendingCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="ml-3 flex flex-1 items-center justify-between">
                    {item.label}
                    {showBadge && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
                        {pendingCount}
                      </span>
                    )}
                  </span>
                )}
              </Button>
            );

            return (
              <Link key={item.href} href={item.href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                      {showBadge && ` (${pendingCount})`}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  button
                )}
              </Link>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Footer */}
      <div className="border-t p-4">
        <SignedIn>
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center"
            )}
          >
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
            {!collapsed && (
              <span className="text-sm text-muted-foreground">Admin</span>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start gap-2 text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </SignedIn>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
