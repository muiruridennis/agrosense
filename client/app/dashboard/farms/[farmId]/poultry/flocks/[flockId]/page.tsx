// app/dashboard/farms/[farmId]/poultry/flocks/[flockId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import {
  useFlock,
  useFlockSummary,
  useFlockForecast,
  useFlockPerformance,
  useTodayRecord,
} from "../../hooks/usePoultry";
import { FlockHeader } from "./components/FlockHeader";
import { FlockKpiStrip } from "./components/FlockKpiStrip";
import { FlockActionsCard } from "./components/FlockActionsCard";
import { FlockStatusCards } from "./components/FlockStatusCards";
import { FlockFinancialCard } from "./components/FlockFinancialCard";
import { FlockTabs } from "./components/FlockTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FlockForecastCard } from "./components/FlockForecastCard";
import { FlockHealthStatusCard } from "./components/FlockHealthStatusCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays, Eye, Pencil, Plus } from "lucide-react";
import { FarmMemberRole } from "@/types";
import { useFarmRole } from "@/providers/FarmRoleContext";

export default function FlockPage() {
  const { farmId, flockId } = useParams();
  const farmIdStr = farmId as string;
  const flockIdStr = flockId as string;

  // ✅ Get role from context
  const {
    role,
    isOwner,
    isManager,
    isWorker,
    canViewFinancials,
    canReviewRecords,
  } = useFarmRole();

  // Core data
  const { data: flock, isLoading: flockLoading } = useFlock(
    farmIdStr,
    flockIdStr,
  );

  // Intelligence data
  const { data: summary, isLoading: summaryLoading } = useFlockSummary(
    farmIdStr,
    flockIdStr,
  );
  const { data: forecast, isLoading: forecastLoading } = useFlockForecast(
    farmIdStr,
    flockIdStr,
  );
  const { data: performance, isLoading: performanceLoading } =
    useFlockPerformance(farmIdStr, flockIdStr);
  const { data: todayRecord, isLoading: todayLoading } = useTodayRecord(
    farmIdStr,
    flockIdStr,
  );

  const isLoading =
    flockLoading ||
    summaryLoading ||
    forecastLoading ||
    performanceLoading ||
    todayLoading;

  if (isLoading) {
    return <FlockPageSkeleton />;
  }

  if (!flock) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Flock not found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The flock you're looking for doesn't exist or you don't have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header - Shows role badge */}
      <FlockHeader flock={flock} farmId={farmIdStr} />

      {/* KPI Strip - Shows different KPIs based on role */}
      <FlockKpiStrip flock={flock} role={role} />
      {/* Quick Actions - Shows different actions based on role */}
      <FlockActionsCard flock={flock} role={role} />
      {/* Tabs - Role-aware tabs */}
      <FlockTabs flock={flock} farmId={farmIdStr} role={role} />

      {/* Intelligence Row - Everyone sees health, only managers/owners see forecast? */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ✅ Everyone sees health status */}
        <FlockHealthStatusCard
          summary={summary}
          performance={performance}
          flock={flock}
        />

        {/* ✅ Only managers and owners see forecast */}
        {(isManager || isOwner) && (
          <FlockForecastCard forecast={forecast} flock={flock} />
        )}

        {/* ✅ Workers see a simplified view instead */}
        {isWorker && (
          <WorkerInsightsCard flock={flock} todayRecord={todayRecord} />
        )}
      </div>

      {/* Status & Financial Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FlockStatusCards flock={flock} />

        {/* ✅ Only managers and owners see financial card */}
        {canViewFinancials && <FlockFinancialCard flock={flock} />}

        {/* ✅ Everyone sees today's record status */}
        <TodayRecordCard
          todayRecord={todayRecord}
          flockId={flockIdStr}
          role={role}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKER INSIGHTS CARD (Simplified view for workers)
// ─────────────────────────────────────────────────────────────────────────────

function WorkerInsightsCard({
  flock,
  todayRecord,
}: {
  flock: any;
  todayRecord?: { exists: boolean; record: any; status: string | null };
}) {
  const hasTodayRecord = todayRecord?.exists || false;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Today's Status</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-xs text-muted-foreground">Current Birds</p>
          <p className="text-xl font-bold">
            {flock.currentCount.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-xs text-muted-foreground">Status</p>
          <p
            className={cn(
              "text-sm font-semibold capitalize",
              flock.status === "active"
                ? "text-emerald-600"
                : "text-muted-foreground",
            )}
          >
            {flock.status}
          </p>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        {hasTodayRecord ? (
          <span className="text-emerald-600">✓ Record submitted for today</span>
        ) : (
          <span>📝 No record for today</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TODAY RECORD CARD (Enhanced with role awareness)
// ─────────────────────────────────────────────────────────────────────────────

function TodayRecordCard({
  todayRecord,
  flockId,
  role,
  onAddRecord,
  onViewRecord,
}: {
  todayRecord?: { exists: boolean; record: any; status: string | null };
  flockId: string;
  role: FarmMemberRole;
  onAddRecord?: () => void;
  onViewRecord?: (record: any) => void;
}) {
  if (!todayRecord) return null;

  const { exists, record, status } = todayRecord;
  const isWorker = role === FarmMemberRole.WORKER;

  if (!exists) {
    return (
      <div className="rounded-xl border bg-card p-4 text-center space-y-3">
        <div className="flex flex-col items-center gap-1">
          <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">
            No record for today
          </p>
          <p className="text-xs text-muted-foreground">
            Log today's performance data
          </p>
        </div>
        {onAddRecord && (isWorker || role === FarmMemberRole.MANAGER) && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddRecord}
            className="w-full gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Today's Record
          </Button>
        )}
      </div>
    );
  }

  const statusColors = {
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-950/30",
    submitted: "bg-blue-100 text-blue-700 dark:bg-blue-950/30",
    reviewed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30",
    flagged: "bg-rose-100 text-rose-700 dark:bg-rose-950/30",
  };

  const mortality = record.mortality || 0;
  const feed = record.feedConsumedKg || 0;
  const eggs = (record.morningEggs || 0) + (record.eveningEggs || 0);
  const hasData = mortality > 0 || feed > 0 || eggs > 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Today's Record</span>
        </div>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-semibold capitalize",
            statusColors[status as keyof typeof statusColors] ||
              statusColors.draft,
          )}
        >
          {status || "draft"}
        </span>
      </div>

      {hasData ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Mortality</p>
            <p
              className={cn(
                "text-sm font-semibold",
                mortality > 0 ? "text-rose-600" : "text-muted-foreground",
              )}
            >
              {mortality}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Feed (kg)</p>
            <p className="text-sm font-semibold">{feed.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Eggs</p>
            <p className="text-sm font-semibold">{eggs}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-1">
          No data logged yet today
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewRecord?.(record)}
          className="flex-1 gap-1 text-xs"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
        {(isWorker || role === FarmMemberRole.MANAGER) && (
          <Button
            variant={status === "draft" ? "default" : "outline"}
            size="sm"
            onClick={onAddRecord}
            className="flex-1 gap-1 text-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
            {status === "draft" ? "Edit" : "Add New"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function FlockPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
