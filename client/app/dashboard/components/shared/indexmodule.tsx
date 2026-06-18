// dashboard/components/EnterpriseModules/PoultryModule.tsx
"use client";

import { Progress } from "@/components/ui/progress";

interface PoultryModuleProps {
  data: any;
  role: string;
}

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

      {/* Health Metrics */}
      {!isWorker && (
        <div className="space-y-3 border-t pt-3">
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

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Avg Feed Consumption</p>
              <p className="font-semibold">
                {data.avgFeedConsumption || 0} kg/day
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Egg Production</p>
              <p className="font-semibold">
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

// ─────────────────────────────────────────────────────────────────────

// dashboard/components/EnterpriseModules/DairyModule.tsx
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

// ─────────────────────────────────────────────────────────────────────

// dashboard/components/EnterpriseModules/CropsModule.tsx
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

// ─────────────────────────────────────────────────────────────────────

// dashboard/components/EnterpriseModules/InventoryModule.tsx
interface InventoryModuleProps {
  data: any;
  role: string;
}

export function InventoryModule({ data, role }: InventoryModuleProps) {
  const isWorker = role === "worker";

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Total Items"
          value={data.totalItems || 0}
          unit="items"
        />
        <MetricCard
          label="Low Stock"
          value={data.lowStock || 0}
          unit="items"
          isAlert={data.lowStock > 0}
        />
        <MetricCard
          label="Critical Stock"
          value={data.criticalStock || 0}
          unit="items"
          isAlert={data.criticalStock > 0}
        />
        <MetricCard
          label="Need Reorder"
          value={data.reorderCount || 0}
          unit="items"
          isAlert={data.reorderCount > 0}
        />
      </div>

      {/* Stock Health */}
      {!isWorker && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Stock Health</span>
              <span className="text-muted-foreground">
                {data.stockHealth || 0}%
              </span>
            </div>
            <Progress
              value={data.stockHealth || 0}
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Inventory Value</p>
              <p className="font-semibold">
                KES {(data.totalValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">Turnover Rate</p>
              <p className="font-semibold">
                {data.turnoverRate || 0}x/month
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stock Alerts */}
      {(data.lowStock > 0 || data.criticalStock > 0) && (
        <div className="space-y-2 border-t pt-3">
          {data.criticalStock > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                ⚠️ {data.criticalStock} items at critical stock level
              </p>
            </div>
          )}
          {data.lowStock > 0 && data.criticalStock === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                ⚡ {data.lowStock} items running low
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

// Shared MetricCard Component
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