"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import type { Flock } from "../../../types";

interface FlockForecastCardProps {
  forecast?: {
    ageInDays: number;
    projectedDaysToHarvest: number;
    projectedFeedCost: number;
    projectedMortality: number;
    projectedRemainingBirds: number;
  };
  flock: Flock;
}

export function FlockForecastCard({ forecast, flock }: FlockForecastCardProps) {
  if (!forecast) return null;

  const totalDays = flock.targetDays || 42;
  const progressPercent = ((totalDays - forecast.projectedDaysToHarvest) / totalDays) * 100;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">📈 Forecast</h3>
        <span className="text-xs text-muted-foreground">
          Day {forecast.ageInDays} / {totalDays}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Production Progress</span>
          <span className="font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Forecast grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-xs text-muted-foreground">Days to Harvest</p>
          <p className="text-lg font-bold">{forecast.projectedDaysToHarvest}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-xs text-muted-foreground">Remaining Birds</p>
          <p className="text-lg font-bold">{forecast.projectedRemainingBirds?.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-xs text-muted-foreground">Projected Feed Cost</p>
          <p className="text-lg font-bold text-rose-600">
            KES {forecast.projectedFeedCost?.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-xs text-muted-foreground">Projected Mortality</p>
          <p className="text-lg font-bold text-amber-600">
            {forecast.projectedMortality} birds
          </p>
        </div>
      </div>

      {forecast.projectedDaysToHarvest <= 7 && (
        <div className="rounded-lg bg-amber-50 p-2 text-center text-xs text-amber-700 dark:bg-amber-950/30">
          ⚠️ Harvest approaching in {forecast.projectedDaysToHarvest} days
        </div>
      )}
    </Card>
  );
}