"use client";

import { cn } from "@repo/ui";

export function Marquee({
  children,
  className,
  speed = 40,
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  pauseOnHover?: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 animate-marquee items-center gap-6",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div
        className={cn(
          "flex shrink-0 animate-marquee items-center gap-6",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{ animationDuration: `${speed}s` }}
        aria-hidden
      >
        {children}
      </div>
    </div>
  );
}
