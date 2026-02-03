"use client";

import { motion } from "motion/react";

export function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px] mix-blend-multiply dark:bg-primary/10 dark:mix-blend-screen"
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-orange-300/15 blur-[100px] mix-blend-multiply dark:bg-orange-400/10 dark:mix-blend-screen"
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 30, -50, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 h-[350px] w-[350px] rounded-full bg-amber-200/10 blur-[100px] mix-blend-multiply dark:bg-amber-400/8 dark:mix-blend-screen"
        animate={{
          x: [0, 60, -20, 0],
          y: [0, -30, 40, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
