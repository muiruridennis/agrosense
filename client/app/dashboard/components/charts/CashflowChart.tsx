// components/charts/CashflowChart.tsx
"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmCharts, TimeRange } from "@/lib/hooks/useFarmCharts";

interface CashflowChartProps {
  farmId: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-xs font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Revenue:</span>
          <span className="font-mono font-medium text-emerald-600">
            KES {payload[0]?.value?.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Costs:</span>
          <span className="font-mono font-medium text-rose-600">
            KES {payload[1]?.value?.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 pt-1 border-t border-border/50">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Profit:</span>
            <span className={cn(
              "font-mono font-medium",
              (payload[0]?.value - payload[1]?.value) >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              KES {(payload[0]?.value - payload[1]?.value).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CashflowChart({ farmId }: CashflowChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const { cashflow, isLoading, isCashflowError } = useFarmCharts(farmId, timeRange);

  const getRangeLabel = () => {
    switch (timeRange) {
      case "week": return "Last 7 days";
      case "month": return "Last 30 days";
      case "year": return "Last 12 months";
    }
  };

  const handleRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <Skeleton className="h-[200px] w-full" />
        </div>
      </Card>
    );
  }

  const hasData = cashflow?.daily?.some((d: any) => d.revenue > 0 || d.costs > 0);
  
  // Calculate net profit from available data
  const totalRevenue = cashflow?.daily?.reduce((sum: number, d: any) => sum + d.revenue, 0) || 0;
  const totalCosts = cashflow?.daily?.reduce((sum: number, d: any) => sum + d.costs, 0) || 0;
  const netProfit = totalRevenue - totalCosts;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header with time range selector */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-medium">Cash Flow</h3>
            <p className="text-xs text-muted-foreground">{getRangeLabel()}</p>
          </div>
          
          {/* Time Range Toggle - Always enabled, even if no data */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            <button
              onClick={() => handleRangeChange("week")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                timeRange === "week"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Week
            </button>
            <button
              onClick={() => handleRangeChange("month")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                timeRange === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              onClick={() => handleRangeChange("year")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                timeRange === "year"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Year
            </button>
          </div>
        </div>

        {/* Profit Summary - Show even if no data (will show 0) */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Net Profit ({getRangeLabel()})</p>
            <p className={cn("text-lg font-bold", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
              KES {netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Chart or Empty State with Hint to Switch Range */}
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cashflow.daily}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                interval={timeRange === "year" ? 1 : 0}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                tickLine={false} 
                tickFormatter={(v) => `KES ${v/1000}k`} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#10b981" 
                fill="url(#revenueGrad)" 
                strokeWidth={2} 
              />
              <Area 
                type="monotone" 
                dataKey="costs" 
                name="Costs" 
                stroke="#ef4444" 
                fill="url(#costsGrad)" 
                strokeWidth={2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">No data for {getRangeLabel().toLowerCase()}</p>
            <p className="text-xs text-muted-foreground">
              Try selecting a different time range or add revenue/cost entries
            </p>
            {/* Quick hint buttons */}
            <div className="flex gap-2 mt-2">
              {timeRange !== "week" && (
                <button
                  onClick={() => handleRangeChange("week")}
                  className="text-xs text-primary hover:underline"
                >
                  Try Week view
                </button>
              )}
              {timeRange !== "month" && (
                <button
                  onClick={() => handleRangeChange("month")}
                  className="text-xs text-primary hover:underline"
                >
                  Try Month view
                </button>
              )}
              {timeRange !== "year" && (
                <button
                  onClick={() => handleRangeChange("year")}
                  className="text-xs text-primary hover:underline"
                >
                  Try Year view
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}