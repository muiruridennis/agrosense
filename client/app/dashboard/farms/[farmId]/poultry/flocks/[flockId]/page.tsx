// app/dashboard/farms/[farmId]/poultry/flocks/[flockId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { 
  useFlock, 
  useFlockSummary, 
  useFlockForecast, 
  useFlockPerformance,
  useTodayRecord 
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

export default function FlockPage() {
  const { farmId, flockId } = useParams();
  const farmIdStr = farmId as string;
  const flockIdStr = flockId as string;

  // Core data
  const { data: flock, isLoading: flockLoading } = useFlock(farmIdStr, flockIdStr);
  
  // Intelligence data
  const { data: summary, isLoading: summaryLoading } = useFlockSummary(farmIdStr, flockIdStr);
  const { data: forecast, isLoading: forecastLoading } = useFlockForecast(farmIdStr, flockIdStr);
  const { data: performance, isLoading: performanceLoading } = useFlockPerformance(farmIdStr, flockIdStr);
  const { data: todayRecord, isLoading: todayLoading } = useTodayRecord(farmIdStr, flockIdStr);

  const isLoading = flockLoading || summaryLoading || forecastLoading || performanceLoading || todayLoading;

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
      {/* Header */}
      <FlockHeader flock={flock} farmId={farmIdStr} />

      {/* KPI Strip */}
      <FlockKpiStrip flock={flock} />

      {/* Quick Actions */}
      <FlockActionsCard flock={flock} />

      {/* Intelligence Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FlockForecastCard forecast={forecast} flock={flock} />
        <FlockHealthStatusCard summary={summary} performance={performance} flock={flock} />
      </div>

      {/* Status & Financial Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FlockStatusCards flock={flock} />
        <FlockFinancialCard flock={flock} />
        <TodayRecordCard todayRecord={todayRecord} flockId={flockIdStr} />
      </div>

      {/* ✅ Tabs - Full width, no grid interference */}
      <div >
        <FlockTabs flock={flock} farmId={farmIdStr} />
      </div>
    </div>
  );
}

function TodayRecordCard({ 
  todayRecord, 
  flockId 
}: { 
  todayRecord?: { exists: boolean; record: any; status: string | null };
  flockId: string;
}) {
  if (!todayRecord) return null;

  const { exists, record, status } = todayRecord;

  if (!exists) {
    return (
      <div className="rounded-xl border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">📝 No record for today</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click "Add Daily Record" to log today's data
        </p>
      </div>
    );
  }

  const statusColors = {
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-950/30",
    submitted: "bg-blue-100 text-blue-700 dark:bg-blue-950/30",
    reviewed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30",
    flagged: "bg-rose-100 text-rose-700 dark:bg-rose-950/30",
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Today's Record</span>
        <span className={cn(
          "rounded px-2 py-0.5 text-[10px] font-semibold capitalize",
          statusColors[status as keyof typeof statusColors] || statusColors.draft
        )}>
          {status || "draft"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Record submitted for today
      </p>
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
