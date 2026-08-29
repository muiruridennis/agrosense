// src/components/sections/core-features.tsx
import {
  Bird,
  Egg,
  Syringe,
  TrendingUp,
  ArrowRight,
  Check,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    id: "flock",
    icon: Bird,
    title: "Flock Management",
    description:
      "Know what's happening with every flock, from placement to current population. Keep track of flock records and performance as your birds grow.",
    highlights: [
      "Track flock placement and population",
      "Record mortality and population changes",
      "Monitor flock performance",
      "Keep organized flock records",
    ],
    // Using domain colors from globals.css
    domain: "flock",
    bgColor: "bg-flock",
    iconColor: "text-flock-foreground",
    borderColor: "border-flock/20 hover:border-flock-foreground/30",
    href: "/features/flock-management",
  },
  {
    id: "production",
    icon: Egg,
    title: "Production Tracking",
    description:
      "Record eggs, feed, mortality, and daily production to understand how your flock is performing.",
    domain: "production",
    bgColor: "bg-production",
    iconColor: "text-production-foreground",
    borderColor: "border-production/20 hover:border-production-foreground/30",
    href: "/features/production",
  },
  {
    id: "health",
    icon: Syringe,
    title: "Health & Vaccination",
    description:
      "Plan vaccinations, record health events, and keep your flock's health history organized.",
    domain: "health",
    bgColor: "bg-health",
    iconColor: "text-health-foreground",
    borderColor: "border-health/20 hover:border-health-foreground/30",
    href: "/features/health",
  },
  {
    id: "market",
    icon: TrendingUp,
    title: "Market Intelligence",
    description:
      "Track poultry prices and market trends to make better buying and selling decisions.",
    domain: "market",
    bgColor: "bg-market",
    iconColor: "text-market-foreground",
    borderColor: "border-market/20 hover:border-market-foreground/30",
    href: "/market",
  },
];

export function CoreFeatures() {
  const mainFeature = features[0];
  const otherFeatures = features.slice(1);

  const MainIcon = mainFeature.icon;

  return (
    <section className="border-b border-border/50 bg-background-dirty py-24 sm:py-28">
      <div className="container-custom">
        {/* ========================================
            SECTION HEADER
        ======================================== */}

        <div className="mx-auto mb-16 max-w-3xl text-center">
          {/* Eyebrow — using primary color instead of amber */}
          <span className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            One platform for your poultry operation
          </span>

          {/* Heading — using gradient sparingly */}
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            The tools you need to{" "}
            <span className="text-gradient-hero">
              manage your poultry farm with confidence.
            </span>
          </h2>

          {/* Supporting copy */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            AgroSense brings flock management, production tracking, poultry
            health, and market intelligence together in one place — giving you
            a clearer picture of your farm and helping you make better
            decisions every day.
          </p>
        </div>

        {/* ========================================
            FEATURES
        ======================================== */}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ========================================
              MAIN FEATURE — FLOCK MANAGEMENT
          ======================================== */}

          <div className="lg:col-span-2">
            <div
              className="
                group relative h-full overflow-hidden rounded-3xl
                border border-border/60
                bg-card
                p-8
                transition-all duration-500
                hover:border-flock/30
                hover:shadow-xl
                hover:shadow-primary/5
                sm:p-10
              "
            >
              {/* Background glow — using domain color */}
              <div
                className="
                  pointer-events-none absolute
                  -right-24 -top-24
                  h-72 w-72
                  rounded-full
                  bg-flock/20
                  blur-3xl
                  transition-all duration-700
                  group-hover:bg-flock/30
                "
                aria-hidden="true"
              />

              <div className="relative z-10 flex h-full flex-col">
                {/* Icon — using domain color */}
                <div
                  className="
                    inline-flex h-14 w-14
                    items-center justify-center
                    rounded-2xl
                    bg-flock
                    text-flock-foreground
                    transition-transform duration-300
                    group-hover:scale-105
                  "
                >
                  <MainIcon className="h-7 w-7" aria-hidden="true" />
                </div>

                {/* Title */}
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {mainFeature.title}
                </h3>

                {/* Description */}
                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {mainFeature.description}
                </p>

                {/* Highlights — using domain color for checkmarks */}
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {mainFeature.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-flock/20">
                        <Check
                          className="h-3 w-3 text-flock-foreground"
                          aria-hidden="true"
                        />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Learn more — using domain color */}
                <div className="mt-auto pt-8">
                  <Link
                    href={mainFeature.href}
                    className="
                      group/link
                      inline-flex items-center gap-2
                      text-sm font-medium
                      text-flock-foreground
                      transition-colors
                      hover:text-flock-foreground/80
                    "
                  >
                    Learn more about flock management
                    <ArrowRight
                      className="
                        h-4 w-4
                        transition-transform duration-300
                        group-hover/link:translate-x-1
                      "
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================
              SECONDARY FEATURES
          ======================================== */}

          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            {otherFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.id}
                  className={`
                    group relative overflow-hidden
                    rounded-3xl
                    border border-border/60
                    bg-card
                    p-6
                    transition-all duration-300
                    ${feature.borderColor}
                    hover:shadow-lg
                    hover:shadow-primary/5
                  `}
                >
                  {/* Subtle glow — using domain color */}
                  <div
                    className={`
                      pointer-events-none absolute
                      -right-16 -top-16
                      h-32 w-32
                      rounded-full
                      ${feature.bgColor}/20
                      opacity-0
                      blur-3xl
                      transition-opacity duration-500
                      group-hover:opacity-100
                    `}
                    aria-hidden="true"
                  />

                  <div className="relative z-10">
                    {/* Icon — using domain color */}
                    <div
                      className={`
                        inline-flex h-11 w-11
                        items-center justify-center
                        rounded-xl
                        ${feature.bgColor}
                        ${feature.iconColor}
                        transition-transform duration-300
                        group-hover:scale-105
                      `}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    {/* Title */}
                    <h3 className="mt-5 text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>

                    {/* Small link — using domain color */}
                    <Link
                      href={feature.href}
                      className="
                        group/link
                        mt-4 inline-flex items-center gap-1.5
                        text-xs font-medium
                        text-primary-text
                        transition-colors
                        hover:text-foreground
                      "
                    >
                      Learn more
                      <ArrowRight
                        className="
                          h-3.5 w-3.5
                          transition-transform duration-300
                          group-hover/link:translate-x-1
                        "
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================
            FOUR PILLARS — Using domain colors
        ======================================== */}

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="rounded-3xl border border-border/50 bg-card p-8">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
              <span className="text-muted-foreground font-medium">
                Built around four core pillars:
              </span>
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2 text-foreground/80">
                  <Bird className="h-4 w-4 text-flock-foreground" />
                  Flock
                </span>
                <span className="flex items-center gap-2 text-foreground/80">
                  <Egg className="h-4 w-4 text-production-foreground" />
                  Production
                </span>
                <span className="flex items-center gap-2 text-foreground/80">
                  <Syringe className="h-4 w-4 text-health-foreground" />
                  Health
                </span>
                <span className="flex items-center gap-2 text-foreground/80">
                  <TrendingUp className="h-4 w-4 text-market-foreground" />
                  Market
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CoreFeatures;