// app/dashboard/farms/[farmId]/poultry/components/FlockHealthTab.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Syringe, Activity, Calendar, Weight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flock } from "../types";

interface FlockHealthTabProps {
  flock: Flock;
}

export function FlockHealthTab({ flock }: FlockHealthTabProps) {
  const mortalityCount = flock.initialCount - flock.currentCount;
  const mortalityRate = (mortalityCount / flock.initialCount) * 100;
  const expectedMortality = flock.expectedMortalityPercent || 5;
  const isMortalityGood = mortalityRate <= expectedMortality;
  
  // Calculate daily mortality trend (mock - would come from records)
  const dailyMortalityAvg = mortalityCount / 30; // Assuming 30 days avg
  const isTrendImproving = dailyMortalityAvg < (expectedMortality / 100) * flock.currentCount / 30;

  return (
    <div className="space-y-5">
      {/* Mortality Overview */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Mortality Overview</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{mortalityCount}</p>
            <p className="text-xs text-muted-foreground">Total Deaths</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className={cn(
              "text-2xl font-bold",
              isMortalityGood ? "text-emerald-600" : "text-rose-600"
            )}>
              {mortalityRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Mortality Rate</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{expectedMortality}%</p>
            <p className="text-xs text-muted-foreground">Target Rate</p>
          </div>
        </div>
      </Card>

      {/* Mortality Trend */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Mortality Trend</h3>
          <div className="flex items-center gap-1">
            {isTrendImproving ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {isTrendImproving ? "Improving" : "Needs Attention"}
            </span>
          </div>
        </div>
        <Progress 
          value={Math.min(100, (mortalityRate / expectedMortality) * 100)} 
          className={cn("h-2", isMortalityGood ? "bg-emerald-100" : "bg-rose-100")}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Current: {mortalityRate.toFixed(1)}%</span>
          <span>Target: {expectedMortality}%</span>
        </div>
      </Card>

      {/* Vaccination Schedule */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Syringe className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold">Vaccination Schedule</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="text-sm font-medium">Newcastle Disease</p>
              <p className="text-xs text-muted-foreground">Day 1, Day 21</p>
            </div>
            <Badge variant="outline" className="text-[10px]">Due soon</Badge>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="text-sm font-medium">Infectious Bronchitis</p>
              <p className="text-xs text-muted-foreground">Day 14</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Scheduled</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Fowl Pox</p>
              <p className="text-xs text-muted-foreground">Week 8</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Upcoming</Badge>
          </div>
        </div>
      </Card>

      {/* Health Recommendations */}
      {!isMortalityGood && (
        <Card className="p-4 border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-400">Recommendations</h4>
              <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                <li>• Review feed quality and water sanitation</li>
                <li>• Check ventilation and temperature in the house</li>
                <li>• Consult veterinarian for health assessment</li>
                <li>• Consider adding electrolytes to water</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";