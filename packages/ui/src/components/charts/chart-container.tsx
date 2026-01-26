"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { cn } from "../../lib/utils";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartContainer({
  title,
  description,
  children,
  className,
  action,
}: ChartContainerProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
        )}
        {action}
      </CardHeader>
      <CardContent className="pb-4">{children}</CardContent>
    </Card>
  );
}
