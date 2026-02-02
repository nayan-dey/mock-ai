"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SuggestedLink {
  label: string;
  href: string;
}

interface SuggestedLinksProps {
  links: SuggestedLink[];
}

export function SuggestedLinks({ links }: SuggestedLinksProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-stone-700 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 shadow-sm transition-all hover:shadow active:scale-95"
        >
          {link.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      ))}
    </div>
  );
}

// Module-level constant to avoid recreating regex objects per call
const LINK_PATTERNS = [
  { pattern: /\/dashboard/, label: "Dashboard", href: "/dashboard" },
  { pattern: /\/tests(?!\/)/, label: "Tests", href: "/tests" },
  { pattern: /\/results(?!\/)/, label: "Results", href: "/results" },
  { pattern: /\/leaderboard/, label: "Leaderboard", href: "/leaderboard" },
  { pattern: /\/notes/, label: "Notes", href: "/notes" },
  { pattern: /\/classes/, label: "Classes", href: "/classes" },
  { pattern: /\/settings/, label: "Settings", href: "/settings" },
  { pattern: /\/me/, label: "Profile", href: "/me" },
] as const;

// Helper to extract page links from AI response
export function extractLinksFromContent(content: string): SuggestedLink[] {
  const links: SuggestedLink[] = [];
  const seenHrefs = new Set<string>();

  for (const { pattern, label, href } of LINK_PATTERNS) {
    if (pattern.test(content) && !seenHrefs.has(href)) {
      links.push({ label, href });
      seenHrefs.add(href);
    }
  }

  return links;
}
