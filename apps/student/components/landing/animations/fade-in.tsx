import { cn } from "@repo/ui";

export function FadeIn({
  children,
  className,
}: {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
