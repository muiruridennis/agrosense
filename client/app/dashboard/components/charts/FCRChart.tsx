// components/charts/FCRChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartSkeleton } from "./shared/ChartSkeleton";

interface FCRChartProps {
  data: Array<{ date: string; fcr: number }>;
  target: number;
  trend: "improving" | "worsening" | "stable";
  isLoading?: boolean;
}

export function FCRChart({ data, target, trend, isLoading }: FCRChartProps) {
  if (isLoading) return <ChartSkeleton />;

  const latestFCR = data[data.length - 1]?.fcr;
  const isImproving = trend === "improving";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">Feed Efficiency (FCR)</h3>
          <p className="text-xs text-muted-foreground">Lower is better</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Current FCR</p>
          <p className={cn("text-lg font-bold", latestFCR <= target ? "text-emerald-600" : "text-amber-600")}>
            {latestFCR?.toFixed(2)}
          </p>
          <div className={cn("flex items-center gap-0.5 text-xs", isImproving ? "text-emerald-600" : "text-red-600")}>
            {isImproving ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            <span>vs target {target}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} domain={[1.2, 2.5]} />
          <Tooltip content={({ payload }) => (
            <div className="rounded-lg border bg-card p-2 shadow-lg">
              <p className="text-xs font-medium">{payload?.[0]?.payload.date}</p>
              <p className="text-sm font-mono">FCR: {payload?.[0]?.value}</p>
            </div>
          )} />
          <ReferenceLine y={target} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Target", fill: "#10b981", fontSize: 9 }} />
          <Line type="monotone" dataKey="fcr" name="FCR" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}