// app/dashboard/farms/[farmId]/poultry/components/FlockFinanceTab.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Wheat, Egg, Package, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flock } from "../types";

interface FlockFinanceTabProps {
  flock: Flock;
}

export function FlockFinanceTab({ flock }: FlockFinanceTabProps) {
  const totalRevenue = flock.revenueTotal || 0;
  const totalCost = flock.feedCostTotal || 0;
  const netProfit = flock.netProfit || 0;
  const roiPercent = flock.roiPercent || 0;
  const isProfitable = netProfit > 0;

  // Calculate daily averages
  const placementDate = new Date(flock.placementDate);
  const today = new Date();
  const daysInProduction = Math.floor((today.getTime() - placementDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  
  const avgDailyCost = totalCost / daysInProduction;
  const avgDailyRevenue = totalRevenue / daysInProduction;
  const projectedTotalCost = avgDailyCost * (flock.targetDays || 42);
  const projectedProfit = totalRevenue - projectedTotalCost;

  return (
    <div className="space-y-5">
      {/* Revenue Breakdown */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Revenue Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {flock.type === "layers" ? (
                <Egg className="h-4 w-4 text-amber-500" />
              ) : (
                <Package className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm">
                {flock.type === "layers" ? "Egg Sales" : "Meat Sales"}
              </span>
            </div>
            <span className="font-semibold">KES {totalRevenue.toLocaleString()}</span>
          </div>
          {totalRevenue === 0 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              No revenue recorded yet. Add sales records.
            </p>
          )}
        </div>
      </Card>

      {/* Cost Breakdown */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Cost Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Feed Cost</span>
            </div>
            <span className="font-semibold text-rose-600">KES {totalCost.toLocaleString()}</span>
          </div>
          <Progress value={100} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            Feed is the primary cost driver for this flock
          </p>
        </div>
      </Card>

      {/* Daily Averages */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Daily Averages</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Avg Daily Cost</p>
            <p className="text-lg font-bold text-rose-600">KES {avgDailyCost.toFixed(0)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Avg Daily Revenue</p>
            <p className="text-lg font-bold text-emerald-600">KES {avgDailyRevenue.toFixed(0)}</p>
          </div>
        </div>
      </Card>

      {/* Projections */}
      {flock.type === "broilers" && flock.targetDays && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Projections</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Projected Total Cost</span>
                <span className="font-semibold">KES {projectedTotalCost.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Projected Profit</span>
                <span className={cn(
                  "font-semibold",
                  projectedProfit > 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  KES {projectedProfit.toFixed(0)}
                </span>
              </div>
            </div>
            <Progress 
              value={Math.min(100, (daysInProduction / (flock.targetDays || 42)) * 100)} 
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground text-center">
              {flock.targetDays - daysInProduction} days remaining to harvest
            </p>
          </div>
        </Card>
      )}

      {/* Profitability Insight */}
      <Card className={cn(
        "p-4",
        isProfitable ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"
      )}>
        <div className="flex items-center gap-2">
          {isProfitable ? (
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-rose-600" />
          )}
          <p className={cn(
            "text-sm font-medium",
            isProfitable ? "text-emerald-700" : "text-rose-700"
          )}>
            {isProfitable 
              ? `This flock is profitable with a ${roiPercent.toFixed(0)}% ROI`
              : `This flock is currently operating at a loss`
            }
          </p>
        </div>
      </Card>
    </div>
  );
}