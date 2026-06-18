// app/dashboard/farms/[farmId]/poultry/components/FlockFinancialCard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Wheat, Egg, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flock } from "../../../types";

interface FlockFinancialCardProps {
  flock: Flock;
}

export function FlockFinancialCard({ flock }: FlockFinancialCardProps) {
  const totalRevenue = flock.revenueTotal || 0;
  const totalCost = flock.feedCostTotal || 0;
  const netProfit = flock.netProfit || 0;
  const roiPercent = flock.roiPercent || 0;
  const isProfitable = netProfit > 0;

  // Calculate cost per bird
  const costPerBird = flock.currentCount > 0 ? totalCost / flock.currentCount : 0;
  const revenuePerBird = flock.currentCount > 0 ? totalRevenue / flock.currentCount : 0;

  // Estimate revenue sources based on type
  const hasEggRevenue = flock.type === "layers" && totalRevenue > 0;
  const hasMeatRevenue = flock.type === "broilers" && totalRevenue > 0;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Financial Performance</h3>
        <Badge variant={isProfitable ? "default" : "destructive"} className="text-[10px]">
          {isProfitable ? "Profitable" : "Loss Making"}
        </Badge>
      </div>

      {/* Main Financial Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Revenue</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">
            KES {totalRevenue.toLocaleString()}
          </p>
          {hasEggRevenue && (
            <p className="text-[10px] text-muted-foreground">From egg sales</p>
          )}
          {hasMeatRevenue && (
            <p className="text-[10px] text-muted-foreground">From meat sales</p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Wheat className="h-4 w-4 text-rose-500" />
            <span className="text-xs text-muted-foreground">Feed Cost</span>
          </div>
          <p className="text-xl font-bold text-rose-600">
            KES {totalCost.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {costPerBird.toFixed(0)} KES per bird
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Net Profit</span>
          </div>
          <p className={cn(
            "text-xl font-bold",
            isProfitable ? "text-emerald-600" : "text-rose-600"
          )}>
            KES {netProfit.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {revenuePerBird.toFixed(0)} KES per bird
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <PiggyBank className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">ROI</span>
          </div>
          <p className={cn(
            "text-xl font-bold",
            roiPercent > 0 ? "text-emerald-600" : "text-rose-600"
          )}>
            {roiPercent.toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            Return on investment
          </p>
        </div>
      </div>

      {/* Break-even Analysis */}
      {flock.breakEvenTarget && (
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Break-even Analysis</p>
          <div className="flex justify-between text-sm">
            <span>Target:</span>
            <span className="font-semibold">KES {flock.breakEvenTarget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Current Profit:</span>
            <span className={cn(
              "font-semibold",
              netProfit >= flock.breakEvenTarget ? "text-emerald-600" : "text-amber-600"
            )}>
              KES {netProfit.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={Math.min(100, (netProfit / flock.breakEvenTarget) * 100)} 
            className="mt-2 h-1.5"
          />
        </div>
      )}

      {/* Profitability Insight */}
      <div className={cn(
        "rounded-lg p-2 text-center text-xs",
        isProfitable 
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/30"
      )}>
        {isProfitable 
          ? `✓ Profitable flock with ${roiPercent.toFixed(0)}% return on investment`
          : `⚠️ Loss-making flock. Review feed costs and pricing strategy.`
        }
      </div>
    </Card>
  );
}



