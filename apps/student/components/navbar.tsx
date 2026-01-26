"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button, cn } from "@repo/ui";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Video,
  BarChart3,
  Trophy,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tests", label: "Tests", icon: FileText },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/classes", label: "Classes", icon: Video },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <span className="text-sm font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-sm font-semibold">MockTest</span>
          </Link>

          {/* Desktop Navigation */}
          <SignedIn>
            <div className="hidden items-center gap-0.5 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 gap-1.5 px-2.5 text-sm font-normal",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </SignedIn>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7",
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="h-8 text-sm font-normal">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="h-8 text-sm">
                  Get Started
                </Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}
