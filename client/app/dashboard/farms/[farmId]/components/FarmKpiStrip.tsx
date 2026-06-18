// app/dashboard/farms/[farmId]/components/FarmKpiStrip.tsx
"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiData {
  label: string;
  value: string;
  sub: string;
  delta?: { value: string; positive: boolean } | null;
  icon: React.ElementType;
}

interface FarmKpiStripProps {
  kpis: KpiData[];
}

export function FarmKpiStrip({ kpis }: FarmKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className={cn(
            "group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-muted/20 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
            "animate-fade-in-up",
          )}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative z-10">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider ">
                {kpi.label}
              </span>
              <div className="rounded-lg bg-muted/30 p-1.5">
                <kpi.icon className="h-4 w-4 " />
              </div>
            </div>

            <p className="text-2xl font-bold tracking-tight text-foreground">
              {kpi.value}
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-[11px] text-black">{kpi.sub}</span>
              {kpi.delta && (
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  kpi.delta.positive 
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
                )}>
                  {kpi.delta.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {kpi.delta.value}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}