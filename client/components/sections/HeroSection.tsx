import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const FALLBACK_IMAGE = "/hero-poultry-placeholder.png";

interface HeroSectionProps {
  heroImageSrc?: string;
}

export function HeroSection({
  heroImageSrc = FALLBACK_IMAGE,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#070B14]">
      {/* ========================================
          BACKGROUND IMAGE
      ======================================== */}

      <div className="absolute inset-0 z-0">
        <Image
          src={heroImageSrc}
          alt="Healthy hens in a modern poultry farm"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        {/* Focused readability gradient */}
        <div
          className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-[#070B14]/85 via-[#070B14]/55 to-transparent"
          aria-hidden="true"
        />

        {/* Very subtle overall contrast */}
        <div className="absolute inset-0 bg-[#070B14]/10" aria-hidden="true" />
      </div>

      {/* ========================================
          BACKGROUND ATMOSPHERE
      ======================================== */}

      <div
        className="pointer-events-none absolute -left-1/4 top-1/3 z-10 h-[700px] w-[700px] -translate-y-1/2 rounded-full bg-amber-400/[0.04] blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-1/4 bottom-0 z-10 h-[600px] w-[600px] rounded-full bg-blue-500/[0.03] blur-3xl"
        aria-hidden="true"
      />

      {/* ========================================
          CONTENT
      ======================================== */}

      <div className="container-custom relative z-20 flex min-h-screen items-center">
        <div className="grid w-full items-center py-28 lg:min-h-screen lg:grid-cols-2 lg:py-20">
          {/* LEFT — CONTENT */}

          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/20 bg-[#070B14]/40 px-4 py-2 backdrop-blur-md">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                aria-hidden="true"
              />

              <span className="text-xs font-medium uppercase tracking-[0.08em] text-amber-400/90">
                Built for poultry farmers
              </span>
            </div>

            {/* Headline */}
            <h1 className="mt-8 max-w-2xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Run your poultry farm{" "}
              <span className="text-gradient-hero">with confidence.</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Track your flock, production, health, and market prices in one
              place — so you always know what&apos;s happening and what to do
              next.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group h-14 rounded-2xl bg-amber-400 px-7 font-semibold text-[#070B14] shadow-lg shadow-amber-400/20 transition-all duration-300 hover:bg-amber-500 hover:text-white hover:shadow-amber-500/40"
              >
                <Link href="/register">
                  Get started free
                  <ArrowRight
                    className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 rounded-2xl border-white/40 bg-white/[0.08] px-7 text-white backdrop-blur-md transition-all duration-300 hover:border-white/60 hover:bg-white/[0.18]"
              >
                <Link href="/market">Explore poultry market</Link>
              </Button>
            </div>

            {/* Trust */}
            <div className="mt-6 flex items-center">
              <span className="flex items-center gap-2 text-xs text-white/60">
                <ShieldCheck
                  className="h-4 w-4 text-emerald-400"
                  aria-hidden="true"
                />
                No credit card required
              </span>
            </div>
          </div>

          {/* RIGHT — intentionally empty */}

          <div className="hidden lg:block" />
        </div>
      </div>

      {/* ========================================
          MARKET STRIP
      ======================================== */}

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#070B14]/70 backdrop-blur-md">
        <div className="container-custom py-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-3 text-xs text-white/80">
              <span className="font-medium uppercase tracking-wider text-white/80">
                Poultry market intelligence
              </span>

              <span className="hidden h-3 w-px bg-white/15 sm:block" />

              <span className="hidden sm:inline">
                Track current prices and market trends
              </span>
            </div>

            <Link
              href="/market"
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              View poultry market
              <ArrowRight
                className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
