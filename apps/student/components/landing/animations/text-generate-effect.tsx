"use client";

import { useEffect } from "react";
import { motion, stagger, useAnimate, useInView } from "motion/react";
import { cn } from "@repo/ui";

export function TextGenerateEffect({
  words,
  className,
  delay = 0,
}: {
  words: string;
  className?: string;
  delay?: number;
}) {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true });
  const wordsArray = words.split(" ");

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        animate(
          "span",
          { opacity: 1, y: 0, filter: "blur(0px)" },
          { duration: 0.3, delay: stagger(0.04) }
        );
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, animate, delay]);

  return (
    <motion.div ref={scope} className={cn(className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          className="inline-block"
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.div>
  );
}
