// src/app/(public)/features/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  BarChart3,
  Bell,
  Cloud,
  Download,
  Users,
  Smartphone,
  Zap,
  ZoomIn,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Features page -- rebuilt against globals.css v3.
 *
 * Design choice worth flagging explicitly: this is the first place
 * --font-serif (Fraunces) gets used. Sans (Manrope) stays for body
 * copy and UI; serif is reserved for the two largest display
 * headlines (page H1, each result's H2) to give the page an
 * editorial, considered feel rather than "bold sans everywhere."
 * Easy to revert -- just drop `font-serif` from those two spots if
 * it doesn't read the way you want in practice.
 *
 * Still outcome-first (see the earlier honesty pass): no fabricated
 * testimonials, no invented stats, no invented pricing tiers. CTA
 * copy matches the homepage hero exactly.
 *
 * TODO: the testimonial slot in each result block is intentionally
 * empty -- wire to real customer feedback once it exists, never an
 * invented one.
 * TODO: confirm every "more features" grid item is actually built
 * before shipping (inherited list, not verified against real scope).
 */

interface Result {
  id: string;
  icon: React.ElementType;
  result: string;
  description: string;
  how: string;
  image: string;
  bgClass: string;
  iconClass: string;
  tag: string;
}

const results: Result[] = [
  {
    id: "flock",
    icon: HeartPulse,
    result: "Catch health problems while they're still small",
    description:
      "A sick bird you notice on day one is a minor issue. The same problem, missed for a week, can spread through the whole flock.",
    how: "AgroSense tracks mortality patterns, vaccination schedules, and health events as you log them, so a change in your flock's health shows up as a trend you can act on -- not a surprise at the end of the month.",
    image: "/dashboardscreenshot.png",
    bgClass: "bg-flock",
    iconClass: "text-flock-foreground",
    tag: "Health",
  },
  {
    id: "production",
    icon: LineChart,
    result: "Know when production is slipping, not just that it did",
    description:
      "A production drop is easy to notice weeks later, once it's already shown up in your income. It's much harder to notice while it's still small.",
    how: "Daily egg and feed logging builds a real trend line for every flock, so a dip shows up against your own farm's normal -- not a generic benchmark.",
    image: "/screenshots/production.png",
    bgClass: "bg-production",
    iconClass: "text-production-foreground",
    tag: "Production",
  },
  {
    id: "health-cost",
    icon: ShieldCheck,
    result: "See exactly where feed and treatment costs are going",
    description:
      "Feed is usually the single largest cost on a poultry operation. Most of that cost is invisible until you're tracking it flock by flock.",
    how: "Log feed consumption and health-related costs per flock, and see conversion and cost patterns you can actually compare over time.",
    image: "/screenshots/health.png",
    bgClass: "bg-health",
    iconClass: "text-health-foreground",
    tag: "Costs",
  },
  {
    id: "market",
    icon: TrendingUp,
    result: "Decide when to sell based on the market, not just cash flow",
    description:
      "Poultry prices move. Selling because you need cash today, rather than because the price is right, is a decision most farmers make more often than they'd like.",
    how: "Check current and recent poultry market prices before you sell -- no account needed to look.",
    image: "/screenshots/market.png",
    bgClass: "bg-market",
    iconClass: "text-market-foreground",
    tag: "Market",
  },
];

const moreFeatures = [
  { icon: BarChart3, title: "Farm analytics", description: "Visual trends across flocks, not just raw numbers." },
  { icon: Bell, title: "Alerts", description: "Get notified when something needs your attention." },
  { icon: Cloud, title: "Cloud sync", description: "Your data follows you across devices." },
  { icon: Download, title: "Data export", description: "Take your records with you for reporting or backup." },
  { icon: Users, title: "Team access", description: "Bring in the people who help run the farm." },
  { icon: Smartphone, title: "Works on mobile", description: "Log data from the poultry house, not just a desk." },
  { icon: Zap, title: "Quick daily entry", description: "Recording today's numbers shouldn't take long." },
  { icon: ShieldCheck, title: "Private by default", description: "Your farm data belongs to you." },
];

export default function FeaturesPage() {
  return (
    <div className="py-16 md:py-24 bg-background">
      <div className="container-custom">
        {/* ========================================
            PAGE HEADER -- serif display headline
        ======================================== */}

        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge className="mb-6 border-primary/15 bg-primary/5 text-primary">
            What AgroSense helps you do
          </Badge>

          <h1 className="font-serif font-medium tracking-tight text-foreground text-balance">
            <span className="block">See what&apos;s happening on your farm</span>
            <span className="text-gradient-hero">before it costs you.</span>
          </h1>

          <p className="mt-6 text-lg text-foreground-muted leading-relaxed max-w-xl mx-auto">
            AgroSense gives you visibility into your flock, production,
            costs, and the market -- so decisions are based on what&apos;s
            actually happening, not a guess.
          </p>
        </div>

        {/* ========================================
            PROBLEM / SOLUTION
        ======================================== */}

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          <div className="card-premium p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-danger-bg px-3 py-1 mb-6">
              <AlertCircle className="h-3.5 w-3.5 text-danger" />
              <span className="text-xs font-semibold uppercase tracking-wider text-danger">
                Without visibility
              </span>
            </div>
            <ul className="space-y-4">
              {[
                "Health issues noticed only once they've already spread",
                "Buying and selling decisions made on instinct or cash need",
                "Paper records that get lost, damaged, or never compared",
                "Reacting to problems after they've already cost you",
              ].map((item) => (
                <li key={item} className="text-sm text-foreground-muted leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card-premium p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-success-bg px-3 py-1 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-semibold uppercase tracking-wider text-success">
                With AgroSense
              </span>
            </div>
            <ul className="space-y-4">
              {[
                "Health trends visible flock by flock, as you log them",
                "Market prices you can check before you decide to sell",
                "Records kept in one place, not scattered notebooks",
                "A running history you can actually look back on",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ========================================
            RESULTS
        ======================================== */}

        <div className="space-y-28">
          {results.map((result, index) => {
            const Icon = result.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={result.id}
                className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center scroll-mt-20"
                id={result.id}
              >
                <div className={cn("relative order-1", isEven ? "lg:order-1" : "lg:order-2")}>
                  <div className="card-premium group relative overflow-hidden">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <Image
                        src={result.image}
                        alt={result.result}
                        fill
                        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-foreground/40">
                        <div className="rounded-full bg-white/20 backdrop-blur-sm p-3">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "absolute top-0 left-0 h-1 w-full transition-all duration-300 rounded-t-xl",
                        result.bgClass,
                        "group-hover:h-1.5"
                      )}
                    />
                  </div>
                </div>

                <div className={cn("order-2", isEven ? "lg:order-2" : "lg:order-1")}>
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-5",
                      result.bgClass,
                      result.iconClass
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {result.tag}
                  </div>

                  <h2 className="font-serif font-medium text-2xl md:text-3xl text-foreground text-balance">
                    {result.result}
                  </h2>

                  <p className="mt-4 text-base text-foreground/80 leading-relaxed">
                    {result.description}
                  </p>

                  <div className="mt-5 p-4 rounded-xl bg-muted border border-card-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">How:</span> {result.how}
                    </p>
                  </div>

                  {/* Real testimonial slot -- intentionally empty. */}

                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-2 mt-6 text-sm font-medium text-primary transition-colors hover:text-accent"
                  >
                    Try it yourself
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================
            MORE FEATURES
        ======================================== */}

        <div className="mt-28">
          <div className="text-center mb-14">
            <h2 className="font-serif font-medium text-2xl md:text-3xl text-foreground">
              Everything you need to run your farm
            </h2>
            <p className="text-foreground-muted mt-3">All in one place.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {moreFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card p-5 text-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">{feature.title}</h4>
                  <p className="text-xs text-foreground-subtle mt-1.5 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================
            FINAL CTA
        ======================================== */}

        <div className="mt-28 text-center card-premium p-10 md:p-16">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-serif font-medium text-2xl md:text-3xl text-foreground">
              Ready to see this on your farm?
            </h3>
            <p className="text-foreground-muted text-sm mt-3">
              Start tracking your flock today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-accent text-accent-foreground hover:shadow-lg"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                <Link href="/register">
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/market">Explore poultry market</Link>
              </Button>
            </div>
            <p className="text-xs text-foreground-subtle mt-5">No credit card required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}