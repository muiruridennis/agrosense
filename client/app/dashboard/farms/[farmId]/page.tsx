"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useFarm } from "../hooks/useFarms";
import { useDashboardDataIntegrated } from "@/lib/hooks/useIntegratedDashboard";

// Components
import { FarmKpiStrip } from "./components/FarmKpiStrip";
import { QuickActionsBar } from "./components/QuickActionsBar";
import { EnterpriseGrid } from "./components/EnterpriseGrid";
import { AlertsPanel } from "./components/AlertsPanel";
import { PoultryHousesList } from "./components/PoultryHousesList";
import { LivestockRoster } from "./components/LivestockRoster";
import { StockItemsPanel } from "./components/StockItemsPanel";
import { TeamPanel } from "./components/TeamPanel";
import { FarmAboutCard } from "./components/FarmAboutCard";
import { GpsLocationCard } from "./components/GpsLocationCard";
import { FarmPageSkeleton } from "./components/FarmPageSkeleton";

// Icons
import { DollarSign, Bird, Milk, Package } from "lucide-react";

// Helpers
import { fmt, fmtKes } from "./lib/utils";

// Types
type OperationalStatus = "healthy" | "warning" | "critical";

export default function FarmDashboardPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const { user } = useAuth();

  const { data: farm, isLoading: farmLoading } = useFarm(farmId);
  const dashboard = useDashboardDataIntegrated(farmId);
  const { isLoading: dashLoading } = dashboard;

  if (farmLoading || dashLoading) return <FarmPageSkeleton />;
  if (!farm) return <NotFoundState />;

  // Derive user role from members array
  const userRole = farm.members?.find((m) => m.userId === user?.id)?.role ?? "worker";

  // Calculate metrics
  const totalCapacity = farm.poultryHouses?.filter(h => h.isActive).reduce((s, h) => s + h.capacity, 0) ?? 0;

  // KPI data
  const kpis = [
    {
      label: "Monthly Revenue",
      value: fmtKes(dashboard.totalRevenue),
      sub: new Date().toLocaleString("en-KE", { month: "long" }),
      delta: dashboard.totalRevenue > 0 
        ? { value: `${dashboard.avgProfitMargin.toFixed(1)}% margin`, positive: dashboard.avgProfitMargin > 0 }
        : null,
      icon: DollarSign,
    },
    {
      label: "Active Birds",
      value: fmt(dashboard.totalBirds),
      sub: `${farm.poultryHouses?.filter(h => h.isActive).length ?? 0} houses · ${fmt(totalCapacity)} cap.`,
      delta: null,
      icon: Bird,
    },
    {
      label: "Dairy Cattle",
      value: fmt(farm.cows?.filter(c => c.status === "active").length),
      sub: farm.cows?.filter(c => c.isCurrentlyLactating).length
        ? `${farm.cows.filter(c => c.isCurrentlyLactating).length} in milk`
        : "None lactating",
      delta: null,
      icon: Milk,
    },
    {
      label: "Stock Items",
      value: fmt(dashboard.inventoryOps?.totalItems ?? farm.stockItems?.length),
      sub: dashboard.inventoryOps?.criticalStock
        ? `${dashboard.inventoryOps.criticalStock} critical`
        : "All adequate",
      delta: dashboard.inventoryOps?.criticalStock
        ? { value: `${dashboard.inventoryOps.criticalStock} critical`, positive: false }
        : null,
      icon: Package,
    },
  ];

  // Enterprise modules data
  const enterprises = [
    {
      icon: Bird,
      label: "Poultry",
      status: (dashboard.poultry?.status ?? "healthy") as OperationalStatus,
      href: `/dashboard/farms/${farmId}/poultry`,
      empty: !dashboard.poultry?.totalBirds,
      lines: [
        { key: "Active flocks", value: fmt(dashboard.poultry?.activeFlocks), highlight: true },
        { key: "Total birds", value: fmt(dashboard.poultry?.totalBirds), highlight: true },
        { key: "Active houses", value: fmt(dashboard.poultry?.activeHouses) },
        { key: "Alerts", value: fmt(dashboard.poultry?.alerts) },
      ],
    },
    {
      icon: Milk,
      label: "Dairy",
      status: (dashboard.dairy?.status ?? "healthy") as OperationalStatus,
      href: `/dashboard/farms/${farmId}/livestock`,
      empty: !dashboard.dairy?.totalAnimals,
      lines: [
        { key: "Total cows", value: fmt(dashboard.dairy?.totalAnimals), highlight: true },
        { key: "In milk", value: fmt(dashboard.dairy?.activeHerds), highlight: true },
        { key: "Yield/day", value: `${fmt(dashboard.dairy?.dailyMilkYield)} L` },
        { key: "Health", value: dashboard.dairy?.healthStatus ?? "—" },
      ],
    },
    {
      icon: Package,
      label: "Inventory",
      status: (dashboard.inventoryOps?.status ?? "healthy") as OperationalStatus,
      href: `/dashboard/farms/${farmId}/inventory`,
      empty: !dashboard.inventoryOps?.totalItems,
      lines: [
        { key: "Total items", value: fmt(dashboard.inventoryOps?.totalItems), highlight: true },
        { key: "Low stock", value: fmt(dashboard.inventoryOps?.lowStock) },
        { key: "Critical", value: fmt(dashboard.inventoryOps?.criticalStock), highlight: (dashboard.inventoryOps?.criticalStock ?? 0) > 0 },
        { key: "Reorder", value: fmt(dashboard.inventoryOps?.reorderCount) },
      ],
    },
    {
      icon: Bird,
      label: "Crops",
      status: (dashboard.crops?.status ?? "healthy") as OperationalStatus,
      href: `/dashboard/farms/${farmId}/crops`,
      empty: !dashboard.crops?.activeCycles,
      lines: [
        { key: "Active cycles", value: fmt(dashboard.crops?.activeCycles), highlight: true },
        { key: "Crop types", value: fmt(dashboard.crops?.activePlots) },
        { key: "Pest pressure", value: dashboard.crops?.pestPressure ?? "—" },
        { key: "Alerts", value: fmt(dashboard.crops?.alerts) },
      ],
    },
  ];

  const hasCriticalIssues = (dashboard.criticalIssues?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-[1400px] space-y-5 p-5">
        

        {/* Quick Actions */}
        <QuickActionsBar farmId={farmId} />

        {/* Critical Alerts - only if present */}
        {hasCriticalIssues && !dashLoading && (
          <AlertsPanel issues={dashboard.criticalIssues} />
        )}

        {/* KPI Strip */}
        <FarmKpiStrip kpis={kpis} />

        {/* Main Grid: 2/3 - 1/3 layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">

          {/* LEFT COLUMN */}
          <div className="space-y-5">

            {/* Enterprise Modules Grid */}
            <EnterpriseGrid enterprises={enterprises} />

            {/* Poultry Houses - from farm GET */}
            {(farm.poultryHouses?.length ?? 0) > 0 && (
              <PoultryHousesList houses={farm.poultryHouses} farmId={farmId} />
            )}

            {/* Farm About Section */}
            <FarmAboutCard farm={farm} />

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">

            {/* Dairy Livestock - from farm GET */}
            {(farm.cows?.length ?? 0) > 0 && (
              <LivestockRoster cows={farm.cows} farmId={farmId} />
            )}

            {/* Stock Items - from farm GET */}
            {(farm.stockItems?.length ?? 0) > 0 && (
              <StockItemsPanel items={farm.stockItems} farmId={farmId} />
            )}

            {/* Team Members - from farm GET */}
            {(farm.members?.length ?? 0) > 0 && (
              <TeamPanel members={farm.members} farmId={farmId} />
            )}

            {/* GPS Location - if coordinates exist */}
            {farm.geoPoint && (
              <GpsLocationCard geoPoint={farm.geoPoint} />
            )}

            {/* Data Freshness */}
            <div className="text-center">
              <p className="font-mono text-[10px] text-muted-foreground/40">
                Last updated · {new Date().toLocaleString("en-KE")}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Farm not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The farm you're looking for doesn't exist or you don't have access.
        </p>
      </div>
    </div>
  );
}