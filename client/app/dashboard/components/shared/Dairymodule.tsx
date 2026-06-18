import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MetricCard";

interface DairyModuleProps {
  data: any;
  role: string;
}

export function DairyModule({ data, role }: DairyModuleProps) {
  const isWorker = role === "worker";

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Active Cows"
          value={data.activeHerds || 0}
          unit="cows"
        />
        <MetricCard
          label="Daily Milk Yield"
          value={data.dailyMilkYield || 0}
          unit="liters"
        />
        <MetricCard
          label="Avg Milk Quality"
          value={data.avgMilkQuality || 0}
          unit="SCC"
        />
        <MetricCard
          label="Health Issues"
          value={data.alerts || 0}
          unit="issues"
          isAlert={data.alerts > 0}
        />
      </div>

      {/* Health & Production Metrics */}
      {!isWorker && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Herd Health Score</span>
              <span className="text-muted-foreground">
                {data.healthScore || 0}%
              </span>
            </div>
            <Progress
              value={data.healthScore || 0}
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Breed Quality</p>
              <p className="font-semibold">{data.breedQuality || "N/A"}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Avg Lactation Days</p>
              <p className="font-semibold">{data.avgLactationDays || 0} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Breeding Status */}
      {data.catsInBreeding > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            {data.catsInBreeding} cows in breeding cycle
          </p>
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