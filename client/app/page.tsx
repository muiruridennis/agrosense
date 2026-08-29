"use client";

import { HeroSection } from "@/components/sections/HeroSection";
import { CoreFeatures } from "@/components/sections/core-features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { ProductScreenshots } from "@/components/sections/product-screenshots";

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <CoreFeatures />
      <HowItWorks />
      <ProductScreenshots />
    </main>
  );
}
