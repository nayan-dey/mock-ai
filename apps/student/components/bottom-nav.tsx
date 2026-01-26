"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn } from "@clerk/nextjs";
import { cn } from "@repo/ui";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Trophy,
  MoreHorizontal,
  BookOpen,
  Video,
  X,
  Settings,
} from "lucide-react";
import { useState } from "react";

const mainNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tests", label: "Tests", icon: FileText },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
];

const moreNavItems = [
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/classes", label: "Classes", icon: Video },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  // Don't show bottom nav on test taking page
  if (pathname.match(/^\/tests\/[^/]+$/) && !pathname.endsWith("/tests")) {
    return null;
  }

  return (
    <SignedIn>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu */}
      <div
        className={cn(
          "fixed bottom-16 left-4 right-4 z-50 rounded-2xl border bg-background p-2 shadow-xl transition-all duration-200 md:hidden",
          showMore
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <div className="mb-2 flex items-center justify-between border-b px-2 pb-2">
          <span className="text-xs font-medium text-muted-foreground">More</span>
          <button
            onClick={() => setShowMore(false)}
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {moreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex items-center justify-around py-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors",
              showMore ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                showMore && "bg-primary/10"
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", showMore && "text-primary")} />
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              showMore && "text-primary"
            )}>
              More
            </span>
          </button>
        </div>

        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>
    </SignedIn>
  );
}
