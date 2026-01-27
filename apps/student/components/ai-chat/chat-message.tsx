"use client";

import { Sparkles } from "lucide-react";
import { SuggestedLinks, extractLinksFromContent } from "./suggested-links";

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
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-stone-700 dark:bg-stone-600 px-4 py-3 text-[15px] text-white">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
          <Sparkles className="h-5 w-5 text-orange-400" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
            <MessageContent content={content} />
          </div>
          <SuggestedLinks links={suggestedLinks} />
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering for common patterns
  const paragraphs = content.split("\n\n");

  return (
    <>
      {paragraphs.map((paragraph, i) => {
        // Check for lists
        if (paragraph.includes("\n- ") || paragraph.startsWith("- ")) {
          const items = paragraph.split("\n").filter((line) => line.startsWith("- "));
          const prefix = paragraph.split("\n- ")[0];
          return (
            <div key={i}>
              {prefix && !prefix.startsWith("- ") && <p>{prefix}</p>}
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
  // Handle bold text (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Handle inline code (`code`)
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
