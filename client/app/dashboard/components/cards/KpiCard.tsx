"use client";

import { Card } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: "teal" | "blue" | "purple" | "amber" | "rose" | "emerald";
  size?: "default" | "sm" | "lg";
  className?: string;
  children: React.ReactNode;
}

const colorStyles = {
  teal: {
    accent: "border-l-teal-500 dark:border-l-teal-500",
    iconBg: "bg-teal-50 dark:bg-teal-500/10",
    iconColor: "text-teal-600 dark:text-teal-400",
    trendPositive: "text-teal-600 dark:text-teal-400",
    trendNegative: "text-teal-600/70 dark:text-teal-400/70",
  },
  blue: {
    accent: "border-l-blue-500 dark:border-l-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    trendPositive: "text-blue-600 dark:text-blue-400",
    trendNegative: "text-blue-600/70 dark:text-blue-400/70",
  },
  purple: {
    accent: "border-l-purple-500 dark:border-l-purple-500",
    iconBg: "bg-purple-50 dark:bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
    trendPositive: "text-purple-600 dark:text-purple-400",
    trendNegative: "text-purple-600/70 dark:text-purple-400/70",
  },
  amber: {
    accent: "border-l-amber-500 dark:border-l-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    trendPositive: "text-amber-600 dark:text-amber-400",
    trendNegative: "text-amber-600/70 dark:text-amber-400/70",
  },
  rose: {
    accent: "border-l-rose-500 dark:border-l-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    trendPositive: "text-rose-600 dark:text-rose-400",
    trendNegative: "text-rose-600/70 dark:text-rose-400/70",
  },
  emerald: {
    accent: "border-l-emerald-500 dark:border-l-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    trendPositive: "text-emerald-600 dark:text-emerald-400",
    trendNegative: "text-emerald-600/70 dark:text-emerald-400/70",
  },
};

const sizeStyles = {
  sm: {
    card: "p-3",
    iconWrapper: "p-1.5",
    icon: "h-3.5 w-3.5",
    title: "text-[10px]",
    value: "text-base",
    subtitle: "text-[9px]",
    trend: "text-[9px]",
  },
  default: {
    card: "p-4",
    iconWrapper: "p-2",
    icon: "h-4 w-4",
    title: "text-xs",
    value: "text-xl sm:text-2xl",
    subtitle: "text-[10px] sm:text-xs",
    trend: "text-[10px]",
  },
  lg: {
    card: "p-5",
    iconWrapper: "p-2.5",
    icon: "h-5 w-5",
    title: "text-sm",
    value: "text-2xl sm:text-3xl",
    subtitle: "text-xs",
    trend: "text-xs",
  },
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "teal",
  size = "default",
  className,
  children,
}: KpiCardProps) {
  const style = colorStyles[color];
  const sizeConfig = sizeStyles[size];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-l-4 transition-all duration-200 hover:shadow-md",
        style.accent,
        sizeConfig.card,
        className,
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-current/5 transition-all duration-300" />

      <div className="relative space-y-3">
        {/* Header with title and icon */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p
              className={cn(
                "font-medium text-muted-foreground tracking-wide",
                sizeConfig.title,
              )}
            >
              {title}
            </p>
            {subtitle && (
              <p
                className={cn("text-muted-foreground/70", sizeConfig.subtitle)}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-lg transition-all duration-200 group-hover:scale-105",
              style.iconBg,
              sizeConfig.iconWrapper,
            )}
          >
            <Icon className={cn(style.iconColor, sizeConfig.icon)} />
          </div>
        </div>

        {/* Value section */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn("font-bold tracking-tight", sizeConfig.value)}>
              {value}
            </span>

            {/* Trend chip - integrated next to value */}
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium",
                  trend.isPositive
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400",
                  sizeConfig.trend,
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </span>
            )}
          </div>

          {/* Optional comparison text */}
          {trend?.label && (
            <p className={cn("text-muted-foreground", sizeConfig.trend)}>
              {trend.label}
            </p>
          )}
        </div>

        {/* Optional footer with call to action */}
        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors">
            View details <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Card>
  );
}
