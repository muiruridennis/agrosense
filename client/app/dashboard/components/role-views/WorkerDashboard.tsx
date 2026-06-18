"use client";

import { useDashboardDataIntegrated } from "@/lib/hooks/useIntegratedDashboard";
import { TopBar } from "../shared/TopBar";
import { QuickActionsBar } from "../shared/QuickActionsBar";
import { CriticalAlerts } from "../shared/CriticalAlerts";
import { TodayTasks } from "../shared/TodayTasks";
import { EnterpriseModulesPro } from "../shared/EnterpriseModules";
import { RecentActivity } from "../shared/RecentActivity";
import { WeatherWidget } from "../shared/WeatherWidget";
import { DashboardSkeleton } from "../ui/dashboard-skeleton";
import { useEnterpriseRiskAssessment } from "@/lib/hooks/useEnterpriseRiskAssessment";

interface WorkerDashboardProps {
  farmId: string;
  farmName: string;
}

export function WorkerDashboard({ farmId, farmName }: WorkerDashboardProps) {
  const dashboard = useDashboardDataIntegrated(farmId);
            const riskAssessment = useEnterpriseRiskAssessment(farmId);

  const { isLoading, criticalIssues } = dashboard;

  if (isLoading) {
    return <DashboardSkeleton minimal />;
  }

  const urgentAlerts =
    criticalIssues?.filter((issue) => issue.severity === "critical") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
        {/* Top Bar */}
        <TopBar farmName={farmName} role="worker" />

        {/* Quick Actions - Sticky */}
        <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm md:-mx-6 md:px-6">
          <QuickActionsBar role="worker" farmId={farmId} />
        </div>

        {/* Critical Alerts - Only if urgent */}
        {urgentAlerts.length > 0 && (
          <CriticalAlerts alerts={urgentAlerts} farmId={farmId} />
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Tasks (2/3 width) */}
          <div className="space-y-6 lg:col-span-2">
            <TodayTasks farmId={farmId} />
            <EnterpriseModulesPro
              modules={riskAssessment.modules}
              businessImpact={riskAssessment.businessImpact}
              role="worker"
            />
          </div>

          {/* Right Column - Activity & Context (1/3 width) */}
          <aside className="space-y-6">
            <RecentActivity farmId={farmId} limit={10} />
            <WeatherWidget farmId={farmId} />
          </aside>
        </div>
      </div>
    </div>
  );
}
