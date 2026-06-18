// components/charts/ProductionChart.tsx
"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmCharts, TimeRange } from "@/lib/hooks/useFarmCharts";

interface ProductionChartProps {
  farmId: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-xs font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Eggs Produced:</span>
          <span className="font-mono font-medium">{payload[0]?.value?.toLocaleString()} eggs</span>
        </div>
      </div>
    </div>
  );
}

export function ProductionChart({ farmId }: ProductionChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const { production, isLoading, isProductionError } = useFarmCharts(farmId, timeRange);

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

  const hasData = production?.daily?.some((d: any) => d.eggs > 0);
  
  // Calculate average from available data
  const totalEggs = production?.daily?.reduce((sum: number, d: any) => sum + d.eggs, 0) || 0;
  const avgValue = production?.daily?.length > 0 ? totalEggs / production.daily.length : 0;
  
  // Calculate trend from data
  const data = production?.daily || [];
  const recentAvg = data.slice(-3).reduce((sum: number, d: any) => sum + d.eggs, 0) / 3;
  const prevAvg = data.slice(-6, -3).reduce((sum: number, d: any) => sum + d.eggs, 0) / 3;
  const percentChange = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;
  const trend = percentChange > 5 ? "up" : percentChange < -5 ? "down" : "stable";

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header with time range selector */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-medium">Egg Production</h3>
            <p className="text-xs text-muted-foreground">{getRangeLabel()}</p>
          </div>
          
          {/* Time Range Toggle - Always enabled */}
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

        {/* Summary - Show even if no data */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Average {timeRange === "year" ? "Monthly" : "Daily"} Production</p>
            <p className="text-lg font-bold">{Math.round(avgValue).toLocaleString()} eggs</p>
            {hasData && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs",
                trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"
              )}>
                {trend === "up" && <TrendingUp className="h-3 w-3" />}
                {trend === "down" && <TrendingDown className="h-3 w-3" />}
                {trend === "stable" && <Minus className="h-3 w-3" />}
                {Math.abs(percentChange) > 0 && <span>{Math.abs(percentChange).toFixed(0)}% trend</span>}
              </div>
            )}
          </div>
        </div>

        {/* Chart or Empty State with Hint */}
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={production.daily}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                interval={timeRange === "year" ? 1 : 0}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={avgValue} 
                stroke="#f59e0b" 
                strokeDasharray="5 5" 
                label={{ value: "Avg", fill: "#f59e0b", fontSize: 11, position: "right" }} 
              />
              <Bar 
                dataKey="eggs" 
                name="Eggs" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">No production data for {getRangeLabel().toLowerCase()}</p>
            <p className="text-xs text-muted-foreground">
              Try selecting a different time range or add flock records
            </p>
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