// app/dashboard/farms/[farmId]/poultry/flocks/[flockId]/components/FlockHealthStatusCard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlockSummary, FlockPerformance } from "../../../types";

interface FlockHealthStatusCardProps {
  summary?: FlockSummary;
  performance?: FlockPerformance;
  flock: Flock;  // ✅ Proper type instead of any
}

export function FlockHealthStatusCard({ summary, performance, flock }: FlockHealthStatusCardProps) {
  // ✅ Safe access with fallbacks
  const healthStatus = summary?.summary?.healthStatus || 'UNKNOWN';

  const statusConfig = {
    HEALTHY: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30', icon: CheckCircle2 },
    AT_RISK: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30', icon: AlertCircle },
    CRITICAL: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30', icon: AlertCircle },
    UNKNOWN: { color: 'bg-muted text-muted-foreground', icon: AlertCircle },
  };

  const config = statusConfig[healthStatus as keyof typeof statusConfig] || statusConfig.UNKNOWN;
  const StatusIcon = config.icon;

  // ✅ Safe access for all metrics with fallbacks
  const healthRiskScore = summary?.biology?.healthRiskScore ?? 0;
  const mortalityActual = performance?.mortality?.actual ?? 0;
  const mortalityExpected = performance?.mortality?.expected ?? 0;
  const productionStatus = performance?.production?.status || '—';
  const fcrActual = performance?.fcr?.actual ?? 0;
  const fcrStatus = performance?.fcr?.status || '—';
  const pendingReviews = summary?.operations?.pendingRecordReviews ?? 0;
  const actionRequired = summary?.summary?.actionRequired ?? false;

  // ✅ Helper to determine color based on health risk score
  const getHealthRiskColor = (score: number) => {
    if (score < 30) return "text-emerald-600";
    if (score < 60) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Health Status</h3>
        <Badge className={cn("text-[10px] font-semibold", config.color)}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {healthStatus.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Health Risk Score</p>
          <p className={cn(
            "text-xl font-bold",
            getHealthRiskColor(healthRiskScore)
          )}>
            {healthRiskScore || '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Mortality Rate</p>
          <p className="text-xl font-bold">
            {mortalityActual ? `${mortalityActual.toFixed(1)}%` : '—'}
            {mortalityExpected > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {mortalityExpected}%
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Production Status</p>
          <p className={cn(
            "text-base font-semibold",
            productionStatus === 'GOOD' ? "text-emerald-600" : 
            productionStatus !== '—' ? "text-amber-600" : "text-muted-foreground"
          )}>
            {productionStatus}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">FCR</p>
          <p className={cn(
            "text-base font-semibold",
            fcrStatus === 'GOOD' ? "text-emerald-600" : 
            fcrStatus !== '—' ? "text-amber-600" : "text-muted-foreground"
          )}>
            {fcrActual ? fcrActual.toFixed(2) : '—'}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / 2.0 target
            </span>
          </p>
        </div>
      </div>

      {actionRequired && (
        <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/30">
          ⚠️ Action required: {pendingReviews > 0 
            ? `${pendingReviews} record(s) pending review`
            : 'Health risk detected - investigate immediately'
          }
        </div>
      )}
    </Card>
  );
}