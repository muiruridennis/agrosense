"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { FlockRecord } from "../types";

interface FlockRecordsChartProps {
  farmId: string;
  flockId: string;
  type: "layers" | "broilers";
  records?: FlockRecord[];
  isLoading?: boolean;
  limit?: number;
}

export function FlockRecordsChart({
  farmId,
  flockId,
  type,
  records = [],
  isLoading = false,
  limit = 30,
}: FlockRecordsChartProps) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const recordsArray = Array.isArray(records) ? records : [];

  if (!recordsArray.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No records yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Start tracking daily performance to see trends
          </p>
        </div>
      </div>
    );
  }

  // Take only the last 'limit' records
  const displayRecords = recordsArray.slice(-limit);

  // Sort records by date and prepare chart data
  const chartData = displayRecords
    .sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime())
    .map((record) => ({
      date: new Date(record.recordDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      // ✅ Use correct field names from backend
      mortality: record.mortality || 0,
      feed: record.feedConsumedKg || 0,
      eggs: (record.morningEggs || 0) + (record.eveningEggs || 0),
      weight: record.avgBodyWeightKg || 0,
    }));

  // Get the latest values for summary
  const latest = displayRecords[displayRecords.length - 1];

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />

            {/* Primary metric based on flock type */}
            {type === "layers" ? (
              <Line
                type="monotone"
                dataKey="eggs"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: "#f59e0b", r: 3 }}
                name="Eggs (trays)"
                activeDot={{ r: 5 }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: "#10b981", r: 3 }}
                name="Avg Weight (kg)"
                activeDot={{ r: 5 }}
              />
            )}

            {/* Secondary metrics */}
            <Line
              type="monotone"
              dataKey="feed"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 2.5 }}
              name="Feed (kg)"
            />
            <Line
              type="monotone"
              dataKey="mortality"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: "#ef4444", r: 2.5 }}
              name="Mortality"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Latest Date</p>
          <p className="text-xs font-medium">
            {new Date(latest.recordDate).toLocaleDateString()}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">
            {type === "layers" ? "Eggs" : "Avg Weight"}
          </p>
          <p className="text-xs font-medium">
            {type === "layers"
              ? `${(latest.morningEggs || 0) + (latest.eveningEggs || 0)} trays`
              : `${latest.avgBodyWeightKg?.toFixed(1) || 0} kg`}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Total Records</p>
          <p className="text-xs font-medium">{displayRecords.length} days</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Mortality</p>
          <p className="text-xs font-medium">
            {displayRecords.reduce((sum, r) => sum + (r.mortality || 0), 0)} birds
          </p>
        </div>
      </div>
    </div>
  );
}