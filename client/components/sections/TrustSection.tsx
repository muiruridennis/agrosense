// src/components/sections/TrustSection.tsx
'use client';

import { Shield, Lock, MessageCircle, Database, Award, Clock } from 'lucide-react';

const trustPoints = [
  {
    icon: Shield,
    title: "Bank-level security",
    description: "Your data is encrypted. We never sell your information."
  },
  {
    icon: MessageCircle,
    title: "24/7 WhatsApp support",
    description: "Real humans. In English and Swahili."
  },
  {
    icon: Lock,
    title: "Your data is yours",
    description: "Export anytime. Cancel anytime. No lock-in."
  },
  {
    icon: Database,
    title: "Works offline",
    description: "No internet? No problem. Syncs when connected."
  },
  {
    icon: Award,
    title: "Trusted by cooperatives",
    description: "Used by 50+ farmer cooperatives across East Africa."
  },
  {
    icon: Clock,
    title: "14-day free trial",
    description: "No credit card required. See if it works for you."
  }
];

export function TrustSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for farmers. Backed by trust.
          </h2>
          <p className="text-lg text-muted-foreground">
            We take your farm data as seriously as you take your farm.
          </p>
        </div>

        {/* Trust Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trustPoints.map((point, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <point.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{point.title}</h3>
              <p className="text-sm text-muted-foreground">{point.description}</p>
            </div>
          ))}
        </div>

        {/* Certification Badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-xs text-muted-foreground">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-xs text-muted-foreground">SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-xs text-muted-foreground">Daily Backups</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-xs text-muted-foreground">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </section>
  );
}