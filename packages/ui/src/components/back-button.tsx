"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

interface BackButtonProps {
  href: string;
  className?: string;
}

export function BackButton({ href, className }: BackButtonProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <ArrowLeft className="h-5 w-5" />
    </a>
  );
}
