"use client";

import { useState, useEffect } from "react";
import { useDashboardDataIntegrated } from "@/lib/hooks/useIntegratedDashboard";
import { TopBar } from "../shared/TopBar";
import { QuickActionsBar } from "../shared/QuickActionsBar";
import { DashboardSkeleton } from "../ui/dashboard-skeleton";
import { KpiCard } from "../cards/KpiCard";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  CalendarCheck2,
  Activity,
  Wheat,
  Droplet,
  Bird,
  History,
  Landmark,
  Egg,
  Syringe,
  Truck,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CriticalAlerts } from "../shared/CriticalAlerts";
import { StatusCard } from "../cards/StatusCard";
import { Badge } from "@/components/ui/badge";
import { FarmStatusSection } from "../owner/FarmStatusSection";
import { CashflowChart } from "../charts/CashflowChart";
import { ProductionChart } from "../charts/ProductionChart";
import { MortalityChart } from "../charts/MortalityChart";
import { ProductionInventorySection } from "../owner/ProductionInventorySection";
import { OwnerSidebar } from "../owner/OwnerSidebar";
interface Task {
  id: number;
  text: string;
  due: string;
  urgency: "overdue" | "today" | "soon";
  completed: boolean;
  actionLink?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADING
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  label,
  action,
  onAction,
}: {
  icon: React.ElementType;
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS ROW
// ─────────────────────────────────────────────────────────────────────────────

function ProgressRow({
  label,
  valueLabel,
  pct,
  color,
}: {
  label: string;
  valueLabel: string;
  pct: number;
  color: "success" | "warning" | "destructive";
}) {
  const fill = {
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  }[color];

  const val = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[color];

  return (
    <div className="border-b border-border/60 px-4 py-3 last:border-none">
      <div className="mb-1.5 flex justify-between text-[11px]">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("font-mono", val)}>{valueLabel}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            fill,
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK ITEM
// ─────────────────────────────────────────────────────────────────────────────

const URGENCY_STYLES = {
  overdue: "text-destructive font-semibold",
  today: "text-warning",
  soon: "text-muted-foreground/60",
};

function TaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="group flex w-full items-start gap-3 border-b border-border/60 px-4 py-2.5 text-left transition-colors hover:bg-muted/40 last:border-none"
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-150",
          task.completed
            ? "border-success bg-success"
            : "border-border group-hover:border-primary/50",
        )}
      >
        {task.completed && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-xs leading-snug transition-colors",
            task.completed
              ? "text-muted-foreground/50 line-through"
              : "text-foreground",
          )}
        >
          {task.text}
        </p>
        <p
          className={cn(
            "mt-0.5 flex items-center gap-1 text-[10px]",
            URGENCY_STYLES[task.urgency],
          )}
        >
          <Clock className="h-2.5 w-2.5 shrink-0" />
          {task.due}
        </p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY ITEM
// ─────────────────────────────────────────────────────────────────────────────

function ActivityItem({
  text,
  time,
  type,
}: {
  text: string;
  time: string;
  type: "alert" | "event" | "transaction";
}) {
  const dotColors = {
    alert: "bg-destructive",
    event: "bg-warning",
    transaction: "bg-success",
  };

  return (
    <div className="flex items-start gap-3 border-b border-border/60 px-4 py-2.5 last:border-none">
      <span
        className={cn(
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          dotColors[type],
        )}
      />
      <p className="flex-1 text-[11px] leading-snug text-foreground/80">
        {text}
      </p>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        {time}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR PANEL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function SidePanel({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN OWNER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

interface OwnerDashboardProps {
  farmId: string;
  farmName: string;
}

export function OwnerDashboard({ farmId, farmName }: OwnerDashboardProps) {
  const dashboard = useDashboardDataIntegrated(farmId);
  const {
    isLoading,
    totals,
    finance,
    poultry,
    inventoryOps,
    diseaseAlerts,
    inventoryAlerts,
    criticalIssues,
    activeFlockCount,
    totalBirds,
    financialHealth,
  } = dashboard;

  const urgentAlerts =
    criticalIssues?.filter(
      (issue) => issue.severity === "critical" || issue.severity === "high",
    ) || [];

  // Task management with local state (could be replaced with API later)
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      text: "Vaccinate Flock #123",
      due: "Overdue",
      urgency: "overdue",
      completed: false,
    },
    {
      id: 2,
      text: "Order feed — 2 days remaining",
      due: "By end of today",
      urgency: "today",
      completed: false,
    },
    {
      id: 3,
      text: "Delivery expected: 1,200 kg feed",
      due: "Today at 2:00 PM",
      urgency: "today",
      completed: false,
    },
    {
      id: 4,
      text: "Record yesterday's mortality",
      due: "Overdue",
      urgency: "overdue",
      completed: false,
    },
  ]);

  const toggleTask = (id: number) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Calculate real metrics from dashboard data
  const mortalityRate = 1.9; // TODO: Replace with real data when available
  const mortalityTarget = 1.2;
  const feedDaysRemaining = inventoryOps?.reorderCount > 0 ? 2 : 7;
  const hasCriticalAlert = (criticalIssues?.length || 0) > 0;
  const topCriticalIssue = criticalIssues?.[0];

  // Build activity feed from real data
  const recentActivities = [
    ...(diseaseAlerts?.slice(0, 2).map((alert) => ({
      text: `Health alert: ${alert.diseaseName} - ${alert.hostTarget}`,
      time: new Date(alert.triggeredAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "alert" as const,
    })) || []),
    ...(inventoryAlerts?.slice(0, 2).map((alert) => ({
      text: `Inventory: ${alert.message}`,
      time: new Date(alert.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "alert" as const,
    })) || []),
  ];

  // If no real activities, show placeholder
  if (recentActivities.length === 0) {
    recentActivities.push(
      { text: "No recent alerts", time: "", type: "event" as const },
      { text: "Farm status is healthy", time: "", type: "event" as const },
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navigation */}
      <TopBar farmName={farmName} role="owner" />
      <QuickActionsBar role="owner" farmId={farmId} />

      {/* Critical Alert Banner - shows only when there's a real critical issue */}

      {/* Two-column layout */}
      <div className="mx-auto max-w-[1400px]">
        <div className="space-y-6 border-r border-border/60 p-5">
          {urgentAlerts.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <CriticalAlerts
                alerts={urgentAlerts}
                farmId={farmId}
                maxVisible={3}
              />
            </div>
          )}
        </div>
        <div className="grid min-h-[calc(100vh-120px)] grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* ── MAIN CONTENT ── */}
          <div className="space-y-6 border-r border-border/60 p-5">
            <FarmStatusSection farmId={farmId} />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Financial & Production Analytics
                  </h2>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    Track cash flow and egg production over time
                  </p>
                </div>
                <div className="h-4 w-1 rounded-full bg-primary/30" />
              </div>

              {/* 2-Column Grid for Charts */}
              <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-2">
                {/* Cash Flow Chart Card */}
                <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
                  {/* Subtle accent line */}
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500/50 via-emerald-500/20 to-transparent" />
                  <div className="p-4 md:p-5">
                    <CashflowChart farmId={farmId} />
                  </div>
                </div>

                {/* Production Chart Card */}
                <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500/50 via-blue-500/20 to-transparent" />
                  <div className="p-4 md:p-5">
                    <ProductionChart farmId={farmId} />
                  </div>
                </div>
              </div>
            </div>
            {/* 4. PRODUCTION & INVENTORY */}

            <ProductionInventorySection
              feedConversion={{
                current: 1.62,
                target: 1.58,
                percentage: 76,
              }}
              feedRemaining={{
                days: feedDaysRemaining,
                percentage: feedDaysRemaining === 2 ? 14 : 50,
                status: feedDaysRemaining <= 2 ? "critical" : "warning",
              }}
              inventoryStatus={{
                totalItems: inventoryOps?.totalItems || 0,
                lowStock: inventoryOps?.lowStock || 0,
                criticalStock: inventoryOps?.criticalStock || 0,
                healthyStock:
                  (inventoryOps?.totalItems || 0) -
                  (inventoryOps?.lowStock || 0) -
                  (inventoryOps?.criticalStock || 0),
                criticalItems: inventoryOps?.itemsNeedingReorder?.map(
                  (item) => ({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    daysSupply: item.daysSupply,
                  }),
                ),
              }}
            />
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-4 p-5">
            {/* ── SIDEBAR (Red / Amber / Green Zones) ── */}
            <OwnerSidebar
              // Red Zone
              urgentAlerts={urgentAlerts}
              feedDaysRemaining={feedDaysRemaining}
              criticalItems={inventoryOps?.criticalItems || []}
              cashRunwayDays={financialHealth?.cashRunwayDays}
              // Amber Zone
              pendingTasks={tasks.filter((t) => !t.completed)}
              itemsNeedingReorder={inventoryOps?.itemsNeedingReorder || []}
              diseaseAlerts={diseaseAlerts || []}
              // Green Zone
              mortalityRate={
                poultry?.mortalityRate ?? totals?.mortalityRate ?? 1.9
              }
              mortalityTarget={1.2}
              cashScore={financialHealth?.score}
              activeFlockCount={activeFlockCount || 0}
              totalBirds={totalBirds || 0}
            />
          </div>
        </div>

        {/* Data freshness indicator */}
        <div className="border-t border-border/60 py-3 text-center">
          <p className="font-mono text-[10px] text-muted-foreground/50">
            Last updated · {new Date().toLocaleString()} · Data is manually
            entered
          </p>
        </div>
      </div>
    </div>
  );
}
