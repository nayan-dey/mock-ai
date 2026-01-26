"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn } from "@clerk/nextjs";
import { Button, cn } from "@repo/ui";
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
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/batches", label: "Batches", icon: Users },
  { href: "/questions", label: "Questions", icon: FileQuestion },
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-xl font-bold">Admin</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

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
