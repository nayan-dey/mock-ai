"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  UserPlus,
  FileText,
  TrendingUp,
  Building2,
  BookPlus,
  Users,
} from "lucide-react";
import { FadeIn } from "./animations/fade-in";

const studentSteps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    description:
      "Create your free account and join your institute's batch with a referral code.",
  },
  {
    icon: FileText,
    title: "Take Tests",
    description:
      "Practice with timed mock tests, get AI-powered study help, and access study materials.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description:
      "Monitor your performance with detailed analytics, compete on leaderboards, and level up.",
  },
];

const instructorSteps = [
  {
    icon: Building2,
    title: "Create Institute",
    description:
      "Set up your organization profile and invite other admins to collaborate.",
  },
  {
    icon: BookPlus,
    title: "Add Content",
    description:
      "Create tests, upload notes, add video classes, and let AI extract questions from PDFs.",
  },
  {
    icon: Users,
    title: "Manage Students",
    description:
      "Organize batches, track performance, manage fees, and monitor student progress.",
  },
];

function StepCard({
  step,
  index,
  delay,
  total,
}: {
  step: (typeof studentSteps)[number];
  index: number;
  delay: number;
  total: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Step number badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
        {index + 1}
      </div>

      {/* Icon container */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
        <step.icon className="h-7 w-7 text-primary" />
      </div>

      {/* Connector line (hidden on last item and mobile) */}
      {index < total - 1 && (
        <div className="absolute top-8 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] bg-border sm:block" />
      )}

      <h3 className="mb-1.5 text-base font-semibold">{step.title}</h3>
      <p className="max-w-[220px] text-sm leading-relaxed text-muted-foreground">
        {step.description}
      </p>
    </motion.div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="border-t bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <div className="mb-16 text-center">
            <p className="mb-2 text-sm font-medium text-primary">
              How It Works
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Simple Steps to Get Started
            </h2>
          </div>
        </FadeIn>

        {/* Students Flow */}
        <div className="mb-20">
          <FadeIn>
            <h3 className="mb-10 text-center text-lg font-semibold text-muted-foreground">
              For Students
            </h3>
          </FadeIn>
          <div className="grid gap-10 sm:grid-cols-3">
            {studentSteps.map((step, i) => (
              <StepCard
                key={step.title}
                step={step}
                index={i}
                delay={i * 0.15}
                total={studentSteps.length}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-20 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="rounded-full border bg-card px-4 py-1 text-xs font-medium text-muted-foreground">
            OR
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Instructors Flow */}
        <div>
          <FadeIn>
            <h3 className="mb-10 text-center text-lg font-semibold text-muted-foreground">
              For Instructors & Institutes
            </h3>
          </FadeIn>
          <div className="grid gap-10 sm:grid-cols-3">
            {instructorSteps.map((step, i) => (
              <StepCard
                key={step.title}
                step={step}
                index={i}
                delay={i * 0.15}
                total={instructorSteps.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
