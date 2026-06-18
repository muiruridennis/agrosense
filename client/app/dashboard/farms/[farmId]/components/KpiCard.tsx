// app/dashboard/components/cards/KpiCard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "teal" | "emerald" | "blue" | "rose" | "purple" | "amber" | "slate" | "green";
  size?: "default" | "sm" | "lg";
  className?: string;
  children: React.ReactNode;
}

const colorStyles = {
  teal: {
    borderTop: "border-t-teal-500",
    iconBg: "bg-teal-50 dark:bg-teal-950/30",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  emerald: {
    borderTop: "border-t-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    borderTop: "border-t-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  purple: {
    borderTop: "border-t-purple-500",
    iconBg: "bg-purple-50 dark:bg-purple-950/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  blue: {
    borderTop: "border-t-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    borderTop: "border-t-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  slate: {
    borderTop: "border-t-slate-500",
    iconBg: "bg-slate-50 dark:bg-slate-950/30",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "teal",
}: KpiCardProps) {
  const style = colorStyles[color];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md",
        style?.borderTop,
        "border-t-2"
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-semibold tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn("rounded-lg p-2", style?.iconBg)}>
            <Icon className={cn("h-4 w-4", style?.iconColor)} />
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/50">
            {trend.isPositive ? (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">
                  +{trend.value}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                <span className="text-sm font-medium text-rose-600">
                  {trend.value}%
                </span>
              </>
            )}
            <span className="text-xs text-muted-foreground">
              vs last month
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}