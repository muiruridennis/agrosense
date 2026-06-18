// components/shared/CriticalAlerts.tsx
"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  XCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronDown,
  Bell,
  Droplets,
  Syringe,
  Package,
  Wrench,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  context: string;
  affectedItem: string;
  recommendedAction: string;
  actionHref?: string;
  actionLabel?: string;
  timestamp?: string;
  category?: "health" | "inventory" | "equipment" | "task" | "finance";
}

interface CriticalAlertsProps {
  alerts: Alert[];
  farmId: string;
  maxVisible?: number;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-l-red-500",
    text: "text-red-700 dark:text-red-400",
    textStrong: "text-red-800 dark:text-red-300",
    badge: "destructive" as const,
  },
  high: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-l-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    textStrong: "text-amber-800 dark:text-amber-300",
    badge: "default" as const,
  },
  medium: {
    icon: Bell,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-l-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    textStrong: "text-blue-800 dark:text-blue-300",
    badge: "secondary" as const,
  },
  low: {
    icon: Bell,
    bg: "bg-gray-50 dark:bg-gray-900/40",
    border: "border-l-gray-400",
    text: "text-gray-600 dark:text-gray-400",
    textStrong: "text-gray-700 dark:text-gray-300",
    badge: "outline" as const,
  },
};

const categoryConfig = {
  health: {
    icon: Syringe,
    label: "Health",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
  },
  inventory: {
    icon: Package,
    label: "Stock",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  equipment: {
    icon: Wrench,
    label: "Equipment",
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-950/30",
  },
  task: {
    icon: Clock,
    label: "Task",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  finance: {
    icon: Droplets,
    label: "Finance",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
};

function getRelativeTime(timestamp?: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
  return `${Math.floor(diffMinutes / 1440)} days ago`;
}

export function CriticalAlerts({
  alerts,
  farmId,
  maxVisible = 3,
  onAcknowledge,
  onDismiss,
}: CriticalAlertsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    new Set(),
  );
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const activeAlerts = useMemo(() => {
    return [...alerts]
      .filter((a) => !acknowledgedIds.has(a.id) && !dismissedIds.has(a.id))
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }, [alerts, acknowledgedIds, dismissedIds]);

  const criticalCount = activeAlerts.filter(
    (a) => a.severity === "critical",
  ).length;
  const highCount = activeAlerts.filter((a) => a.severity === "high").length;
  const visibleAlerts = isExpanded ? activeAlerts : activeAlerts.slice(0, 3);
  const hasMore = activeAlerts.length > 3;

  if (activeAlerts.length === 0) return null;

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => new Set(prev).add(id));
    onAcknowledge?.(id);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    onDismiss?.(id);
  };

  // Single critical alert - prominent banner
  if (activeAlerts.length === 1 && criticalCount === 1) {
    const alert = activeAlerts[0];
    const config = severityConfig[alert.severity];
    const Icon = config.icon;
    const timeAgo = getRelativeTime(alert.timestamp);
    const CategoryIcon = alert.category
      ? categoryConfig[alert.category]?.icon
      : null;

    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-lg border-2 p-4 transition-all",
          config.bg,
          config.border,
          "shadow-sm",
        )}
      >
        <div className="shrink-0">
          <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-2">
            <Icon className={cn("h-6 w-6", config.text)} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-base font-semibold">{alert.title}</span>
            <Badge variant={config.badge} className="text-xs px-2 py-0">
              {alert.severity.toUpperCase()}
            </Badge>
            {CategoryIcon && (
              <Badge variant="outline" className="text-xs gap-1 px-2 py-0">
                <CategoryIcon className="h-3 w-3" />
                {
                  categoryConfig[alert.category as keyof typeof categoryConfig]
                    ?.label
                }
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {alert.affectedItem}
            {timeAgo && (
              <span className="ml-2 text-muted-foreground/60">• {timeAgo}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {alert.actionHref && (
            <Button
              size="default"
              variant="destructive"
              onClick={() => router.push(alert.actionHref!)}
              className="h-9 px-4 text-sm font-medium"
            >
              Fix Now
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button
            size="default"
            variant="outline"
            onClick={() => handleAcknowledge(alert.id)}
            className="h-9 px-3 text-sm"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Acknowledge
          </Button>
          <Button
            size="default"
            variant="ghost"
            onClick={() => handleDismiss(alert.id)}
            className="h-9 w-9 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Multiple alerts - collapsible design
  return (
    <Card
      className={cn(
        "overflow-hidden border shadow-sm",
        criticalCount > 0 && "border-red-200 dark:border-red-800",
        highCount > 0 &&
          criticalCount === 0 &&
          "border-amber-200 dark:border-amber-800",
      )}
    >
      {/* Header - always visible */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-5 py-3.5 flex items-center justify-between transition-colors",
          "hover:bg-muted/50",
          criticalCount > 0 && "bg-red-50/50 dark:bg-red-950/20",
          highCount > 0 &&
            criticalCount === 0 &&
            "bg-amber-50/50 dark:bg-amber-950/20",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-full p-2",
              criticalCount > 0
                ? "bg-red-100 dark:bg-red-900/50"
                : "bg-amber-100 dark:bg-amber-900/50",
            )}
          >
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                criticalCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400",
              )}
            />
          </div>
          <div className="text-left">
            <p className="text-base font-semibold">
              {criticalCount > 0
                ? `${criticalCount} Critical Alert${criticalCount !== 1 ? "s" : ""}`
                : `${activeAlerts.length} Alert${activeAlerts.length !== 1 ? "s" : ""}`}
            </p>
            <p className="text-sm text-neutral-950/80 dark:text-white/80">
              {criticalCount > 0
                ? "Requires immediate action"
                : "Requires your attention"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              {criticalCount} urgent
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-5 w-5 text-neutral-950 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </Button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/60 divide-y divide-border/60">
          {visibleAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            const timeAgo = getRelativeTime(alert.timestamp);
            const CategoryIcon = alert.category
              ? categoryConfig[alert.category]?.icon
              : null;

            return (
              <div key={alert.id} className={cn("p-4", config.bg)}>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-full p-1.5 shrink-0 mt-0.5",
                      alert.severity === "critical" &&
                        "bg-red-100 dark:bg-red-900/50",
                      alert.severity === "high" &&
                        "bg-amber-100 dark:bg-amber-900/50",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.text)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          config.textStrong,
                        )}
                      >
                        {alert.title}
                      </span>
                      <Badge
                        variant={config.badge}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {alert.severity}
                      </Badge>
                      {CategoryIcon && (
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 px-1.5 py-0"
                        >
                          <CategoryIcon className="h-2.5 w-2.5" />
                          {
                            categoryConfig[
                              alert.category as keyof typeof categoryConfig
                            ]?.label
                          }
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-1">
                      {alert.affectedItem}
                      {timeAgo && (
                        <span className="ml-2 text-muted-foreground/60">
                          • {timeAgo}
                        </span>
                      )}
                    </p>

                    <p className="text-sm text-foreground/80 mb-3">
                      {alert.context}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      {alert.actionHref && (
                        <Button
                          size="sm"
                          variant={
                            alert.severity === "critical"
                              ? "destructive"
                              : "default"
                          }
                          onClick={() => router.push(alert.actionHref!)}
                          className="h-8 px-3 text-sm gap-1"
                        >
                          {alert.actionLabel || "Take Action"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                        className="h-8 px-3 text-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(alert.id)}
                        className="h-8 px-2 text-sm text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Footer with view all link */}
          <div className="bg-muted/20 px-4 py-2.5 flex items-center justify-between">
            {hasMore && !isExpanded && (
              <span className="text-sm text-muted-foreground">
                +{activeAlerts.length - 3} more alerts
              </span>
            )}
            <Button
              variant="link"
              size="sm"
              onClick={() => router.push(`/farms/${farmId}/alerts`)}
              className="text-sm gap-1 text-muted-foreground ml-auto"
            >
              View all alerts in archive
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
