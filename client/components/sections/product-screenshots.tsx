// src/components/sections/product-screenshots.tsx
import Image from "next/image";
import { 
  Bird, 
  Egg, 
  Syringe, 
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Screenshot {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: React.ElementType;
  domain: "flock" | "production" | "health" | "market";
  bgClass: string;
  iconClass: string;
  borderClass: string;
  features: string[];
}

const screenshots: Screenshot[] = [
  {
    id: "flock",
    title: "Flock Management",
    description: "See your entire flock at a glance. Track population, mortality, and performance across all your birds in real-time.",
    image: "/screenshots/dashboardscreenshot.png",
    icon: Bird,
    domain: "flock",
    bgClass: "bg-flock/10",
    iconClass: "text-flock-foreground",
    borderClass: "border-flock/20 hover:border-flock-foreground/30",
    features: [
      "Real-time flock population tracking",
      "Mortality monitoring and alerts",
      "Breed and age group management",
      "Flock performance analytics"
    ],
  },
  {
    id: "production",
    title: "Production Tracking",
    description: "Monitor daily egg production, feed consumption, and identify trends before they become problems.",
    image: "/screenshots/production.png",
    icon: Egg,
    domain: "production",
    bgClass: "bg-production/10",
    iconClass: "text-production-foreground",
    borderClass: "border-production/20 hover:border-production-foreground/30",
    features: [
      "Daily egg production logging",
      "Feed consumption tracking",
      "Production trend analysis",
      "Automated reports and insights"
    ],
  },
  {
    id: "health",
    title: "Health & Vaccination",
    description: "Keep vaccination schedules, health records, and mortality data organized — so you never miss what matters.",
    image: "/screenshots/health.png",
    icon: Syringe,
    domain: "health",
    bgClass: "bg-health/10",
    iconClass: "text-health-foreground",
    borderClass: "border-health/20 hover:border-health-foreground/30",
    features: [
      "Vaccination schedule management",
      "Health event logging",
      "Disease outbreak alerts",
      "Treatment and medication records"
    ],
  },
  {
    id: "market",
    title: "Market Intelligence",
    description: "Track poultry prices, market trends, and get insights to make better buying and selling decisions.",
    image: "/screenshots/screenshot-market.png",
    icon: TrendingUp,
    domain: "market",
    bgClass: "bg-market/10",
    iconClass: "text-market-foreground",
    borderClass: "border-market/20 hover:border-market-foreground/30",
    features: [
      "Live poultry market prices",
      "Price trend analysis",
      "Buy/sell recommendations",
      "Market alerts and notifications"
    ],
  },
];

export function ProductScreenshots() {
  return (
    <section className="py-20 bg-background-elevated border-b border-border/30">
      <div className="container-custom">
        {/* ========================================
            SECTION HEADER
        ======================================== */}

        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-text">
            See AgroSense in action
          </span>

          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            A platform built for{" "}
            <span className="text-gradient-hero">poultry farmers.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            From flock management to market intelligence — see exactly how
            AgroSense helps you run your poultry farm with confidence.
          </p>
        </div>

        {/* ========================================
            SCREENSHOTS — Alternating Layout
        ======================================== */}

        <div className="space-y-20">
          {screenshots.map((screenshot, index) => {
            const Icon = screenshot.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={screenshot.id}
                className={cn(
                  "grid gap-10 items-center",
                  isEven ? "lg:grid-cols-2" : "lg:grid-cols-2"
                )}
              >
                {/* Image — Left on even, Right on odd */}
                <div className={cn(
                  "relative order-1",
                  isEven ? "lg:order-1" : "lg:order-2"
                )}>
                  <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl shadow-black/5">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
                      <Image
                        src={screenshot.image}
                        alt={screenshot.title}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>

                    {/* Domain color accent bar */}
                    <div className={cn(
                      "absolute top-0 left-0 h-1 w-full",
                      screenshot.bgClass.replace("/10", "")
                    )} />
                  </div>
                </div>

                {/* Content — Right on even, Left on odd */}
                <div className={cn(
                  "order-2",
                  isEven ? "lg:order-2" : "lg:order-1"
                )}>
                  {/* Domain badge */}
                  <div className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                    screenshot.bgClass,
                    screenshot.iconClass
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                    {screenshot.domain.charAt(0).toUpperCase() + screenshot.domain.slice(1)}
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {screenshot.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {screenshot.description}
                  </p>

                  {/* Features list */}
                  <ul className="mt-5 space-y-2.5">
                    {screenshot.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            screenshot.iconClass
                          )}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Learn more link */}
                  <Link
                    href={`/features/${screenshot.id}`}
                    className="group inline-flex items-center gap-2 mt-6 text-sm font-medium text-primary-text hover:text-primary/80 transition-colors"
                  >
                    Learn more about {screenshot.title.toLowerCase()}
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================
            BOTTOM CTA
        ======================================== */}

        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <span className="text-sm text-muted-foreground">
              Ready to see it for yourself?
            </span>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 h-11 rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02]"
            >
              Start your free trial
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <span className="text-xs text-muted-foreground">
              No credit card required · 14-day free trial
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductScreenshots;
