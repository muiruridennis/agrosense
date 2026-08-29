// src/components/sections/how-it-works.tsx
import { 
  UserPlus, 
  Plus, 
  ClipboardCheck, 
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Building2,
  Bird,
  Timer,
  Rocket,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Start your free trial in 47 seconds",
      description: "Just your email. No credit card. No commitment. Get instant access to everything you need to manage your flock.",
      details: [
        "Sign up with email",
        "No credit card required",
        "14-day free trial",
        "Instant access — start now"
      ],
      bgClass: "bg-primary/10",
      iconClass: "text-primary",
      borderClass: "border-primary/20",
      isSignup: true,
      timeBadge: "47 seconds",
    },
    {
      number: "02",
      icon: Building2,
      title: "Add your first flock",
      description: "Name your flock, set the breed, tell us how many birds — and you're ready to start tracking.",
      details: [
        "Name your flock",
        "Select breed and age",
        "Set bird count and housing",
        "Start tracking immediately"
      ],
      bgClass: "bg-flock/10",
      iconClass: "text-flock-foreground",
      borderClass: "border-flock/20",
      isSignup: false,
      timeBadge: "2 minutes",
    },
    {
      number: "03",
      icon: Bird,
      title: "Log today's production in seconds",
      description: "Record eggs, feed, mortality, and health events. No paperwork, no spreadsheets — just simple daily logging.",
      details: [
        "Log egg production",
        "Track feed usage",
        "Record mortality",
        "Note health events"
      ],
      bgClass: "bg-production/10",
      iconClass: "text-production-foreground",
      borderClass: "border-production/20",
      isSignup: false,
      timeBadge: "12 seconds",
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "Make data-driven decisions",
      description: "See production trends, health alerts, and market prices in one place. Know exactly what's working — and what needs attention.",
      details: [
        "View production analytics",
        "Get health alerts",
        "Check market prices",
        "Export reports for records"
      ],
      bgClass: "bg-market/10",
      iconClass: "text-market-foreground",
      borderClass: "border-market/20",
      isSignup: false,
      timeBadge: "5 seconds",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-card border-b border-border/50">
      <div className="container-custom">
        {/* ========================================
            SECTION HEADER
        ======================================== */}

        <div className="mx-auto max-w-3xl text-center mb-14">
          <span className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Get started in 4 simple steps
          </span>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            From signup to insights{" "}
            <span className="text-gradient-hero">in minutes.</span>
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-muted-foreground">
            No complex setup, no training required. Just four simple steps
            to get your poultry farm data working for you.
          </p>
        </div>

        {/* ========================================
            STEPS — Grid Layout
        ======================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group relative bg-card rounded-2xl border border-border/50 p-6 transition-all duration-300 hover:border-border/80 hover:shadow-lg hover:shadow-primary/5 flex flex-col"
              >
                {/* Time badge */}
                {step.timeBadge && (
                  <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                    <Timer className="h-3 w-3" />
                    {step.timeBadge}
                  </div>
                )}

                {/* Step number badge */}
                <div className={`
                  inline-flex h-8 w-8 items-center justify-center
                  rounded-full border-2 ${step.borderClass}
                  bg-background text-xs font-bold ${step.iconClass}
                  mb-4
                `}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`
                  inline-flex h-11 w-11 items-center justify-center
                  rounded-xl ${step.bgClass} ${step.iconClass}
                  mb-3 transition-transform duration-300 group-hover:scale-105
                `}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-foreground mb-1.5 leading-tight">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3 flex-1 leading-relaxed">
                  {step.description}
                </p>

                {/* Details list — compact */}
                <ul className="space-y-1.5">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 
                        className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${step.iconClass}`}
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA inside Step 1 */}
                {step.isSignup && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      asChild
                      size="sm"
                      className="group w-full h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Link href="/register">
                        Create your account
                        <ArrowRight
                          className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                      Free 14-day trial · No credit card
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ========================================
            BOTTOM CTA — Enhanced
        ======================================== */}

        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-4 sm:flex-row sm:gap-6 bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-2xl border border-border/50 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">2,500+</span>
                <span>farmers already using AgroSense</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <Button
                asChild
                size="default"
                className="group h-11 rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02]"
              >
                <Link href="/register">
                  Start your free trial
                  <ArrowRight
                    className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-amber-400" />
                No credit card required
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;