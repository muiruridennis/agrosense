"use client";

import { useAuth } from "@/providers/auth-provider";
import { useSelectedFarm } from "./hooks/useSelectedFarm";
import { FarmMemberRole } from "@/types";
import { OwnerDashboard } from "./components/role-views/OwnerDashboard";
import { ManagerDashboard } from "./components/role-views/ManagerDashboard";
import { WorkerDashboard } from "./components/role-views/WorkerDashboard";
import { EmptyFarmState } from "./components/shared/EmptyFarmState";
import { DashboardSkeleton } from "./components/ui/dashboard-skeleton";

export  default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { selectedFarm , role, isLoading: farmLoading } = useSelectedFarm();

  if (authLoading || farmLoading) {
    return <DashboardSkeleton />;
  }

  if (!selectedFarm) {
    return <EmptyFarmState />;
  }

  // Role-specific dashboard rendering
  switch (role) {
    case FarmMemberRole.OWNER:
      return (
        <OwnerDashboard farmId={selectedFarm.id} farmName={selectedFarm.name} />
      );
    case FarmMemberRole.MANAGER:
      return (
        <ManagerDashboard
          farmId={selectedFarm.id}
          farmName={selectedFarm.name}
        />
      );
    case FarmMemberRole.WORKER:
      return (
        <WorkerDashboard
          farmId={selectedFarm.id}
          farmName={selectedFarm.name}
        />
      );
    default:
      return (
        <WorkerDashboard
          farmId={selectedFarm.id}
          farmName={selectedFarm.name}
        />
      );
  }
}
