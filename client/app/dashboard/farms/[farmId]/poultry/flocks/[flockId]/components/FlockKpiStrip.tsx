"use client";

import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Egg,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Flock } from "../../../types";
import { FarmMemberRole } from "@/types";

interface FlockKpiStripProps {
  flock: Flock;
  role: FarmMemberRole;
}

export function FlockKpiStrip({ flock, role }: FlockKpiStripProps) {
  const placementDate = new Date(flock.placementDate);
  const today = new Date();
  const daysInProduction = Math.floor(
    (today.getTime() - placementDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const targetDays = flock.targetDays || 42;
  const daysRemaining = Math.max(0, targetDays - daysInProduction);
  const mortalityRate =
    ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;

  const isManager =
    role === FarmMemberRole.MANAGER || role === FarmMemberRole.OWNER;
  const isWorker = role === FarmMemberRole.WORKER;

  // ✅ Base KPIs - everyone sees these
  const baseKpis = [
    {
      label: "Current Birds",
      value: flock.currentCount.toLocaleString(),
      subtitle: `${flock.initialCount.toLocaleString()} placed`,
      icon: Users,
    },
    {
      label: "Days in Production",
      value: daysInProduction.toString(),
      subtitle:
        flock.type === "broilers"
          ? `${daysRemaining} days remaining`
          : undefined,
      icon: Calendar,
    },
    {
      label: "Mortality Rate",
      value: `${mortalityRate.toFixed(1)}%`,
      subtitle: `Target: ${flock.expectedMortalityPercent || 5}%`,
      icon: TrendingUp,
      trend:
        mortalityRate <= (flock.expectedMortalityPercent || 5)
          ? "positive"
          : "negative",
    },
  ];

  // ✅ Financial KPIs - only managers and owners see these
  const financialKpis = [
    {
      label: "Net Profit",
      value: `KES ${(flock.netProfit || 0).toLocaleString()}`,
      subtitle: `${(flock.roiPercent || 0).toFixed(0)}% ROI`,
      icon: DollarSign,
      trend: flock.netProfit > 0 ? "positive" : "negative",
    },
  ];

  // ✅ Type-specific KPI - everyone sees this
  let typeSpecificKpi = null;
  if (flock.type === "broilers" && flock.targetWeightKg) {
    typeSpecificKpi = {
      label: "Target Weight",
      value: `${flock.targetWeightKg} kg`,
      subtitle: `Day ${flock.targetDays || 42} target`,
      icon: Target,
    };
  } else if (flock.type === "layers" && flock.productionStartWeek) {
    typeSpecificKpi = {
      label: "Production Start",
      value: `Week ${flock.productionStartWeek}`,
      subtitle: "Expected egg production",
      icon: Egg,
    };
  }

  // ✅ Build final KPI list based on role
  let kpis = [...baseKpis];

  // Add type-specific KPI (everyone sees this)
  if (typeSpecificKpi) {
    kpis.splice(2, 0, typeSpecificKpi);
  }

  // ✅ Add financial KPIs only for managers and owners
  if (isManager) {
    // Insert after the first 3 items
    kpis.splice(isManager ? 3 : 0, 0, ...financialKpis);
  }

  // ✅ Limit to 4 KPIs max (for layout)
  kpis = kpis.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className="rounded-xl border bg-card p-4 transition-all hover:shadow-md animate-fade-in-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {kpi.label}
            </span>
            <kpi.icon className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p
            className={cn(
              "text-2xl font-bold tracking-tight",
              kpi.trend === "positive" && "text-emerald-600",
              kpi.trend === "negative" && "text-rose-600",
            )}
          >
            {kpi.value}
          </p>
          {kpi.subtitle && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              {kpi.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
