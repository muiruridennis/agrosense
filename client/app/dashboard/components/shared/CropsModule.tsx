import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MetricCard";

interface CropsModuleProps {
  data: any;
  role: string;
}

export function CropsModule({ data, role }: CropsModuleProps) {
  const isWorker = role === "worker";

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Active Cycles"
          value={data.activeCycles || 0}
          unit="cycles"
        />
        <MetricCard
          label="Planted Area"
          value={data.plantedHectares || 0}
          unit="hectares"
        />
        <MetricCard
          label="Pest Pressure"
          value={data.pestPressure || "Low"}
          unit=""
          isAlert={
            data.pestPressure === "High" || data.pestPressure === "Critical"
          }
        />
        <MetricCard
          label="Irrigation Status"
          value={data.irrigationStatus || "Good"}
          unit=""
        />
      </div>

      {/* Growth & Production Metrics */}
      {!isWorker && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Growth Progress</span>
              <span className="text-muted-foreground">
                {data.growthProgress || 0}%
              </span>
            </div>
            <Progress
              value={data.growthProgress || 0}
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Water Usage</p>
              <p className="font-semibold">
                {data.waterUsage || 0} mm/week
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Est. Yield</p>
              <p className="font-semibold">
                {data.estimatedYield || 0} kg/ha
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disease/Pest Alerts */}
      {(data.diseaseAlert || data.pestAlert) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {data.diseaseAlert && "Disease detected · "}
            {data.pestAlert && "Pest pressure high"}
          </p>
        </div>
      )}
    </div>
  );
}