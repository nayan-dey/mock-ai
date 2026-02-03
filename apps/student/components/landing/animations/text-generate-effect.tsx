import { cn } from "@repo/ui";

export function TextGenerateEffect({
  words,
  className,
}: {
  words: string;
  className?: string;
  delay?: number;
}) {
  return <div className={cn(className)}>{words}</div>;
}
