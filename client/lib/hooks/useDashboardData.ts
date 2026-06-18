import { apiClient } from "@/lib/api/client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// ============================================
// TYPES for Integrated Data
// ============================================

interface FlockSummary {
  id: string;
  breed: string;
  type: "layers" | "broilers";
  currentStage: string;
  status: string;
  initialCount: number;
  currentCount: number;
  revenueTotal: number;
  feedCostTotal: number;
  netProfit: number;
  roiPercent: number;
}

interface House {
  id: string;
  name: string;
}

interface InventorySummary {
  totalItems: number;
  lowStock: number;
  criticalStock: number;
  totalValue: number;
  itemsNeedingReorder: Array<{
    itemId: string;
    itemName: string;
    currentStock: number;
    daysSupply: number;
  }>;
}

interface FinanceSummary {
  period: string;
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  accountsPayable: number;
  accountsReceivable: number;
}

// ============================================
// QUERY KEYS
// ============================================

export const integratedKeys = {
  dashboard: (farmId: string) => ["integrated", "dashboard", farmId] as const,
  flocks: (farmId: string) => ["integrated", "flocks", farmId] as const,
  inventory: (farmId: string) => ["integrated", "inventory", farmId] as const,
  finance: (farmId: string, period?: string) =>
    ["integrated", "finance", farmId, period] as const,
};

function unwrap<T>(response: any): T {
  if (response && typeof response === "object" && "data" in response) {
    return response.data as T;
  }
  return response as T;
}

// ============================================
// POULTRY HOOKS
// ============================================

export function useActiveFlocks(farmId: string | undefined) {
  return useQuery({
    queryKey: integratedKeys.flocks(farmId ?? ""),
    queryFn: async () => {
      if (!farmId) return [];

      console.log("Fetching houses for farm:", farmId);

      // First get all houses for the farm
      const housesRes = await apiClient.get<House[]>(
        `/farms/${farmId}/poultry/houses`,
      );
      console.log("Houses response:", housesRes);

      // Extract data from envelope { success, data, timestamp }
      const houses = unwrap<House[]>(housesRes) || [];
      console.log("Houses:", houses);

      // Then get flocks for each house
      const allFlocks: FlockSummary[] = [];
      for (const house of houses) {
        console.log("Fetching flocks for house:", house.id);
        const flocksRes = await apiClient.get<FlockSummary[]>(
          `/poultry/houses/${house.id}/flocks`,
        );
        console.log("Flocks response for house", house.id, ":", flocksRes);

        const flocks = unwrap<FlockSummary[]>(flocksRes) || [];
        allFlocks.push(...flocks);
      }

      console.log("Total flocks:", allFlocks);
      return allFlocks;
    },
    enabled: !!farmId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useFlockSummary(flockId: string | undefined) {
  return useQuery({
    queryKey: ["flock", "summary", flockId],
    queryFn: async () => {
      if (!flockId) return null;
      const res = await apiClient.get(`/poultry/flocks/${flockId}/summary`);
      return unwrap(res);
    },
    enabled: !!flockId,
  });
}

// ============================================
// INVENTORY HOOKS
// ============================================

export function useInventorySummary(farmId: string | undefined) {
  return useQuery({
    queryKey: integratedKeys.inventory(farmId ?? ""),
    queryFn: async () => {
      if (!farmId) return null;
      console.log("Fetching inventory summary for farm:", farmId);
      const res = await apiClient.get<InventorySummary>(
        `/farms/${farmId}/inventory/summary`,
      );
      console.log("Inventory summary response:", res);
      return unwrap<InventorySummary>(res);
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStockItems(farmId: string | undefined, category?: string) {
  const url = category
    ? `/farms/${farmId}/inventory/items?category=${category}`
    : `/farms/${farmId}/inventory/items`;

  return useQuery({
    queryKey: ["inventory", "items", farmId, category],
    queryFn: async () => {
      if (!farmId) return [];
      const res = await apiClient.get(url);
      return unwrap<any[]>(res) ?? [];
    },
    enabled: !!farmId,
  });
}

export function useStockAlerts(farmId: string | undefined) {
  return useQuery({
    queryKey: ["inventory", "alerts", farmId],
    queryFn: async () => {
      if (!farmId) return [];
      const res = await apiClient.get(`/farms/${farmId}/inventory/alerts`);
      return unwrap<any[]>(res) ?? [];
    },
    enabled: !!farmId,
  });
}

// ============================================
// FINANCE HOOKS
// ============================================

export function useFinanceSummary(farmId: string | undefined, period: string) {
  return useQuery({
    queryKey: integratedKeys.finance(farmId ?? "", period),
    queryFn: async () => {
      if (!farmId) return null;
      console.log(
        "Fetching finance summary for farm:",
        farmId,
        "period:",
        period,
      );
      const res = await apiClient.get<FinanceSummary>(
        `/finance/farms/${farmId}/summary/${period}`,
      );
      console.log("Finance summary response:", res);
      return unwrap<FinanceSummary>(res);
    },
    enabled: !!farmId && !!period,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCosts(
  farmId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ["finance", "costs", farmId, startDate, endDate],
    queryFn: async () => {
      if (!farmId) return [];
      const res = await apiClient.get(
        `/finance/farms/${farmId}/costs?startDate=${startDate}&endDate=${endDate}`,
      );
      return unwrap<any[]>(res) ?? [];
    },
    enabled: !!farmId,
  });
}

export function useRevenue(
  farmId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ["finance", "revenue", farmId, startDate, endDate],
    queryFn: async () => {
      if (!farmId) return [];
      const res = await apiClient.get(
        `/finance/farms/${farmId}/revenue?startDate=${startDate}&endDate=${endDate}`,
      );
      return unwrap<any[]>(res) ?? [];
    },
    enabled: !!farmId,
  });
}

// ============================================
// MAIN HOOK - Get all dashboard data
// ============================================

export function useDashboardDataIntegrated(farmId: string | undefined) {
  const {
    data: flocks = [],
    isLoading: flocksLoading,
    error: flocksError,
  } = useActiveFlocks(farmId);
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useInventorySummary(farmId);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const {
    data: finance,
    isLoading: financeLoading,
    error: financeError,
  } = useFinanceSummary(farmId, currentPeriod);

  const isLoading = flocksLoading || inventoryLoading || financeLoading;

  // Log any errors
  if (flocksError) console.error("Flocks error:", flocksError);
  if (inventoryError) console.error("Inventory error:", inventoryError);
  if (financeError) console.error("Finance error:", financeError);

  // Calculate totals
  const totals = useMemo(
    () => ({
      income: flocks.reduce((sum, f) => sum + (f.revenueTotal || 0), 0),
      expenses: flocks.reduce((sum, f) => sum + (f.feedCostTotal || 0), 0),
      netProfit: flocks.reduce((sum, f) => sum + (f.netProfit || 0), 0),
      totalBirds: flocks.reduce((sum, f) => sum + (f.currentCount || 0), 0),
      activeFlocks: flocks.filter((f) => f.status === "active").length,
    }),
    [flocks],
  );

  // Process alerts from inventory
  const alerts = useMemo(
    () => ({
      items: inventory?.itemsNeedingReorder || [],
      critical: inventory?.criticalStock || 0,
      low: inventory?.lowStock || 0,
    }),
    [inventory],
  );

  console.log("Dashboard data:", {
    flocksCount: flocks.length,
    inventory,
    finance,
    totals,
  });

  return {
    flocks,
    inventory,
    finance,
    totals,
    alerts,
    isLoading,
    hasData: flocks.length > 0 || (inventory?.totalItems || 0) > 0,
    errors: {
      flocks: flocksError,
      inventory: inventoryError,
      finance: financeError,
    },
  };
}
