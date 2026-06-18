// dashboard/components/EnterpriseModules/PoultryModule.tsx
"use client";

import { Progress } from "@/components/ui/progress";

interface PoultryModuleProps {
  data: any;
  role: string;
}

/**
 * PoultryModule - Displays poultry-specific metrics and health information
 * 
 * Metrics shown:
 * - Active Flocks: Number of active flocks on farm
 * - Total Birds: Total birds across all flocks
 * - Active Houses: Number of active poultry houses
 * - Mortality Rate: Percentage of birds lost
 * 
 * For managers (non-workers):
 * - Flock health score with progress bar
 * - Average feed consumption per day
 * - Egg production per day
 * 
 * Alerts:
 * - Shows if there are active health issues
 */
export function PoultryModule({ data, role }: PoultryModuleProps) {
  const isWorker = role === "worker";

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Active Flocks"
          value={data.activeFlocks || 0}
          unit="flocks"
        />
        <MetricCard
          label="Total Birds"
          value={data.totalBirds || 0}
          unit="birds"
        />
        <MetricCard
          label="Active Houses"
          value={data.activeHouses || 0}
          unit="houses"
        />
        <MetricCard
          label="Mortality Rate"
          value={data.mortalityRate || 0}
          unit="%"
          isAlert={data.mortalityRate > 5}
        />
      </div>

      {/* Health Metrics - Only show to non-workers */}
      {!isWorker && (
        <div className="space-y-3 border-t pt-3">
          {/* Flock Health Score */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Flock Health Score</span>
              <span className="text-muted-foreground">
                {data.healthScore || 0}%
              </span>
            </div>
            <Progress
              value={data.healthScore || 0}
              className="h-2"
            />
          </div>

          {/* Feed Consumption & Egg Production */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Avg Feed Consumption</p>
              <p className="font-semibold mt-1">
                {data.avgFeedConsumption || 0} kg/day
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Egg Production</p>
              <p className="font-semibold mt-1">
                {data.eggProduction || 0} eggs/day
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Summary */}
      {data.alerts > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {data.alerts} Alert{data.alerts !== 1 ? "s" : ""}: {data.alertSummary || "Health issues detected"}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * MetricCard - Reusable metric display component
 * 
 * Props:
 * - label: Display label for the metric
 * - value: Numeric or string value to display
 * - unit: Unit of measurement (optional)
 * - isAlert: If true, displays value in red (for critical metrics)
 */
interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  isAlert?: boolean;
}

function MetricCard({ label, value, unit, isAlert }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <p
          className={`text-lg font-semibold ${
            isAlert ? "text-red-600 dark:text-red-400" : ""
          }`}
        >
          {value}
        </p>
        {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
      </div>
    </div>
  );
}