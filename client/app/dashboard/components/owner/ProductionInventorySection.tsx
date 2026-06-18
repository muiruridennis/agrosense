// components/dashboard/ProductionInventorySection.tsx
"use client";

import { Package, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductionInventorySectionProps {
  feedConversion: {
    current: number;
    target: number;
    percentage: number;
  };
  feedRemaining: {
    days: number;
    percentage: number;
    status: "critical" | "warning" | "healthy";
  };
  inventoryStatus: {
    totalItems: number;
    lowStock: number;
    criticalStock: number;
    healthyStock: number;
    criticalItems?: Array<{
      itemId: string;
      itemName: string;
      daysSupply: number;
    }>;
  };
  className?: string;
}

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function ProductionInventorySection({
  feedConversion,
  feedRemaining,
  inventoryStatus,
  className,
}: ProductionInventorySectionProps) {
  const getStatusColor = (status: "critical" | "warning" | "healthy") => {
    switch (status) {
      case "critical": return "destructive";
      case "warning": return "warning";
      default: return "emerald";
    }
  };

  const getStatusStyles = (status: "critical" | "warning" | "healthy") => {
    switch (status) {
      case "critical":
        return {
          border: "border-destructive/50",
          bg: "bg-destructive/5 dark:bg-destructive/10",
          bar: "bg-destructive",
          text: "text-destructive",
          badge: "bg-destructive/10 text-destructive",
        };
      case "warning":
        return {
          border: "border-warning/50",
          bg: "bg-warning/5 dark:bg-warning/10",
          bar: "bg-warning",
          text: "text-warning",
          badge: "bg-warning/10 text-warning",
        };
      default:
        return {
          border: "border-emerald-500/30",
          bg: "bg-emerald-50/30 dark:bg-emerald-950/10",
          bar: "bg-emerald-500",
          text: "text-emerald-600",
          badge: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
        };
    }
  };

  const feedStatusStyles = getStatusStyles(feedRemaining.status);
  const inventoryHasIssues = (inventoryStatus.criticalStock > 0 || inventoryStatus.lowStock > 0);
  const inventoryStatusLevel = inventoryStatus.criticalStock > 0 ? "critical" : inventoryStatus.lowStock > 0 ? "warning" : "healthy";
  const inventoryStyles = getStatusStyles(inventoryStatusLevel);

  return (
    <section className={cn("space-y-4", className)}>
      <SectionHeading icon={Package} label="Production & Inventory" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Card 1: Feed Conversion Ratio */}
        <div className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-warning/60 via-warning/30 to-transparent" />
          
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-warning/10 p-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-warning" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Feed Conversion Ratio
                </span>
              </div>
              <span className="text-xs font-semibold text-warning">
                {feedConversion.percentage}%
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight">
                  {feedConversion.current}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {feedConversion.target} target
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warning transition-all duration-500"
                    style={{ width: `${feedConversion.percentage}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {feedConversion.current > feedConversion.target ? "+" : ""}
                  {(feedConversion.current - feedConversion.target).toFixed(2)} above target
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Feed Remaining */}
        <div className={cn(
          "group relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md",
          feedStatusStyles.bg,
          feedStatusStyles.border
        )}>
          <div className={cn("absolute inset-x-0 top-0 h-1", feedStatusStyles.bar)} />

          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("rounded-lg p-1.5", feedStatusStyles.badge)}>
                  <Package className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Feed Remaining
                </span>
              </div>
              <span className={cn("text-xs font-semibold", feedStatusStyles.text)}>
                {feedRemaining.status === "critical" ? "CRITICAL" : "LOW"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className={cn("text-xl font-bold tracking-tight", feedStatusStyles.text)}>
                  {feedRemaining.days} days
                </span>
                <span className="text-xs text-muted-foreground">supply left</span>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", feedStatusStyles.bar)}
                      style={{ width: `${feedRemaining.percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {feedRemaining.days <= 2 ? "Order immediately" : "Plan reorder"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Inventory Status */}
        <div className={cn(
          "group relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md",
          inventoryHasIssues ? inventoryStyles.bg : "bg-card"
        )}>
          <div className={cn(
            "absolute inset-x-0 top-0 h-1",
            inventoryHasIssues ? inventoryStyles.bar : "bg-gradient-to-r from-emerald-500/60 to-emerald-500/20"
          )} />

          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "rounded-lg p-1.5",
                  inventoryHasIssues ? inventoryStyles.badge : "bg-muted/50"
                )}>
                  <Package className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Inventory Status
                </span>
              </div>
              <div className="flex gap-1.5">
                {inventoryStatus.criticalStock > 0 && (
                  <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-medium text-destructive">
                    {inventoryStatus.criticalStock} critical
                  </span>
                )}
                {inventoryStatus.lowStock > 0 && (
                  <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-medium text-warning">
                    {inventoryStatus.lowStock} low
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight">
                  {inventoryStatus.totalItems}
                </span>
                <span className="text-xs text-muted-foreground">total items</span>
              </div>

              {/* Status Distribution */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-1.5">
                  <p className="text-[10px] text-muted-foreground">Healthy</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {inventoryStatus.healthyStock}
                  </p>
                </div>
                <div className={cn(
                  "rounded-lg p-1.5",
                  inventoryHasIssues ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/30"
                )}>
                  <p className="text-[10px] text-muted-foreground">Needs Attention</p>
                  <p className={cn(
                    "text-sm font-semibold",
                    inventoryStatus.criticalStock > 0 ? "text-destructive" : "text-amber-600"
                  )}>
                    {inventoryStatus.lowStock + inventoryStatus.criticalStock}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Items Alert */}
      {inventoryStatus.criticalItems && inventoryStatus.criticalItems.length > 0 && (
        <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-medium text-destructive">Critical Items</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {inventoryStatus.criticalItems.slice(0, 3).map((item) => (
              <span
                key={item.itemId}
                className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive"
              >
                {item.itemName}: {item.daysSupply === 0 ? "Out of stock" : `${item.daysSupply} days left`}
              </span>
            ))}
            {inventoryStatus.criticalItems.length > 3 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                +{inventoryStatus.criticalItems.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* All Healthy State */}
      {!inventoryHasIssues && inventoryStatus.totalItems > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/30 p-2.5 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs text-emerald-700 dark:text-emerald-400">
            All inventory levels are healthy
          </span>
        </div>
      )}
    </section>
  );
}