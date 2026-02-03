"use client";

import { LandingNavbar } from "./landing-navbar";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { ComparisonSection } from "./comparison-section";
import { HowItWorksSection } from "./how-it-works-section";
import { CtaSection } from "./cta-section";

export function LandingPage() {
  return (
    <div className="-mt-14">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <ComparisonSection />
      <HowItWorksSection />
      <CtaSection />
    </div>
  );
}
