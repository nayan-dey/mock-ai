import React from "react";
import { cn } from "@repo/ui";

export function MotionInviewWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
