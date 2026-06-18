// app/dashboard/components/owner/OwnerSidebar.tsx
"use client";

import { AlertTriangle, CalendarCheck2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ============================================================
// Types
// ============================================================

interface Task {
  id: number;
  text: string;
  due: string;
  urgency: "overdue" | "today" | "soon";
  completed: boolean;
}

interface OwnerSidebarProps {
  // Red Zone
  urgentAlerts: Array<{ title?: string; diseaseName?: string }>;
  feedDaysRemaining: number;
  criticalItems: Array<{ itemName: string }>;
  cashRunwayDays?: number;
  
  // Amber Zone
  pendingTasks: Task[];
  itemsNeedingReorder: Array<{ itemName: string; daysSupply: number }>;
  diseaseAlerts: Array<{ recommendation?: string; diseaseName: string; severity: string }>;
  
  // Green Zone
  mortalityRate: number;
  mortalityTarget: number;
  cashScore?: number;
  activeFlockCount: number;
  totalBirds: number;
}

// ============================================================
// Side Panel Wrapper
// ============================================================

function SidePanel({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
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

// ============================================================
// Task Item
// ============================================================

function TaskItem({ task }: { task: Task }) {
  const urgencyStyles = {
    overdue: "text-destructive font-semibold",
    today: "text-warning",
    soon: "text-muted-foreground/60",
  };

  return (
    <div className="group flex w-full items-start gap-3 border-b border-border/60 px-4 py-2.5 text-left last:border-none">
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug text-foreground">{task.text}</p>
        <p className={cn("mt-0.5 flex items-center gap-1 text-[10px]", urgencyStyles[task.urgency])}>
          <Clock className="h-2.5 w-2.5 shrink-0" />
          {task.due}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Progress Row
// ============================================================

function ProgressRow({ label, valueLabel, pct, color }: { label: string; valueLabel: string; pct: number; color: "success" | "warning" | "destructive" }) {
  const fillColors = {
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };

  const textColors = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <div className="border-b border-border/60 px-4 py-3 last:border-none">
      <div className="mb-1.5 flex justify-between text-[11px]">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("font-mono", textColors[color])}>{valueLabel}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", fillColors[color])} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// ============================================================
// Main Sidebar Component
// ============================================================

export function OwnerSidebar({
  // Red Zone
  urgentAlerts,
  feedDaysRemaining,
  criticalItems,
  cashRunwayDays,
  // Amber Zone
  pendingTasks,
  itemsNeedingReorder,
  diseaseAlerts,
  // Green Zone
  mortalityRate,
  mortalityTarget,
  cashScore,
  activeFlockCount,
  totalBirds,
}: OwnerSidebarProps) {
  
  // ============================================================
  // RED ZONE: Build blocking issues
  // ============================================================
  
  const blockingIssues: string[] = [];
  
  urgentAlerts.forEach((alert) => {
    blockingIssues.push(alert.title || alert.diseaseName || "Critical alert");
  });
  
  if (feedDaysRemaining <= 2) {
    blockingIssues.push(`Low feed: ${feedDaysRemaining} day(s) remaining`);
  }
  
  criticalItems?.forEach((item) => {
    blockingIssues.push(`Critical stock: ${item.itemName}`);
  });
  
  if (cashRunwayDays !== undefined && cashRunwayDays <= 7) {
    blockingIssues.push(`Low cash runway: ${cashRunwayDays} days`);
  }
  
  // ============================================================
  // AMBER ZONE: Build action items
  // ============================================================
  
  const actionTasks: Task[] = [];
  
  // Add pending tasks
  pendingTasks.forEach((task) => {
    actionTasks.push(task);
  });
  
  // Add reorder items
  itemsNeedingReorder?.forEach((item, i) => {
    actionTasks.push({
      id: 1000 + i,
      text: `Reorder ${item.itemName} — ${item.daysSupply} days supply left`,
      due: item.daysSupply <= 2 ? "Today" : `In ${item.daysSupply} days`,
      urgency: item.daysSupply <= 2 ? "today" : "soon",
      completed: false,
    });
  });
  
  // Add disease alerts
  diseaseAlerts?.forEach((alert, i) => {
    actionTasks.push({
      id: 2000 + i,
      text: alert.recommendation || `Respond to ${alert.diseaseName}`,
      due: alert.severity === "critical" ? "Overdue" : "Soon",
      urgency: alert.severity === "critical" ? "overdue" : "soon",
      completed: false,
    });
  });
  
  // ============================================================
  // GREEN ZONE: Calculate metrics
  // ============================================================
  
  const mortalityValue = mortalityRate ?? 1.9;
  const isMortalityHigh = mortalityValue > mortalityTarget;
  const feedPercentage = feedDaysRemaining <= 2 ? 10 : feedDaysRemaining <= 7 ? 50 : 90;
  const cashPercentage = Math.min((cashScore ?? 0) * 100, 100);
  const isCashHealthy = (cashScore ?? 1) >= 0.5;
  
  // ============================================================
  // RENDER
  // ============================================================
  
  return (
    <div className="space-y-4">
      {/* RED ZONE - Blocking Issues */}
      <SidePanel icon={AlertTriangle} title="Red Zone · Blocking">
        {blockingIssues.length === 0 ? (
          <div className="px-4 py-3 text-[11px] text-muted-foreground/80">
            No blocking issues detected
          </div>
        ) : (
          <div>
            {blockingIssues.map((issue, idx) => (
              <div key={idx} className="border-b border-border/60 px-4 py-3 last:border-none">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-foreground">{issue}</p>
                  <Badge variant="destructive" className="shrink-0">Blocking</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </SidePanel>

      {/* AMBER ZONE - Action Items */}
      <SidePanel icon={CalendarCheck2} title="Amber Zone · Action Items">
        {actionTasks.length === 0 ? (
          <div className="px-4 py-3 text-[11px] text-muted-foreground/80">
            No suggested actions
          </div>
        ) : (
          <div>
            {actionTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </SidePanel>

      {/* GREEN ZONE - Summary */}
      <SidePanel icon={CheckCircle2} title="Green Zone · Summary">
        <ProgressRow
          label="Mortality"
          valueLabel={`${mortalityValue}%`}
          pct={Math.min(mortalityValue, 100)}
          color={isMortalityHigh ? "destructive" : "success"}
        />

        <ProgressRow
          label="Feed remaining"
          valueLabel={`${feedDaysRemaining} day(s)`}
          pct={feedPercentage}
          color={feedDaysRemaining <= 2 ? "destructive" : "warning"}
        />

        <ProgressRow
          label="Cash runway"
          valueLabel={`${cashRunwayDays ?? "—"} days`}
          pct={cashPercentage}
          color={isCashHealthy ? "success" : "warning"}
        />

        <div className="border-t border-border/60 px-4 py-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Flocks</span>
            <span className="font-mono">{activeFlockCount || 0}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Total birds</span>
            <span className="font-mono">{totalBirds || 0}</span>
          </div>
        </div>
      </SidePanel>
    </div>
  );
}