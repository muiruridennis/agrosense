// app/dashboard/farms/[farmId]/components/EnterpriseGrid.tsx
"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, Circle, AlertCircle, CheckCircle2 } from "lucide-react";

type OperationalStatus = "healthy" | "warning" | "critical";

const STATUS_CONFIG = {
  healthy: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    label: "Healthy",
    icon: CheckCircle2,
  },
  warning: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    label: "Warning",
    icon: AlertCircle,
  },
  critical: {
    dot: "bg-rose-500",
    ring: "ring-rose-500/20",
    text: "text-rose-700 dark:text-rose-400",
    label: "Critical",
    icon: AlertCircle,
  },
};

interface EnterpriseCardProps {
  icon: React.ElementType;
  label: string;
  status: OperationalStatus;
  lines: { key: string; value: string; highlight?: boolean }[];
  href: string;
  empty?: boolean;
}

function EnterpriseCard({ icon: Icon, label, status, lines, href, empty }: EnterpriseCardProps) {
  const router = useRouter();
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={() => router.push(href)}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border bg-card p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        empty && "opacity-60 hover:opacity-80",
        "animate-fade-in-up",
      )}
    >
      {/* Status bar */}
      <div className={cn("absolute left-0 top-0 h-1 w-full", config.dot)} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/5 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">{label}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-1">
            <StatusIcon className={cn("h-3 w-3", config.text)} />
            <span className={cn("text-[11px] font-medium", config.text)}>
              {config.label}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        {empty ? (
          <p className="text-sm text-muted-foreground/60">No data yet — click to set up</p>
        ) : (
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            {lines.map((line) => (
              <div key={line.key} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">{line.key}</span>
                <span className={cn(
                  "text-sm font-medium",
                  line.highlight ? "text-foreground" : "text-muted-foreground",
                )}>
                  {line.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

interface EnterpriseGridProps {
  enterprises: Array<{
    icon: React.ElementType;
    label: string;
    status: OperationalStatus;
    href: string;
    empty: boolean;
    lines: { key: string; value: string; highlight?: boolean }[];
  }>;
}

export function EnterpriseGrid({ enterprises }: EnterpriseGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Enterprise Modules</h2>
        <span className="text-xs text-muted-foreground/60">Click any card to manage</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {enterprises.map((enterprise, i) => (
          <EnterpriseCard key={enterprise.label} {...enterprise} />
        ))}
      </div>
    </div>
  );
}