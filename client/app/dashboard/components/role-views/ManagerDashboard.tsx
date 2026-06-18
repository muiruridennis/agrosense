"use client";

import { useDashboardDataIntegrated } from "@/lib/hooks/useIntegratedDashboard";
import { TopBar } from "../shared/TopBar";
import { QuickActionsBar } from "../shared/QuickActionsBar";
import { CriticalAlerts } from "../shared/CriticalAlerts";
import { EnterpriseModulesPro } from "../shared/EnterpriseModules";
import { RecentActivity } from "../shared/RecentActivity";
import { WeatherWidget } from "../shared/WeatherWidget";
import { KpiCard } from "../cards/KpiCard";
import { StatusCard } from "../cards/StatusCard";
import { DashboardSkeleton } from "../ui/dashboard-skeleton";
import { DollarSign, Package, Users, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { useEnterpriseRiskAssessment } from "@/lib/hooks/useEnterpriseRiskAssessment";

interface ManagerDashboardProps {
  farmId: string;
  farmName: string;
}

export function ManagerDashboard({ farmId, farmName }: ManagerDashboardProps) {
  const dashboard = useDashboardDataIntegrated(farmId);
            const riskAssessment = useEnterpriseRiskAssessment(farmId);

  const {
    isLoading,
    criticalIssues,
    totals,
    alerts,
    poultry,
    dairy,
    crops,
    inventoryOps,
  } = dashboard;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const urgentAlerts =
    criticalIssues?.filter((issue) => issue.severity === "critical") || [];

  // Manager KPIs - operational focus with limited financials
  const managerKpis = [
    {
      title: "Active Operations",
      value: `${(poultry?.activeFlocks || 0) + (dairy?.activeHerds || 0) + (crops?.activeCycles || 0)}`,
      subtitle: "Flocks · Herds · Crops",
      icon: TrendingUp,
      trend: { value: 5, isPositive: true },
    },
    {
      title: "Total Livestock",
      value: `${(poultry?.totalBirds || 0) + (dairy?.totalAnimals || 0)}`,
      subtitle: `${poultry?.totalBirds || 0} birds · ${dairy?.totalAnimals || 0} cattle`,
      icon: Users,
    },
    {
      title: "Inventory Status",
      value: `${inventoryOps?.totalItems || 0} items`,
      subtitle: `${inventoryOps?.lowStock || 0} low · ${inventoryOps?.criticalStock || 0} critical`,
      icon: Package,
      alert: (inventoryOps?.lowStock || 0) > 0,
    },
    {
      title: "Monthly Revenue",
      value: `KES ${(totals?.income || 0).toLocaleString()}`,
      subtitle: `${(dashboard.avgProfitMargin || 0).toFixed(1)}% margin`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
        {/* Top Bar */}
        <TopBar farmName={farmName} role="manager" />

        {/* Quick Actions */}
        <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm md:-mx-6 md:px-6">
          <QuickActionsBar role="manager" farmId={farmId} />
        </div>

        {/* Critical Alerts */}
        {urgentAlerts.length > 0 && (
          // In OwnerDashboard.tsx
          <CriticalAlerts
            alerts={urgentAlerts}
            farmId={farmId}
            maxVisible={3}
            onAcknowledge={async (id) => {
              await apiClient.post(`/alerts/${id}/acknowledge`);
              toast.success("Alert acknowledged");
            }}
          />
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {managerKpis.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Operational Status Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            title="Poultry"
            status={poultry?.status || "healthy"}
            metrics={[
              { label: "Active Flocks", value: poultry?.activeFlocks || 0 },
              { label: "Total Birds", value: poultry?.totalBirds || 0 },
              { label: "Alerts", value: poultry?.alerts || 0, isAlert: true },
            ]}
          />
          <StatusCard
            title="Dairy"
            status={dairy?.status || "healthy"}
            metrics={[
              { label: "Active Cows", value: dairy?.activeHerds || 0 },
              { label: "Daily Yield", value: `${dairy?.dailyMilkYield || 0}L` },
              {
                label: "Health Issues",
                value: dairy?.alerts || 0,
                isAlert: true,
              },
            ]}
          />
          <StatusCard
            title="Crops"
            status={crops?.status || "healthy"}
            metrics={[
              { label: "Active Cycles", value: crops?.activeCycles || 0 },
              { label: "Hectares", value: crops?.plantedHectares || 0 },
              { label: "Pest Pressure", value: crops?.pestPressure || "Low" },
            ]}
          />
          <StatusCard
            title="Inventory"
            status={inventoryOps?.status || "healthy"}
            metrics={[
              { label: "Total Items", value: inventoryOps?.totalItems || 0 },
              {
                label: "Need Reorder",
                value: inventoryOps?.reorderCount || 0,
                isAlert: true,
              },
              {
                label: "Critical Stock",
                value: inventoryOps?.criticalStock || 0,
                isAlert: true,
              },
            ]}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Enterprise Details */}

          <EnterpriseModulesPro
            modules={riskAssessment.modules}
            businessImpact={riskAssessment.businessImpact}
            role="owner"
          />

          {/* Right Column - Activity */}
          <aside className="space-y-6">
            <RecentActivity farmId={farmId} limit={10} />
            <WeatherWidget farmId={farmId} />
          </aside>
        </div>
      </div>
    </div>
  );
}
