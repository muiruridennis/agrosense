'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play, CheckCircle2, Leaf, Camera, Bell, TrendingUp, Syringe, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-background to-secondary-50/50 dark:from-primary-950/20 dark:via-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-secondary-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-sm font-medium text-primary">
                Trusted by 10,000+ farmers
              </span>
            </div>

            {/* Headline - Wider positioning */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Make smarter decisions
              <span className="text-primary block mt-2">across your entire farm.</span>
            </h1>

            {/* Subheadline - Mentions multiple features */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
              Track crops and livestock. Catch diseases early. Get weather alerts. 
              Know your real profit. All in one place.
            </p>

            {/* CTA Buttons - Fixed mismatch */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button asChild size="lg" variant="secondary" className="gap-2 px-8">
                <Link href="/auth/register">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 px-8">
                <Link href="/demo">
                  <Play className="w-4 h-4" />
                  See How It Works
                </Link>
              </Button>
            </div>

            {/* Trust indicators - Keep these */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right Column - Image with Data Overlay (Keep as is - shows multiple features) */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
              <div className="aspect-4/3 relative bg-gradient-to-br from-primary-900/20 to-secondary-900/20">
                <Image
                  src="/hero2.jpg"
                  alt="Farm management dashboard preview"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>

              {/* Card 1 - Disease Detection (Crops) */}
              <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border max-w-[200px] animate-slide-in-right">
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">Crop Health</span>
                </div>
                <p className="text-sm font-semibold">Late Blight Detected</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className="text-sm font-bold text-success">96%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-1">
                  <div className="bg-success h-1 rounded-full" style={{ width: '96%' }} />
                </div>
              </div>

              {/* Card 2 - Weather Alert (Shows advisory feature) */}
              <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border max-w-[180px] animate-fade-in-up">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-500">Weather Alert</span>
                </div>
                <p className="text-sm font-semibold">Heavy rain expected</p>
                <p className="text-xs text-muted-foreground">Tomorrow • 15-20mm</p>
              </div>

              {/* Card 3 - Yield Forecast (Shows analytics) */}
              <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border max-w-[170px] animate-fade-in-up animation-delay-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-accent" />
                  <span className="text-xs font-semibold text-accent">Yield Forecast</span>
                </div>
                <p className="text-lg font-bold">+32%</p>
                <p className="text-xs text-muted-foreground">vs. last season</p>
              </div>
            </div>

            {/* Stats bar - Shows platform benefits */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">98%</div>
                <div className="text-xs text-muted-foreground">Detection accuracy</div>
              </div>
              <div className="text-center border-x border-border">
                <div className="text-2xl font-bold text-primary">40%</div>
                <div className="text-xs text-muted-foreground">Avg. yield increase</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-xs text-muted-foreground">Expert support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}