// src/app/(public)/page.tsx
'use client';

import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { ResultsSection } from '@/components/sections/ResultsSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { TrustSection } from '@/components/sections/TrustSection';
import { CTASection } from '@/components/sections/CTASection';


export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ResultsSection />
      <TestimonialsSection />
      <TrustSection />
      <CTASection />
    </main>
  );
}