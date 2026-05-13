'use client';

import { UserPlus, Tractor, Smartphone, BarChart3 } from 'lucide-react';

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign up",
    description: "Create your account in 2 minutes. No credit card required.",
    time: "2 min"
  },
  {
    number: "02",
    icon: Tractor,
    title: "Set up your farm",
    description: "Add your fields, crops, and livestock. We'll guide you through.",
    time: "5 min"
  },
  {
    number: "03",
    icon: Smartphone,
    title: "Use daily",
    description: "Log activities, take photos, get alerts. Works offline too.",
    time: "5 min/day"
  },
  {
    number: "04",
    icon: BarChart3,
    title: "See insights",
    description: "Track progress, catch problems early, improve yields.",
    time: "30 days to results"
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start in minutes. See results in weeks.
          </h2>
          <p className="text-lg text-muted-foreground">
            No training required. Works on any phone, even with poor internet.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Step Number */}
              <div className="text-4xl font-bold text-primary/20 mb-4">
                {step.number}
              </div>
              {/* Icon */}
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              {/* Title */}
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              {/* Description */}
              <p className="text-muted-foreground text-sm mb-2">{step.description}</p>
              {/* Time Badge */}
              <span className="inline-block text-xs bg-muted px-2 py-1 rounded-full">
                ⏱️ {step.time}
              </span>
            </div>
          ))}
        </div>

        {/* Offline Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            <Smartphone className="w-4 h-4" />
            <span>Works offline • Syncs when connected • SMS alerts available</span>
          </div>
        </div>
      </div>
    </section>
  );
}