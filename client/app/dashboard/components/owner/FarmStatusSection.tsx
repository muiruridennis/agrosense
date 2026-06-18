"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Syringe,
  Tractor,
  Droplet,
  RefreshCw,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStatus } from "@/lib/hooks/Usefarmstatus";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  level: "healthy" | "warning" | "critical" | "unknown";
  label?: string;
  className?: string;
}

function StatusBadge({ level, label, className }: StatusBadgeProps) {
  const styles = {
    healthy: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: CheckCircle,
      defaultLabel: "Healthy",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      icon: AlertTriangle,
      defaultLabel: "Warning",
    },
    critical: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      icon: XCircle,
      defaultLabel: "Critical",
    },
    unknown: {
      bg: "bg-slate-50 dark:bg-slate-900/30",
      text: "text-slate-500 dark:text-slate-400",
      border: "border-slate-200 dark:border-slate-700",
      icon: Minus,
      defaultLabel: "Unknown",
    },
  };

  const style = styles[level];
  const Icon = style.icon;
  const displayLabel = label || style.defaultLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
        style.bg,
        style.text,
        style.border,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {displayLabel}
    </span>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: "healthy" | "warning" | "critical" | "unknown";
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon: React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

function FarmStatusKpiCard({
  title,
  value,
  subtitle,
  status,
  trend,
  icon: Icon,
  action,
  children,
}: KpiCardProps) {
  const statusColors = {
    healthy: "border-l-emerald-500",
    warning: "border-l-amber-500",
    critical: "border-l-red-500",
    unknown: "border-l-slate-500",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-l-4 transition-all hover:shadow-md",
        status ? statusColors[status] : "border-l-primary",
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-muted/50 p-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
          </div>
          {status && <StatusBadge level={status} />}
        </div>

        {/* Value */}
        <div className="mb-2">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {/* Trend */}
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              trend.isPositive ? "text-emerald-600" : "text-red-600",
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
            {trend.label && (
              <span className="text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}

        {/* Custom content (like action items list) */}
        {children && (
          <div className="mt-3 pt-3 border-t border-border/50">{children}</div>
        )}

        {/* Action button */}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING & ERROR STATES
// ─────────────────────────────────────────────────────────────────────────────

function FarmStatusSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-40" />
        </Card>
      ))}
    </div>
  );
}

function FarmStatusError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="p-6 text-center border-red-200 bg-red-50/50 dark:bg-red-950/20">
      <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-3" />
      <h3 className="font-semibold mb-1">Unable to load farm status</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Please check your connection and try again
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3 w-3 mr-2" />
        Retry
      </Button>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface FarmStatusSectionProps {
  farmId: string;
  onRefresh?: () => void;
  className?: string;
}

export function FarmStatusSection({
  farmId,
  onRefresh,
  className,
}: FarmStatusSectionProps) {
  const { data, isLoading, isPartiallyLoaded, isError, errors, refetch } =
    useFarmStatus(farmId);

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  if (isLoading) return <FarmStatusSkeleton />;

  if (isError) {
    // If critical signals failed, show error
    const hasFinancialError = errors.financial;
    const hasHealthError = errors.health;

    if (hasFinancialError || hasHealthError) {
      return <FarmStatusError onRetry={handleRefresh} />;
    }
  }

  // Partial data with some errors - show what we have
  const hasPartialData = data.financial || data.health || data.stock;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with status overview */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Farm Status</h2>
          <StatusBadge level={data.overallStatus} label="Overall Status" />
          {isPartiallyLoaded && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Refreshing...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {data.lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {formatTimeAgo(data.lastUpdated)}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isPartiallyLoaded}
            className="h-8 px-2"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isPartiallyLoaded && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Card 1: Financial Health */}
        <FarmStatusKpiCard
          title="Financial Health"
          value={data.financial ? `${data.financial.score}/100` : "—"}
          subtitle={
            data.financial
              ? `Risk: ${data.financial.riskLevel} • ${data.financial.trend}`
              : errors.financial
                ? "Data unavailable"
                : "Loading..."
          }
          status={data.financial?.statusLevel}
          trend={
            data.financial
              ? {
                  value:
                    data.financial.riskLevel === "low"
                      ? 5
                      : data.financial.riskLevel === "high"
                        ? -8
                        : 2,
                  isPositive: data.financial.trend === "improving",
                  label: "vs last month",
                }
              : undefined
          }
          icon={TrendingUp}
          action={{
            label: "View details",
            onClick: () => console.log("Navigate to financial health"),
          }}
        >
          {data.financial?.actionItems &&
            data.financial.actionItems.length > 0 && (
              <div className="space-y-1">
                {data.financial.actionItems.slice(0, 2).map((item, i) => (
                  <p
                    key={i}
                    className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1"
                  >
                    <AlertTriangle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                    {item}
                  </p>
                ))}
              </div>
            )}
        </FarmStatusKpiCard>

        {/* Card 2: Health Status */}
        <FarmStatusKpiCard
          title="Animal Health"
          value={data.health?.totalActiveIssues ?? "—"}
          subtitle={
            data.health
              ? `${data.health.critical} critical, ${data.health.high} high`
              : "No active issues"
          }
          status={data.health?.statusLevel}
          icon={Syringe}
          action={{
            label: "View health events",
            onClick: () => console.log("Navigate to health"),
          }}
        >
          {data.health && data.health.animalsUnderWithdrawal > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {data.health.animalsUnderWithdrawal} animals under withdrawal
            </p>
          )}
          {data.health && data.health.treatmentCost > 0 && (
            <p className="text-xs text-muted-foreground">
              Treatment cost: KES {data.health.treatmentCost.toLocaleString()}{" "}
              this month
            </p>
          )}
        </FarmStatusKpiCard>

        {/* Card 3: Stock Status */}
        <FarmStatusKpiCard
          title="Stock Status"
          value={
            data.stock?.criticalCount && data.stock.criticalCount > 0
              ? `${data.stock.criticalCount} critical`
              : data.stock?.lowCount && data.stock.lowCount > 0
                ? `${data.stock.lowCount} low`
                : "All adequate"
          }
          subtitle={
            data.stock?.criticalItems.length
              ? `${data.stock.criticalItems[0].itemName}: ${data.stock.criticalItems[0].daysSupply} days left`
              : data.stock?.lowCount
                ? `${data.stock.lowCount} items need reorder soon`
                : "Inventory levels healthy"
          }
          status={data.stock?.statusLevel}
          icon={Package}
          action={{
            label: "Review inventory",
            onClick: () => console.log("Navigate to inventory"),
          }}
        >
          {data.stock?.criticalItems && data.stock.criticalItems.length > 0 && (
            <div className="space-y-1">
              {data.stock.criticalItems.slice(0, 2).map((item) => (
                <div key={item.itemId} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.itemName}</span>
                  <span className="font-medium text-red-600">
                    {item.daysSupply === 0
                      ? "OUT OF STOCK"
                      : `${item.daysSupply} days left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </FarmStatusKpiCard>

        {/* Card 4: Disease Risk */}
        <FarmStatusKpiCard
          title="Disease Risk"
          value={
            data.disease?.critical && data.disease.critical > 0
              ? `${data.disease.critical} critical`
              : data.disease?.high && data.disease.high > 0
                ? `${data.disease.high} high`
                : data.disease?.totalAlerts && data.disease.totalAlerts > 0
                  ? `${data.disease.totalAlerts} active`
                  : "No alerts"
          }
          subtitle={
            data.disease?.topAlert
              ? data.disease.topAlert.diseaseName
              : data.disease?.totalAlerts === 0
                ? "No disease risks detected"
                : "Risk assessment current"
          }
          status={data.disease?.statusLevel}
          icon={AlertTriangle}
          action={{
            label: "View alerts",
            onClick: () => console.log("Navigate to disease alerts"),
          }}
        >
          {data.disease?.lastEvaluated && (
            <p className="text-xs text-muted-foreground">
              Last evaluation:{" "}
              {new Date(data.disease.lastEvaluated).toLocaleTimeString()}
            </p>
          )}
        </FarmStatusKpiCard>

        {/* Card 5: Dairy Status (if dairy data exists) */}
        {/* {data.livestock?.hasDairyData && data.livestock.dairy && (
          <FarmStatusKpiCard
            title="Dairy Production"
            value={`${data.livestock.dairy.dailyYieldLitres.toLocaleString()} L`}
            subtitle={`${data.livestock.dairy.cowsInMilk} cows in milk • ${data.livestock.dairy.totalCows} total`}
            status={data.livestock.dairy.statusLevel}
            icon={Droplet}
            action={{
              label: "View dairy",
              onClick: () => console.log("Navigate to dairy"),
            }}
          >
            {data.livestock.dairy.healthAlerts > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5" />
                {data.livestock.dairy.healthAlerts} health alert(s) today
              </p>
            )}
            {data.livestock.dairy.pregnantCows > 0 && (
              <p className="text-xs text-emerald-600">
                {data.livestock.dairy.pregnantCows} cows pregnant
              </p>
            )}
          </FarmStatusKpiCard>
        )} */}

        {/* Card 6: Recommendations (compact) */}
        {data.recommendations.length > 0 && (
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 bg-muted/30">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Recommended Actions</h3>
                {data.recommendations.some(
                  (r) => r.priority === "critical",
                ) && <StatusBadge level="critical" label="Urgent" />}
              </div>
              <div className="flex flex-wrap gap-3">
                {data.recommendations.slice(0, 4).map((rec) => (
                  <button
                    key={rec.id}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                      rec.priority === "critical"
                        ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                        : rec.priority === "high"
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-foreground",
                    )}
                  >
                    {rec.title}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Show per-card errors gracefully */}
        {errors.financial && !data.financial && (
          <Card className="p-5 border-yellow-200 bg-yellow-50/50">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs">Financial data unavailable</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}
