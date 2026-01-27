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

// Helper to extract page links from AI response
export function extractLinksFromContent(content: string): SuggestedLink[] {
  const links: SuggestedLink[] = [];
  const linkPatterns = [
    { pattern: /\/dashboard/g, label: "Dashboard", href: "/dashboard" },
    { pattern: /\/tests(?!\/)/, label: "Tests", href: "/tests" },
    { pattern: /\/results(?!\/)/, label: "Results", href: "/results" },
    { pattern: /\/leaderboard/g, label: "Leaderboard", href: "/leaderboard" },
    { pattern: /\/notes/g, label: "Notes", href: "/notes" },
    { pattern: /\/classes/g, label: "Classes", href: "/classes" },
    { pattern: /\/settings/g, label: "Settings", href: "/settings" },
    { pattern: /\/me/g, label: "Profile", href: "/me" },
  ];

  const seenHrefs = new Set<string>();

  for (const { pattern, label, href } of linkPatterns) {
    if (pattern.test(content) && !seenHrefs.has(href)) {
      links.push({ label, href });
      seenHrefs.add(href);
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  }

  return links;
}
