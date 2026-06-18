// app/dashboard/hooks/useSelectedFarm.ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFarms } from "@/lib/hooks/useDashboard";
import { FarmMemberRole, FarmWithRole } from "@/types";

const SELECTED_FARM_KEY = ["selected-farm"] as const;
const STORAGE_KEY = "agrosense-selected-farm";

const getStoredFarmId = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const setStoredFarmId = (id: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    console.warn("Failed to save selected farm to localStorage");
  }
};

export function useSelectedFarm() {
  const queryClient = useQueryClient();
  const { data: farms = [], isLoading: farmsLoading } = useFarms();
  const { data: selectedFarmId = null } = useQuery({
    queryKey: SELECTED_FARM_KEY,
    queryFn: getStoredFarmId,
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: getStoredFarmId,
  });

  // Determine effective farm ID
  const effectiveFarmId = (() => {
    if (selectedFarmId && farms.some(f => f.id === selectedFarmId)) {
      return selectedFarmId;
    }
    return farms[0]?.id ?? null;
  })();

  const selectedFarm = farms.find(f => f.id === effectiveFarmId) as FarmWithRole | undefined;
  
  // Get role from the farm object (now attached)
  const role = selectedFarm?.role ?? FarmMemberRole.WORKER;

  const setSelectedFarm = (farm: { id: string }) => {
    queryClient.setQueryData(SELECTED_FARM_KEY, farm.id);
    setStoredFarmId(farm.id);
  };

  return {
    selectedFarm,
    role,
    setSelectedFarm,
    isLoading: farmsLoading,
    hasFarms: farms.length > 0,
  };
}