"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn } from "@clerk/nextjs";
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
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Database,
  UserCog,
  Sparkles,
  IndianRupee,
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
  { href: "/seed", label: "Seed Data", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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

            const button = (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-transform duration-200 hover:translate-x-0.5",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Button>
            );

            return (
              <Link key={item.href} href={item.href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
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
