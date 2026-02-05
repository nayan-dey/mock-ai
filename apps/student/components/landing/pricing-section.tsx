"use client";

import { motion } from "motion/react";
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Building2,
  Crown,
} from "lucide-react";
import { Button } from "@repo/ui";
import { FadeIn } from "./animations/fade-in";
import Link from "next/link";

const ADMIN_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.admin.nindo.biz"
    : "http://localhost:3001";

type Feature = {
  label: string;
  free: boolean;
  pro: boolean;
  max: boolean;
};

const features: Feature[] = [
  // Student core
  { label: "Take Timed Mock Tests", free: true, pro: true, max: true },
  { label: "Performance Analytics", free: true, pro: true, max: true },
  { label: "Leaderboard & Tiers", free: true, pro: true, max: true },
  { label: "Access Study Notes", free: true, pro: true, max: true },
  { label: "Watch Video Classes", free: true, pro: true, max: true },
  { label: "Fee Tracking & Queries", free: true, pro: true, max: true },
  // Teacher core
  { label: "Create & Manage Tests", free: false, pro: true, max: true },
  { label: "Student & Batch Management", free: false, pro: true, max: true },
  { label: "Upload Notes & Classes", free: false, pro: true, max: true },
  { label: "Fee & Query Management", free: false, pro: true, max: true },
  { label: "Data Export (Excel & PDF)", free: false, pro: true, max: true },
  // AI features
  { label: "AI Study Companion", free: false, pro: false, max: true },
  { label: "AI Question Extraction", free: false, pro: false, max: true },
  { label: "Ask Nindo AI (Admin)", free: false, pro: false, max: true },
];

const plans = [
  {
    name: "Free",
    description: "For students preparing for exams",
    price: 0,
    icon: GraduationCap,
    audience: "Students",
    cta: "Get Started Free",
    ctaLink: "/sign-up",
    highlighted: false,
    external: false,
  },
  {
    name: "Pro",
    description: "For instructors managing institutes",
    price: 19,
    icon: Building2,
    audience: "Instructors",
    cta: "Start with Pro",
    ctaLink: ADMIN_URL,
    highlighted: false,
    external: true,
  },
  {
    name: "Max",
    description: "Full platform with AI superpowers",
    price: 29,
    icon: Crown,
    audience: "Instructors & Students",
    cta: "Go Max",
    ctaLink: ADMIN_URL,
    highlighted: true,
    external: true,
  },
];

function FeatureIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-3 w-3 text-primary" />
      </div>
    );
  }
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
      <X className="h-3 w-3 text-muted-foreground/40" />
    </div>
  );
}

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof plans)[number];
  index: number;
}) {
  const featureKeys = ["free", "pro", "max"] as const;
  const key = featureKeys[index]!;

  const cardContent = (
    <div className="relative z-10 flex h-full flex-col rounded-3xl border bg-card p-8 transition-shadow duration-500 group-hover:shadow-xl group-hover:shadow-primary/5">
      {/* Decorative gradient blob */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-transform duration-500 group-hover:scale-150" />

      {/* Header */}
      <div className="relative mb-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
            <plan.icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              {plan.highlighted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="h-3 w-3" />
                  Popular
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{plan.audience}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {plan.description}
        </p>
      </div>

      {/* Pricing */}
      <div className="relative mb-6">
        <div className="flex items-baseline gap-1">
          {plan.price === 0 ? (
            <span className="text-4xl font-bold tracking-tight">Free</span>
          ) : (
            <>
              <span className="text-4xl font-bold tracking-tight">
                ${plan.price}
              </span>
              <span className="text-sm text-muted-foreground">/month</span>
            </>
          )}
        </div>
        {plan.price === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Free forever for students
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="mb-6 h-px bg-border" />

      {/* Feature list */}
      <ul className="relative mb-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-3">
            <FeatureIcon included={feature[key]} />
            <span
              className={`text-sm ${feature[key] ? "text-foreground" : "text-muted-foreground/50"}`}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="relative">
        {plan.external ? (
          <a
            href={plan.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              className="w-full gap-2"
              variant={plan.highlighted ? "default" : "outline"}
              size="lg"
            >
              {plan.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        ) : (
          <Link href={plan.ctaLink} className="block">
            <Button className="w-full gap-2" variant="outline" size="lg">
              {plan.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  if (plan.highlighted) {
    return (
      <div className="group relative">
        {/* Animated spinning gradient border for highlighted card */}
        <div className="absolute -inset-px z-0 overflow-hidden rounded-3xl">
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

        {/* Soft glow behind the border */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-primary/10 dark:bg-primary/5" />

        {cardContent}
      </div>
    );
  }

  return (
    <div className="group relative">
      {/* Card glow on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {cardContent}
    </div>
  );
}

export function PricingSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <FadeIn>
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              Simple Pricing
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Pick the Plan That Fits
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              Students learn free. Instructors choose the tools they need.
              Upgrade anytime as your institute grows.
            </p>
          </div>
        </FadeIn>

        {/* Pricing cards */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        {/* Bottom note */}
        <FadeIn>
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-card">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
            </div>
            <p className="text-sm text-muted-foreground">
              All plans include dark mode, mobile-first design, and real-time
              sync
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
