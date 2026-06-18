// app/dashboard/farms/[farmId]/components/AlertsPanel.tsx
"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { DashboardIntegratedData } from "@/lib/hooks/useIntegratedDashboard";

interface AlertsPanelProps {
  issues: DashboardIntegratedData["criticalIssues"];
}

const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-400",
    badge: "destructive",
  },
  high: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    badge: "default",
  },
  medium: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    badge: "secondary",
  },
};

export function AlertsPanel({ issues }: AlertsPanelProps) {
  const router = useRouter();

  if (!issues?.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/30 dark:border-rose-800 dark:from-rose-950/30 dark:to-rose-950/10 shadow-sm">
      <div className="flex items-center gap-2 border-b border-rose-200/50 px-5 py-3.5 dark:border-rose-800/50">
        <div className="rounded-full bg-rose-100 p-1.5 dark:bg-rose-900/30">
          <Bell className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
          Attention Required
        </h3>
        <Badge variant="destructive" className="ml-2 text-[10px]">
          {issues.length} Alert{issues.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="divide-y divide-rose-200/50 dark:divide-rose-800/50">
        {issues.slice(0, 4).map((issue) => {
          const severity = issue.severity as keyof typeof SEVERITY_CONFIG;
          const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;

          return (
            <button
              key={issue.id}
              onClick={() => issue.actionHref && router.push(issue.actionHref)}
              className={cn(
                "group flex w-full items-center gap-4 px-5 py-4 text-left transition-all hover:bg-white/50 dark:hover:bg-black/20",
                config.bg,
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-black/20">
                <AlertTriangle className={cn("h-4 w-4", config.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{issue.title}</p>
                  <Badge variant={config.badge as any} className="text-[9px] uppercase">
                    {issue.severity}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {issue.context}
                </p>
                <p className="mt-1 text-[11px] font-medium text-primary">
                  {issue.recommendedAction}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })}
      </div>

      {issues.length > 4 && (
        <div className="border-t border-rose-200/50 px-5 py-3 text-center dark:border-rose-800/50">
          <button className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400">
            + {issues.length - 4} more alerts
          </button>
        </div>
      )}
    </div>
  );
}