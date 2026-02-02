"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn } from "@clerk/nextjs";
import { cn } from "@repo/ui";
import { useKeyboardOpen } from "@/hooks/use-keyboard-open";
import {
  LayoutDashboard,
  FileText,
  Trophy,
  User,
  MessageCircle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tests", label: "Tests", icon: FileText },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/me", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const isKeyboardOpen = useKeyboardOpen();

  // Don't show bottom nav on test taking page
  if (pathname.match(/^\/tests\/[^/]+$/) && !pathname.endsWith("/tests")) {
    return null;
  }

  // Hide bottom nav on chat page when keyboard is open
  if (pathname === "/chat" && isKeyboardOpen) {
    return null;
  }


  return (
    <SignedIn>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

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
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                    isActive && "bg-primary/10 scale-110"
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
        </div>

        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-transparent" />
      </nav>

    </SignedIn>
  );
}
