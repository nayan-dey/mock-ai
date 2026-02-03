"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@repo/ui";
import { ArrowRight, Github } from "lucide-react";
import { FadeIn } from "./animations/fade-in";

const ADMIN_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.admin.nindo.biz"
    : "http://localhost:3001";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Footer-style background - stronger in light mode */}
      <div className="absolute inset-0 bg-muted/70 dark:bg-muted/50" />

      {/* Gradient overlay at top for smooth transition - taller fade */}
      <div className="absolute inset-x-0 top-0 h-48 sm:h-64 bg-gradient-to-b from-background via-background/80 to-transparent" />

      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Grid pattern - fades in from top */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            mask: 'linear-gradient(to bottom, transparent 0%, black 30%)',
            WebkitMask: 'linear-gradient(to bottom, transparent 0%, black 30%)',
          }}
        />

        {/* Radial gradient glow - stronger in light mode */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative px-4 pt-20 pb-8 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* CTA Card */}
          <div className="relative rounded-3xl p-[2px]">
            {/* Animated spinning gradient border */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <motion.div
                className="absolute -inset-[100%]"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0%, transparent 40%, hsl(var(--primary)) 50%, transparent 60%, transparent 100%)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Blur overlay to soften the edges */}
            <div
              className="absolute inset-0 rounded-3xl backdrop-blur-sm"
              style={{
                mask: "linear-gradient(black, black)",
                WebkitMask: "linear-gradient(black, black)",
              }}
            />

            {/* Soft glow behind the border - stronger in light mode */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-primary/10 dark:bg-primary/5" />

            {/* Inner content card with shadow for light mode */}
            <div className="relative z-10 rounded-[calc(1.5rem-2px)] bg-background p-8 text-center shadow-lg shadow-black/5 dark:shadow-none sm:p-14">
              <FadeIn>
                <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-4xl">
                  Ready to Start Your Journey?
                </h2>
                <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
                  Join thousands of students and instructors who are already using
                  Nindo to prepare smarter and manage their institutes effortlessly.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                  <Link href="/sign-up">
                    <Button size="lg" className="w-full gap-2 sm:w-auto">
                      Start as Student
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full gap-2 sm:w-auto"
                    >
                      Start as Instructor
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Footer content */}
          <div className="mt-16 flex flex-col items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Nindo" className="h-8 w-8 dark:invert" />
              <span className="text-xl font-semibold font-serif">Nindo</span>
            </Link>

            {/* Open Source Badge */}
            <a
              href="https://github.com/nindo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span>Open Source</span>
            </a>

            {/* Divider */}
            <div className="h-px w-24 bg-border" />

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Nindo. Open source, built for students, by students.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
