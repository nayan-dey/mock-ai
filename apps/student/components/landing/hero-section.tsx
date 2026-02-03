"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@repo/ui";
import { ArrowRight, ChevronDown } from "lucide-react";
import { TextGenerateEffect } from "./animations/text-generate-effect";
import { FadeIn } from "./animations/fade-in";
import { GradientBlobs } from "./animations/gradient-blob";
import { Marquee } from "./animations/marquee";
import {
  Brain,
  BarChart3,
  Trophy,
  BookOpen,
  Video,
  Sparkles,
  Zap,
  Github,
} from "lucide-react";

function AnimatedLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
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
  );
}

const ADMIN_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.admin.nindo.biz"
    : "http://localhost:3001";

const marqueeItems = [
  { icon: Brain, label: "AI Powered" },
  { icon: BarChart3, label: "Real-time Analytics" },
  { icon: Trophy, label: "Gamified Learning" },
  { icon: Video, label: "Video Classes" },
  { icon: BookOpen, label: "Study Notes" },
  { icon: Sparkles, label: "Smart Insights" },
  { icon: Github, label: "Open Source" },
  { icon: Zap, label: "Instant Results" },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-10 sm:px-6 lg:px-8">
      <GradientBlobs />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge with border beam */}
        <FadeIn delay={0}>
          <motion.div
            className="group relative mb-6 inline-flex"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Soft glow */}
            <div className="absolute -inset-2 rounded-full bg-primary/15 blur-xl" />

            {/* Badge content */}
            <div className="relative flex items-center gap-2.5 overflow-hidden rounded-full border bg-background px-4 py-2 text-sm shadow-lg shadow-black/5 dark:shadow-black/30">
              {/* Border beam effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{
                  backgroundPosition: ["200% 0%", "-200% 0%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              {/* Inner background to cover the beam except border */}
              <div className="absolute inset-[1px] rounded-full bg-background" />

              <AnimatedLogo className="relative z-10 h-4 w-4 text-primary" />
              <span className="relative z-10 font-medium text-foreground/80">Open Source Exam Preparation Platform</span>
              <motion.div
                className="relative z-10"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="h-4 w-4 text-primary" />
              </motion.div>
            </div>
          </motion.div>
        </FadeIn>

        {/* Headline */}
        <TextGenerateEffect
          words="The Smarter Way to Ace Your Exams"
          className="mb-6 text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          delay={0.1}
        />

        {/* Subtitle */}
        <FadeIn delay={0.3}>
          <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg">
            AI-powered mock tests, real-time performance analytics, and a
            personal study companion — everything you need to prepare smarter,
            not harder.
          </p>
        </FadeIn>

        {/* CTA Buttons */}
        <FadeIn delay={0.4}>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                I'm a Student
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 sm:w-auto"
              >
                I'm an Instructor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </FadeIn>
      </div>

      {/* Marquee */}
      <FadeIn delay={0.5} className="mt-16 w-full max-w-5xl sm:mt-20">
        <Marquee speed={35} pauseOnHover>
          {marqueeItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-full border bg-background/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
            >
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </div>
          ))}
        </Marquee>
      </FadeIn>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground/50"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-6 w-6" />
      </motion.div>
    </section>
  );
}
