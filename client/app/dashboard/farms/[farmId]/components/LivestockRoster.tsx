import { Button } from "@/components/ui/button";
import { Badge, ChevronRight, Milk } from "lucide-react";
import { useRouter } from "next/navigation";

// LivestockSummaryCard.tsx - Replaces the full list on overview
export function LivestockRoster ({ cows, farmId }: { cows: Cow[]; farmId: string }) {
  const router = useRouter();
  
  const stats = {
    total: cows.length,
    active: cows.filter(c => c.status === "active").length,
    lactating: cows.filter(c => c.isCurrentlyLactating).length,
    dry: cows.filter(c => c.status === "active" && !c.isCurrentlyLactating).length,
    sick: cows.filter(c => c.healthStatus === "sick" || c.healthStatus === "critical").length,
    pregnant: cows.filter(c => c.isPregnant).length,
    dueThisMonth: cows.filter(c => c.expectedCalvingDate && isThisMonth(c.expectedCalvingDate)).length,
  };

  const recentAlerts = cows.filter(c => c.healthStatus === "critical").slice(0, 3);

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Header with navigation to full list */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Milk className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Dairy Herd</h3>
          <Badge>{stats.total} cows</Badge>
        </div>
        <Button
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/dashboard/farms/${farmId}/livestock`)}
          className="gap-1"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Key Metrics Grid - 4 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
          <p className="text-2xl font-bold text-emerald-600">{stats.lactating}</p>
          <p className="text-xs text-muted-foreground">In Milk</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
          <p className="text-2xl font-bold text-amber-600">{stats.dry}</p>
          <p className="text-xs text-muted-foreground">Dry</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30">
          <p className="text-2xl font-bold text-rose-600">{stats.sick}</p>
          <p className="text-xs text-muted-foreground">Sick/Alert</p>
        </div>
      </div>

      {/* Critical Alerts - Only show if there are issues */}
      {recentAlerts.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <p className="text-xs font-semibold text-rose-600 mb-2">⚠️ Requires Attention</p>
          {recentAlerts.map(cow => (
            <div key={cow.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="font-medium">{cow.name || cow.tagId}</span>
              <Badge variant="destructive" className="text-[9px]">{cow.healthStatus}</Badge>
            </div>
          ))}
          {stats.sick > 3 && (
            <p className="text-xs text-muted-foreground mt-1">+ {stats.sick - 3} more</p>
          )}
        </div>
      )}

      {/* Upcoming Events */}
      {stats.dueThisMonth > 0 && (
        <div className="mt-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            📅 {stats.dueThisMonth} calving due this month
          </p>
        </div>
      )}
    </div>
  );
}