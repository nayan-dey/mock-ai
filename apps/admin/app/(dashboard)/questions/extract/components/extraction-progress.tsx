"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbulb } from "lucide-react";
import { ShimmeringText } from "./shimmering-text";

interface ExtractionProgressProps {
  files: { name: string }[];
  currentIndex: number;
}

const TIPS = [
  "Nindo AI is reading your document...",
  "Identifying questions and answer options...",
  "Detecting correct answers from markings...",
  "Classifying subjects...",
  "Cleaning up formatting and text...",
  "Almost there, finalizing extraction...",
];

function AnimatedLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="relative"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-16 w-16 text-primary"
      >
        {/* Left leg */}
        <motion.path
          d="m3 21 8.02-14.26"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.7, 1],
          }}
        />
        {/* Right small line */}
        <motion.path
          d="m12.99 6.74 1.93 3.44"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.7, 1],
            delay: 0.15,
          }}
        />
        {/* Right leg */}
        <motion.path
          d="m21 21-2.16-3.84"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.7, 1],
            delay: 0.3,
          }}
        />
        {/* Arc */}
        <motion.path
          d="M19.136 12a10 10 0 0 1-14.271 0"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.7, 1],
            delay: 0.45,
          }}
        />
        {/* Center circle */}
        <motion.circle
          cx="12"
          cy="5"
          r="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.7, 1],
            delay: 0.6,
          }}
        />
      </svg>
      {/* Pulsing glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

export function ExtractionProgress({ files, currentIndex }: ExtractionProgressProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const totalFiles = files.length;
  const progressPercent =
    totalFiles > 1
      ? Math.round((currentIndex / totalFiles) * 100 + (1 / totalFiles) * 60)
      : 60;

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      {/* Animated Logo */}
      <div className="relative flex items-center justify-center">
        <AnimatedLogo />
      </div>

      {/* Title */}
      <div className="space-y-2 text-center">
        <ShimmeringText
          text="Nindo AI is extracting questions"
          className="text-lg font-semibold"
          duration={2}
          repeatDelay={0.5}
          spread={3}
        />
        <p className="text-xs text-muted-foreground">
          This may take a moment depending on the file size
        </p>
      </div>

      {/* Animated progress bar */}
      <div className="w-full max-w-xs">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          {/* Determinate fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/40"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {/* Indeterminate sweep overlay */}
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ left: ["-33%", "100%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 0.3,
            }}
          />
        </div>
      </div>

      {/* Tips carousel */}
      <div className="flex items-center gap-2 h-6">
        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-muted-foreground"
          >
            {TIPS[tipIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
