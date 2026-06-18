// app/dashboard/farms/[farmId]/poultry/components/FlockStatusCards.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Egg, Target, Wheat, Droplets, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flock } from "../types";

interface FlockStatusCardsProps {
  flock: Flock;
}

export function FlockStatusCards({ flock }: FlockStatusCardsProps) {
  const placementDate = new Date(flock.placementDate);
  const today = new Date();
  const daysInProduction = Math.floor((today.getTime() - placementDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetDays = flock.targetDays || 42;
  const progressPercent = Math.min(100, (daysInProduction / targetDays) * 100);

  const mortalityCount = flock.initialCount - flock.currentCount;
  const mortalityRate = (mortalityCount / flock.initialCount) * 100;
  const expectedMortality = flock.expectedMortalityPercent || 5;
  const isMortalityGood = mortalityRate <= expectedMortality;
  const isHighMortality = mortalityRate > expectedMortality * 1.5;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-sm font-semibold">Health & Production Status</h3>

      {/* Mortality Status */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {isMortalityGood ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className={cn("h-4 w-4", isHighMortality ? "text-rose-500" : "text-amber-500")} />
            )}
            <span className="text-sm font-medium">Mortality Rate</span>
          </div>
          <span className={cn(
            "text-sm font-semibold",
            isMortalityGood ? "text-emerald-600" : isHighMortality ? "text-rose-600" : "text-amber-600"
          )}>
            {mortalityRate.toFixed(1)}% / {expectedMortality}%
          </span>
        </div>
        <Progress 
          value={Math.min(100, (mortalityRate / expectedMortality) * 100)} 
          className={cn(
            "h-2",
            isMortalityGood ? "bg-emerald-100" : isHighMortality ? "bg-rose-100" : "bg-amber-100"
          )}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          {mortalityCount} birds lost ({flock.initialCount - flock.currentCount} total)
        </p>
        {!isMortalityGood && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Mortality exceeds target. Review health protocols.
          </p>
        )}
      </div>

      {/* Production Progress (Broilers) */}
      {flock.type === "broilers" && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Production Progress</span>
            </div>
            <span className="text-sm font-semibold">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>Day {daysInProduction}</span>
            <span>Target Day {targetDays}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {targetDays - daysInProduction} days remaining until harvest
          </p>
        </div>
      )}

      {/* Egg Production (Layers) */}
      {flock.type === "layers" && flock.productionStartWeek && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Egg className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Egg Production</span>
            </div>
            <span className="text-sm font-semibold">Week {flock.productionStartWeek}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Production expected to start at week {flock.productionStartWeek}
          </p>
          {daysInProduction >= flock.productionStartWeek * 7 && (
            <p className="text-xs text-emerald-600 mt-1">
              ✓ Should be in production now
            </p>
          )}
        </div>
      )}

      {/* Feed Status */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Wheat className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Feed Consumption</span>
          </div>
          <span className="text-sm font-semibold">{flock.feedCostTotal.toLocaleString()} KES</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Total feed cost incurred to date
        </p>
      </div>

      {/* Expected Daily Feed (if available) */}
      {flock.expectedDailyFeedPerBirdGrams && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Expected Daily Feed</span>
            </div>
            <span className="text-sm font-semibold">{flock.expectedDailyFeedPerBirdGrams} g/bird</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Industry benchmark for this breed
          </p>
        </div>
      )}
    </Card>
  );
}