"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { cn } from "@repo/ui";
import { ThemeToggle } from "../theme-toggle";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300",
        scrolled
          ? "border-b bg-background/80 backdrop-blur-lg"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Nindo" className="h-6 w-6 dark:invert" />
          <span className="text-md font-semibold font-serif">Nindo</span>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
}
