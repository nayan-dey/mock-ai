"use client";

import {
  FileText,
  Upload,
  BarChart3,
  MessageCircle,
  Trophy,
  BookOpen,
  Video,
  CreditCard,
} from "lucide-react";
import { FadeIn } from "./animations/fade-in";
import { BentoCard } from "./animations/bento-card";

const features = [
  {
    icon: FileText,
    title: "Timed Mock Tests",
    description:
      "Practice with real exam-like questions. Configurable duration, negative marking, and multiple answer support.",
  },
  {
    icon: Upload,
    title: "AI Question Extraction",
    description:
      "Upload PDFs, images, or spreadsheets and let AI extract questions instantly.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Subject-wise accuracy, score trends, activity heatmaps, and detailed performance breakdowns.",
  },
  {
    icon: MessageCircle,
    title: "AI Study Companion",
    description:
      "Get personalized help from an AI tutor powered by Google Gemini. Ask anything, anytime.",
  },
  {
    icon: Trophy,
    title: "Leaderboard & Tiers",
    description:
      "Compete with peers on global and batch-wise leaderboards. Earn tier badges from Rising Star to Legend.",
  },
  {
    icon: BookOpen,
    title: "Study Notes",
    description:
      "Access curated study materials organized by subject, prepared by expert educators.",
  },
  {
    icon: Video,
    title: "Video Classes",
    description:
      "Watch recorded lectures at your own pace. Organized by subject and topic for easy access.",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    description:
      "Track fee status, due dates, and payment history — all in one place.",
  },
];

export function FeaturesSection() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <div className="mb-12 text-center sm:mb-16">
            <p className="mb-2 text-sm font-medium text-primary">Features</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              A complete platform designed for modern exam preparation — from AI-powered
              tests to real-time analytics.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <BentoCard
              key={feature.title}
              index={index}
            >
              <div className="flex h-full flex-col">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>
    </section>
  );
}
