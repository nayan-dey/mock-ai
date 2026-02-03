"use client";

import {
  FileText,
  BarChart3,
  MessageCircle,
  Trophy,
  BookOpen,
  Video,
  Upload,
  Users,
  Building2,
  CreditCard,
  Bell,
  Settings,
  Smartphone,
  Monitor,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@repo/ui";
import { FadeIn } from "./animations/fade-in";
import Link from "next/link";

const ADMIN_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.admin.nindo.biz"
    : "http://localhost:3001";

const studentFeatures = [
  { icon: FileText, label: "Take Timed Mock Tests" },
  { icon: BarChart3, label: "Performance Analytics" },
  { icon: MessageCircle, label: "AI Study Companion" },
  { icon: Trophy, label: "Leaderboards & Tiers" },
  { icon: BookOpen, label: "Access Study Notes" },
  { icon: Video, label: "Watch Video Classes" },
  { icon: CreditCard, label: "Track Fee Status" },
  { icon: Bell, label: "Get Notifications" },
];

const adminFeatures = [
  { icon: Upload, label: "AI Question Extraction" },
  { icon: FileText, label: "Create & Manage Tests" },
  { icon: Users, label: "Student Management" },
  { icon: Building2, label: "Batch Organization" },
  { icon: BookOpen, label: "Upload Study Notes" },
  { icon: Video, label: "Add Video Classes" },
  { icon: CreditCard, label: "Fee Management" },
  { icon: Settings, label: "Institute Settings" },
];

function FeatureList({
  features,
}: {
  features: typeof studentFeatures;
  delay?: number;
}) {
  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature.label} className="flex items-center gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">{feature.label}</span>
        </li>
      ))}
    </ul>
  );
}

function PortalCard({
  type,
}: {
  type: "student" | "admin";
  delay?: number;
}) {
  const isStudent = type === "student";

  return (
    <div className="group relative">
      {/* Card glow effect on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Main card */}
      <div className="relative overflow-hidden rounded-3xl border bg-card p-8 transition-shadow duration-500 group-hover:shadow-xl group-hover:shadow-primary/5">
        {/* Decorative gradient blob */}
        <div
          className={`pointer-events-none absolute -top-20 ${isStudent ? "-right-20" : "-left-20"} h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-transform duration-500 group-hover:scale-150`}
        />

        {/* Header */}
        <div className="relative mb-8">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
              {isStudent ? (
                <Smartphone className="h-7 w-7 text-primary" />
              ) : (
                <Monitor className="h-7 w-7 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {isStudent ? "Student App" : "Admin Portal"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isStudent
                  ? "Mobile-first learning"
                  : "Desktop management tools"}
              </p>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isStudent
              ? "Everything you need to prepare for exams — tests, analytics, AI tutoring, and more."
              : "Powerful tools to create content, manage students, and track your institute's performance."}
          </p>
        </div>

        {/* Features list */}
        <div className="relative mb-8">
          <FeatureList features={isStudent ? studentFeatures : adminFeatures} />
        </div>

        {/* CTA */}
        <div className="relative">
          {isStudent ? (
            <Link href="/sign-up" className="block">
              <Button className="w-full gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full gap-2">
                Open Admin Portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ComparisonSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute left-1/2 bottom-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              Two Portals, One Platform
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Built for Students & Instructors
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              Whether you're preparing for exams or managing an institute, Nindo
              has the tools you need.
            </p>
          </div>
        </FadeIn>

        {/* Portal cards */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <PortalCard type="student" delay={0} />
          <PortalCard type="admin" delay={0.15} />
        </div>

        {/* Connecting element */}
        <FadeIn delay={0.5}>
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-card">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
            </div>
            <p className="text-sm text-muted-foreground">
              Seamlessly connected through a shared backend
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
