// components/charts/MortalityChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MortalityTooltip } from "./shared/ChartTooltips";
import { ChartSkeleton } from "./shared/ChartSkeleton";

interface MortalityChartProps {
  data: Array<{ week: string; rate: number; deaths: number }>;
  threshold: number;
  alerts: number;
  isLoading?: boolean;
}

export function MortalityChart({ data, threshold, alerts, isLoading }: MortalityChartProps) {
  if (isLoading) return <ChartSkeleton />;
  console.log("MortalityChart data:", data);

  const hasAlerts = alerts > 0;

  return (
    <Card className={cn("p-4", hasAlerts && "border-red-200 bg-red-50/30 dark:bg-red-950/10")}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">Mortality Trend</h3>
          <p className="text-xs text-muted-foreground">Weekly rate</p>
        </div>
        {hasAlerts && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            <span className="text-xs font-medium text-red-700">{alerts} alerts</span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<MortalityTooltip />} />
          <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Threshold", fill: "#ef4444", fontSize: 9 }} />
          <Bar dataKey="rate" name="Mortality Rate" radius={[4, 4, 0, 0]}>
            {data?.map((entry, i) => (
              <Cell key={i} fill={entry.rate > threshold ? "#ef4444" : "#f59e0b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {hasAlerts && (
        <p className="mt-2 text-xs text-red-600 text-center">
          Mortality exceeded threshold in {data.filter(d => d.rate > threshold).length} of the last 4 weeks
        </p>
      )}
    </Card>
  );
}