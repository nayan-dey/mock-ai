"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex items-center justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
