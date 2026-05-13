// src/components/sections/ResultsSection.tsx
'use client';

import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

const results = [
  {
    farmer: "James Mwangi",
    location: "Nakuru, Kenya",
    type: "Maize Farmer",
    before: {
      yield: "18 bags/acre",
      loss: "40% to disease",
      profit: "KES 35,000"
    },
    after: {
      yield: "32 bags/acre",
      loss: "8% to disease",
      profit: "KES 78,000"
    },
    improvement: "+78% profit"
  },
  {
    farmer: "Grace Atieno",
    location: "Kisumu, Kenya",
    type: "Dairy Farmer",
    before: {
      yield: "8 litres/cow/day",
      loss: "Missed vaccinations",
      profit: "KES 12,000/month"
    },
    after: {
      yield: "14 litres/cow/day",
      loss: "100% vaccination rate",
      profit: "KES 28,000/month"
    },
    improvement: "+133% profit"
  },
  {
    farmer: "Peter Omondi",
    location: "Eldoret, Kenya",
    type: "Mixed Farm",
    before: {
      yield: "Unknown",
      loss: "No expense tracking",
      profit: "Guessing"
    },
    after: {
      yield: "Clear data",
      loss: "Reduced by 50%",
      profit: "KES 145,000/season"
    },
    improvement: "Now profitable"
  }
];

export function ResultsSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Real farmers. Real results.
          </h2>
          <p className="text-lg text-muted-foreground">
            Not promises. What farmers actually achieved with AgroSense.
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {results.map((result, index) => (
            <div key={index} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Farmer Header */}
              <div className="p-5 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {result.farmer.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{result.farmer}</h3>
                    <p className="text-xs text-muted-foreground">{result.location}</p>
                    <p className="text-xs text-primary mt-0.5">{result.type}</p>
                  </div>
                </div>
              </div>

              {/* Before/After Comparison */}
              <div className="p-5 space-y-4">
                {/* Before */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <span className="text-xs font-semibold text-destructive">BEFORE</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Yield</span>
                      <span>{result.before.yield}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Losses</span>
                      <span className="text-destructive">{result.before.loss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <span>{result.before.profit}</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>

                {/* After */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs font-semibold text-success">AFTER</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Yield</span>
                      <span className="font-medium">{result.after.yield}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Losses</span>
                      <span className="text-success">{result.after.loss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <span className="font-bold text-primary">{result.after.profit}</span>
                    </div>
                  </div>
                </div>

                {/* Improvement Badge */}
                <div className="mt-3 pt-3 border-t border-border text-center">
                  <span className="inline-block bg-success/10 text-success text-sm font-semibold px-3 py-1 rounded-full">
                    {result.improvement}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}