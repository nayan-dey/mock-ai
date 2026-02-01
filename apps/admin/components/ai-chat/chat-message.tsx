"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  const suggestedLinks = isUser ? [] : extractLinksFromContent(content);

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-[15px] text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] leading-relaxed text-foreground">
            <MessageContent content={content} />
          </div>
          {suggestedLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  {link.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const paragraphs = content.split("\n\n");

  return (
    <>
      {paragraphs.map((paragraph, i) => {
        // Check for tables (lines with | separators)
        if (paragraph.includes("|") && paragraph.split("\n").filter((l) => l.includes("|")).length >= 2) {
          const lines = paragraph.split("\n").filter((l) => l.trim().startsWith("|"));
          if (lines.length >= 2) {
            const headerCells = lines[0].split("|").filter(Boolean).map((c) => c.trim());
            const dataLines = lines.slice(2); // skip header and separator
            return (
              <div key={i} className="my-3 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {headerCells.map((cell, j) => (
                        <th key={j} className="border border-border bg-muted px-3 py-1.5 text-left font-medium">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataLines.map((line, j) => {
                      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
                      return (
                        <tr key={j}>
                          {cells.map((cell, k) => (
                            <td key={k} className="border border-border px-3 py-1.5">
                              {formatInlineText(cell)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Check for lists
        if (paragraph.includes("\n- ") || paragraph.startsWith("- ")) {
          const items = paragraph.split("\n").filter((line) => line.startsWith("- "));
          const prefix = paragraph.split("\n- ")[0];
          return (
            <div key={i}>
              {prefix && !prefix.startsWith("- ") && <p>{formatInlineText(prefix)}</p>}
              <ul className="my-2 list-disc pl-4">
                {items.map((item, j) => (
                  <li key={j}>{formatInlineText(item.replace(/^- /, ""))}</li>
                ))}
              </ul>
            </div>
          );
        }

        // Check for numbered lists
        if (/^\d+\.\s/.test(paragraph)) {
          const items = paragraph.split("\n").filter((line) => /^\d+\.\s/.test(line));
          return (
            <ol key={i} className="my-2 list-decimal pl-4">
              {items.map((item, j) => (
                <li key={j}>{formatInlineText(item.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="my-2">
            {formatInlineText(paragraph)}
          </p>
        );
      })}
    </>
  );
}

function formatInlineText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((codePart, j) => {
      if (codePart.startsWith("`") && codePart.endsWith("`")) {
        return (
          <code key={`${i}-${j}`} className="rounded bg-muted px-1 py-0.5 text-sm">
            {codePart.slice(1, -1)}
          </code>
        );
      }
      return codePart;
    });
  });
}

interface SuggestedLink {
  label: string;
  href: string;
}

function extractLinksFromContent(content: string): SuggestedLink[] {
  const links: SuggestedLink[] = [];
  const linkPatterns = [
    { pattern: /\/dashboard/g, label: "Dashboard", href: "/dashboard" },
    { pattern: /\/users(?!\/)/, label: "Users", href: "/users" },
    { pattern: /\/batches(?!\/)/, label: "Batches", href: "/batches" },
    { pattern: /\/fees(?!\/)/, label: "Fees", href: "/fees" },
    { pattern: /\/questions(?!\/)/, label: "Questions", href: "/questions" },
    { pattern: /\/tests(?!\/)/, label: "Tests", href: "/tests" },
    { pattern: /\/analytics/g, label: "Analytics", href: "/analytics" },
    { pattern: /\/notes/g, label: "Notes", href: "/notes" },
    { pattern: /\/classes/g, label: "Classes", href: "/classes" },
  ];

  const seenHrefs = new Set<string>();

  for (const { pattern, label, href } of linkPatterns) {
    if (pattern.test(content) && !seenHrefs.has(href)) {
      links.push({ label, href });
      seenHrefs.add(href);
    }
    pattern.lastIndex = 0;
  }

  return links;
}
