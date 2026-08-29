// app/dashboard/farms/[farmId]/settings/pricing/page.tsx

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, History, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useActivePricing,
  usePricingHistory,
  usePricingVersions,
  useArchivePricingTier,
  useRestorePricingTier,
  useSuspendPricingTier,
} from "../hooks/usePricing";
import { CreatePricingDialog } from "./components/CreatePricingDialog";
import { PricingHistoryTable } from "./components/PricingHistoryTable";
import { PricingDetailDialog } from "./components/PricingDetailDialog";
import { formatDate } from "@/utils/date";
import { cn } from "@/lib/utils";
import { PricingTier, PricingHistory } from "@/types";
import { formatCreationReason } from "@/utils/pricing";
import { PricingCompare } from "./components/PricingCompare";

export default function PricingSettingsPage() {
  const { farmId } = useParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PricingHistory | null>(
    null,
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: active, isLoading: activeLoading } = useActivePricing(
    farmId as string,
  );
  console.log("Active pricing:", active);
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch,
  } = usePricingHistory(farmId as string, currentPage, itemsPerPage);
  const { data: versionsData } = usePricingVersions(farmId as string);

  const archiveTier = useArchivePricingTier(farmId as string);
  const restoreTier = useRestorePricingTier(farmId as string);
  const suspendTier = useSuspendPricingTier(farmId as string);

  if (activeLoading || historyLoading) {
    return <PricingSettingsSkeleton />;
  }

  const hasPricing = !!active;

  // ── Handlers ──
  const handleViewEvent = (event: PricingHistory) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  const handleArchive = (event: PricingHistory) => {
    // Need to get the tier ID from the event
    archiveTier.mutate(
      { tierId: event.pricingTierId, reason: "Archived via settings" },
      {
        onSuccess: () => {
          refetch();
          toast.success(`Pricing tier archived`);
        },
      },
    );
  };

  const handleRestore = (event: PricingHistory) => {
    restoreTier.mutate(
      { tierId: event.pricingTierId, reason: "Restored via settings" },
      {
        onSuccess: () => {
          refetch();
          toast.success(`Pricing tier restored`);
        },
      },
    );
  };

  const handleSuspend = (event: PricingHistory) => {
    suspendTier.mutate(
      { tierId: event.pricingTierId, reason: "Suspended via settings" },
      {
        onSuccess: () => {
          refetch();
          toast.success(`Pricing tier suspended`);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Pricing Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your farm's pricing. Changes create a new version for audit
            purposes.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {hasPricing ? "Create New Version" : "Set Up Pricing"}
        </Button>
      </div>

      {/* Current Active Pricing */}
      <Card
        className={cn(
          "border-l-4",
          hasPricing ? "border-l-emerald-500" : "border-l-amber-500",
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                {hasPricing ? "Current Pricing" : "No Active Pricing"}
                {hasPricing && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30">
                    Active v{active.version}
                  </Badge>
                )}
                {!hasPricing && (
                  <Badge variant="outline" className="text-amber-600">
                    Setup Required
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {hasPricing && active.effectiveDate
                  ? `Active since ${formatDate(active.effectiveDate)}`
                  : "Set up your farm's pricing to start tracking financials"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasPricing ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard
                label="Feed Price"
                value={`KES ${active.feedCostPerKg}/kg`}
              />
              <MetricCard
                label="Egg Price"
                value={`KES ${active.eggPricePerTray}/tray`}
              />
              <MetricCard
                label="Broiler Price"
                value={`KES ${active.broilerPricePerKg}/kg`}
              />
              <MetricCard
                label="Mortality Cost"
                value={`KES ${active.mortalityCostPerBird}/bird`}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No pricing has been set up for this farm yet.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Click "Set Up Pricing" to configure your farm's economic
                assumptions.
              </p>
            </div>
          )}

          {hasPricing && active.creationReason && (
            <div className="mt-4 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
              <span className="font-medium">Reason:</span>{" "}
              {formatCreationReason(active.creationReason)}
            </div>
          )}
          {hasPricing && active.createdByUser && (
            <p className="mt-2 text-xs text-muted-foreground">
              Set by {active.createdByUser.fullName || "Unknown"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Compare Versions
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <PricingHistoryTable
            history={historyData?.data || []}
            total={historyData?.total || 0}
            farmId={farmId as string}
            onView={handleViewEvent}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onSuspend={handleSuspend}
            isLoading={
              archiveTier.isPending ||
              restoreTier.isPending ||
              suspendTier.isPending
            }
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <PricingCompare
            tiers={versionsData?.data || []}
            isLoading={versionsData === undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreatePricingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        farmId={farmId as string}
        currentPricing={active}
      />

      {selectedEvent && (
        <PricingDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          history={selectedEvent}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MetricCard Helper
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/20 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  );
}

function PricingSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-1" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-64" />
    </div>
  );
}
