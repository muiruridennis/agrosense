import { MetricCard } from "./MetricCard";

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