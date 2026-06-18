import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

// ============================================
// TYPES for Integrated Data
// ============================================

export interface FlockSummary {
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

export interface InventoryCurrentItem {
  id: string;
  farmId: string;
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  lastUpdated: string | Date;
  daysSupply: number | null;
  estimatedRunoutDate: string | Date | null;
  status: string;
  latestExpiryDate: string | Date | null;
  latestBatchNumber: string | null;
  avgDailyConsumption: number | null;
  avgDailyConsumption30Days: number | null;
  minStockLevel: number;
  optimalStockDays: number;
}

export interface InventorySummary {
  totalItems: number;
  lowStock: number;
  criticalStock: number;
  totalValue: number;
  averageDaysSupply: number;
  itemsNeedingReorder: Array<{
    itemId: string;
    itemName: string;
    currentStock: number;
    daysSupply: number;
  }>;
}

export interface FinancialHealthData {
  overallScore: number;
  profitabilityScore: number;
  liquidityScore: number;
  solvencyScore: number;
  efficiencyScore: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  revenueTrend: number;
  profitTrend: number;
  costTrend: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  actionItems: string[];
}

export interface FinanceSummary {
  period: string;
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  accountsPayable: number;
  accountsReceivable: number;
  costsByCategory?: Array<{
    category: string;
    totalQuantity: number;
    totalCost: number;
    unit: string;
    costPerUnit: number;
    entries: number;
    percentOfTotal: number;
  }>;
  revenueByCategory?: Array<{
    category: string;
    totalQuantity: number;
    totalRevenue: number;
    unit: string;
    revenuePerUnit: number;
    entries: number;
    percentOfTotal: number;
  }>;
  cashInflow?: number;
  cashOutflow?: number;
  netCashFlow?: number;
  costPerPoultry?: number | null;
  costPerDairyCow?: number | null;
  costPerSmallRuminant?: number | null;
}

export interface DairySummary {
  totalCows: number;
  activeCows: number;
  soldThisYear: number;
  deceasedThisYear: number;
  cowsInMilk: number;
  avgYieldPerCow: number;
  totalYesterdayLitres: number;
  cowsPregnant: number;
  expectedBirthsThisMonth: number;
  expectedBirthsNextMonth: number;
  cowsReadyToBreed: number;
  healthAlertsToday: string[];
  activeMastitusCases: number;
  activeLamenessCases: number;
  highestProducers: Array<{
    cowTagId: string;
    yieldLitres: number;
    daysInMilk: number;
  }>;
  lowestProducers: Array<{
    cowTagId: string;
    yieldLitres: number;
    daysInMilk: number;
  }>;
}

export interface CropSummaryRow {
  cropType: string;
  status: string;
  count: number;
  totalYieldKg: number;
  avgYieldKg: number;
}

export interface DashboardAlertItem {
  id: string;
  diseaseName: string;
  severity: "low" | "medium" | "high" | "critical";
  hostType: string;
  hostTarget: string;
  triggeredAt: string;
  isRead: boolean;
}

export interface StockAlertDto {
  id: string;
  itemId: string;
  itemName: string;
  alertType: string;
  message: string;
  details: string | null;
  severity: "info" | "warning" | "critical";
  alertStatus: string;
  createdAt: string | Date;
}

export interface DashboardAlertsSummary {
  total: number;
  critical: number;
  high: number;
  unread: number;
}

function unwrap<T>(response: any): T {
  if (response && typeof response === "object" && "data" in response) {
    return response.data as T;
  }
  return response as T;
}

// Operational enterprise summaries for dashboard
export interface PoultryOperationalData {
  status: "healthy" | "warning" | "critical";
  activeHouses: number;
  activeFlocks: number;
  totalBirds: number;
  alerts: number;
  trend?: { current: number; previous: number };
}

export interface DairyOperationalData {
  status: "healthy" | "warning" | "critical";
  activeHerds: number;
  totalAnimals: number;
  dailyMilkYield: number;
  healthStatus: string;
  alerts: number;
  trend?: { current: number; previous: number };
}

export interface CropsOperationalData {
  status: "healthy" | "warning" | "critical";
  activePlots: number;
  plantedHectares: number;
  activeCycles: number;
  pestPressure: string;
  alerts: number;
  trend?: { current: number; previous: number };
}

export interface InventoryOperationalData {
  status: "healthy" | "warning" | "critical";
  totalItems: number;
  lowStock: number;
  criticalStock: number;
  reorderCount: number;
  alerts: number;
  trend?: { current: number; previous: number };
}

export interface DashboardIntegratedData {
  // Legacy compatibility
  flocks: FlockSummary[];
  inventory: InventorySummary;
  finance: FinanceSummary;
  activeFlockCount: number;
  totalBirds: number;
  totalRevenue: number;
  totalProfit: number;
  avgProfitMargin: number;

  // New operational data
  poultry?: PoultryOperationalData;
  dairy?: DairyOperationalData;
  crops?: CropsOperationalData;
  inventoryOps?: InventoryOperationalData;

  diseaseAlerts?: DashboardAlertItem[];
  inventoryAlerts?: StockAlertDto[];
  criticalIssues?: Array<{
    id: string;
    severity: "critical" | "high" | "medium";
    title: string;
    context: string;
    affectedItem: string;
    recommendedAction: string;
    actionHref?: string;
    actionLabel?: string;
    timestamp: string;
  }>;
  alerts?: DashboardAlertsSummary;
  financialHealth?: FinancialHealthData;
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

// ============================================
// MAIN HOOK - Get all dashboard data
// ============================================

export function useIntegratedDashboard(farmId: string | undefined) {
  // Get active flocks from Poultry module
  const { data: flocks = [], isLoading: flocksLoading } =
    useActiveFlocks(farmId);

  // Get inventory summary
  const { data: inventory, isLoading: inventoryLoading } =
    useInventorySummary(farmId);

  // Get finance summary for current month
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: finance, isLoading: financeLoading } = useFinanceSummary(
    farmId,
    currentPeriod,
  );

  // Process and aggregate data
  const dashboardData = useMemo(() => {
    if (!flocks.length && !inventory && !finance) return null;

    const totalRevenue = flocks.reduce(
      (sum, f) => sum + (f.revenueTotal || 0),
      0,
    );
    const totalProfit = flocks.reduce((sum, f) => sum + (f.netProfit || 0), 0);
    const totalBirds = flocks.reduce(
      (sum, f) => sum + (f.currentCount || 0),
      0,
    );

    return {
      flocks,
      inventory: inventory || {
        totalItems: 0,
        lowStock: 0,
        criticalStock: 0,
        totalValue: 0,
        itemsNeedingReorder: [],
      },
      finance: finance || {
        period: currentPeriod,
        totalRevenue: 0,
        totalCosts: 0,
        grossProfit: 0,
        profitMargin: 0,
        accountsPayable: 0,
        accountsReceivable: 0,
      },
      activeFlockCount: flocks.filter((f) => f.status === "active").length,
      totalBirds,
      totalRevenue,
      totalProfit,
      avgProfitMargin:
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    };
  }, [flocks, inventory, finance]);

  return {
    data: dashboardData,
    isLoading: flocksLoading || inventoryLoading || financeLoading,
    refetch: () => {
      // Could implement combined refetch
    },
  };
}

// ============================================
// POULTRY HOOKS
// ============================================

export function useActiveFlocks(farmId: string | undefined) {
  return useQuery({
    queryKey: integratedKeys.flocks(farmId ?? ""),
    queryFn: async () => {
      const housesEnvelope = await apiClient.get<
        { id: string; name: string }[]
      >(`/farms/${farmId}/poultry/houses`);
      const houses = unwrap(housesEnvelope) ?? [];

      const allFlocks: FlockSummary[] = [];
      for (const house of houses) {
        const flocksEnvelope = await apiClient.get<FlockSummary[]>(
          `/poultry/houses/${house.id}/flocks`,
        );
        const flocks = unwrap(flocksEnvelope) ?? [];
        allFlocks.push(...flocks);
      }

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
      const envelope = await apiClient.get(
        `/poultry/flocks/${flockId}/summary`,
      );
      return unwrap(envelope);
    },
    enabled: !!flockId,
  });
}

// ============================================
// INVENTORY HOOKS
// ============================================

export function useInventoryCurrent(farmId: string | undefined) {
  return useQuery({
    queryKey: ["inventory", "current", farmId] as const,
    queryFn: async () => {
      const envelope = await apiClient.get<InventoryCurrentItem[]>(
        `/farms/${farmId}/inventory/current`,
      );
      return unwrap(envelope) ?? [];
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInventorySummary(farmId: string | undefined) {
  const inventoryCurrentQuery = useInventoryCurrent(farmId);

  return {
    ...inventoryCurrentQuery,
    data: inventoryCurrentQuery.data
      ? (() => {
          const accumulator = inventoryCurrentQuery.data.reduce(
            (summary, item) => {
              const lowStock =
                item.status === "low" ||
                item.status === "low_stock" ||
                (item.daysSupply !== null &&
                  item.daysSupply <= item.minStockLevel);
              const criticalStock = item.status === "critical";

              summary.totalItems += 1;
              summary.lowStock += lowStock ? 1 : 0;
              summary.criticalStock += criticalStock ? 1 : 0;
              if (item.daysSupply !== null && item.daysSupply >= 0) {
                summary.daysSupplyTotal += item.daysSupply;
                summary.daysSupplyCount += 1;
              }
              if (lowStock || criticalStock) {
                summary.itemsNeedingReorder.push({
                  itemId: item.itemId,
                  itemName: item.itemName,
                  currentStock: item.quantityOnHand,
                  daysSupply: item.daysSupply ?? 0,
                });
              }

              return summary;
            },
            {
              totalItems: 0,
              lowStock: 0,
              criticalStock: 0,
              totalValue: 0,
              daysSupplyTotal: 0,
              daysSupplyCount: 0,
              itemsNeedingReorder:
                [] as InventorySummary["itemsNeedingReorder"],
            },
          );

          return {
            totalItems: accumulator.totalItems,
            lowStock: accumulator.lowStock,
            criticalStock: accumulator.criticalStock,
            totalValue: accumulator.totalValue,
            averageDaysSupply:
              accumulator.daysSupplyCount > 0
                ? accumulator.daysSupplyTotal / accumulator.daysSupplyCount
                : 0,
            itemsNeedingReorder: accumulator.itemsNeedingReorder,
          };
        })()
      : {
          totalItems: 0,
          lowStock: 0,
          criticalStock: 0,
          totalValue: 0,
          averageDaysSupply: 0,
          itemsNeedingReorder: [],
        },
  };
}

export function useStockItems(farmId: string | undefined, category?: string) {
  const url = category
    ? `/farms/${farmId}/inventory/items?category=${category}`
    : `/farms/${farmId}/inventory/items`;

  return useQuery({
    queryKey: ["inventory", "items", farmId, category],
    queryFn: async () => {
      const envelope = await apiClient.get(url);
      return unwrap(envelope) ?? [];
    },
    enabled: !!farmId,
  });
}

export function useStockAlerts(farmId: string | undefined) {
  return useQuery({
    queryKey: ["inventory", "alerts", farmId],
    queryFn: async () => {
      const envelope = await apiClient.get<StockAlertDto[]>(
        `/farms/${farmId}/inventory/alerts`,
      );
      return unwrap(envelope) ?? [];
    },
    enabled: !!farmId,
  });
}

export function useDairySummary(farmId: string | undefined) {
  return useQuery({
    queryKey: ["dairy", "summary", farmId],
    queryFn: async () => {
      const envelope = await apiClient.get<DairySummary>(
        `/dairy/farms/${farmId}/summary`,
      );
      return unwrap(envelope);
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCropSummary(farmId: string | undefined) {
  return useQuery({
    queryKey: ["crops", "summary", farmId],
    queryFn: async () => {
      const envelope = await apiClient.get<CropSummaryRow[]>(
        `/farms/${farmId}/crop-cycles/summary`,
      );
      return unwrap(envelope) ?? [];
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFarmAlerts(farmId: string | undefined) {
  return useQuery({
    queryKey: ["alerts", "farm", farmId],
    queryFn: async () => {
      const envelope = await apiClient.get<DiseaseAlertEntity[]>(
        `/farms/${farmId}/alerts`,
      );
      return unwrap(envelope) ?? [];
    },
    enabled: !!farmId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// FINANCE HOOKS
// ============================================

export function useFinanceSummary(farmId: string | undefined, period: string) {
  return useQuery({
    queryKey: integratedKeys.finance(farmId ?? "", period),
    queryFn: async () => {
      const envelope = await apiClient.get<FinanceSummary>(
        `/finance/farms/${farmId}/summary/${period}`,
      );
      return unwrap(envelope);
    },
    enabled: !!farmId && !!period,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFinancialComparison(
  farmId: string | undefined,
  currentPeriod: string,
  previousPeriod: string,
) {
  return useQuery({
    queryKey: ["finance", "comparison", farmId, currentPeriod, previousPeriod],
    queryFn: async () => {
      const envelope = await apiClient.get(
        `/finance/farms/${farmId}/compare?current=${currentPeriod}&previous=${previousPeriod}`,
      );
      return unwrap(envelope);
    },
    enabled: !!farmId && !!currentPeriod && !!previousPeriod,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCashFlowSummary(
  farmId: string | undefined,
  currentCash: number = 0,
) {
  return useQuery({
    queryKey: ["finance", "cashflow", farmId, currentCash],
    queryFn: async () => {
      const envelope = await apiClient.get(
        `/finance/farms/${farmId}/cashflow/summary?currentCash=${currentCash}`,
      );
      return unwrap(envelope);
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBudgetSummary(farmId: string | undefined, period: string) {
  return useQuery({
    queryKey: ["finance", "budget", farmId, period],
    queryFn: async () => {
      const envelope = await apiClient.get(
        `/finance/farms/${farmId}/budgets/${period}`,
      );
      return unwrap(envelope);
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
      const envelope = await apiClient.get(
        `/finance/farms/${farmId}/costs?startDate=${startDate}&endDate=${endDate}`,
      );
      return unwrap(envelope) ?? [];
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
      const envelope = await apiClient.get(
        `/finance/farms/${farmId}/revenue?startDate=${startDate}&endDate=${endDate}`,
      );
      return unwrap(envelope) ?? [];
    },
    enabled: !!farmId,
  });
}
export function useFinancialHealth(farmId: string | undefined) {
  return useQuery({
    queryKey: ["finance", "health", farmId],
    queryFn: async () => {
      const envelope = await apiClient.get<FinancialHealthData>(
        `/finance/farms/${farmId}/health`,
      );
      return unwrap(envelope);
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// COMBINED HOOK for Dashboard
// ============================================

/**
 * Main dashboard data hook - aggregates all enterprise data
 * Computes operational status for each module
 */
export function useDashboardDataIntegrated(farmId: string | undefined) {
  const { data: flocks = [], isLoading: flocksLoading } =
    useActiveFlocks(farmId);
  const { data: inventory, isLoading: inventoryLoading } =
    useInventorySummary(farmId);
  const { data: dairy, isLoading: dairyLoading } = useDairySummary(farmId);
  const { data: cropsSummary = [], isLoading: cropsLoading } =
    useCropSummary(farmId);
  const { data: diseaseAlerts = [], isLoading: alertsLoading } =
    useFarmAlerts(farmId);
  const { data: inventoryAlerts = [], isLoading: inventoryAlertsLoading } =
    useStockAlerts(farmId);
  const { data: financialHealth, isLoading: healthLoading } =
    useFinancialHealth(farmId);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const { data: finance, isLoading: financeLoading } = useFinanceSummary(
    farmId,
    currentPeriod,
  );

  const isLoading =
    flocksLoading ||
    inventoryLoading ||
    financeLoading ||
    dairyLoading ||
    cropsLoading ||
    alertsLoading ||
    inventoryAlertsLoading ||
    healthLoading;

  const dashboardData = useMemo(() => {
    if (
      !flocks.length &&
      !inventory &&
      !finance &&
      !dairy &&
      !cropsSummary.length &&
      !diseaseAlerts.length &&
      !inventoryAlerts.length
    )
      return null;

    const income = flocks.reduce((sum, f) => sum + (f.revenueTotal || 0), 0);
    const expenses = flocks.reduce((sum, f) => sum + (f.feedCostTotal || 0), 0);
    const netProfit = income - expenses;
    const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;
    const totalBirds = flocks.reduce(
      (sum, f) => sum + (f.currentCount || 0),
      0,
    );
    const activeFlockCount = flocks.filter((f) => f.status === "active").length;

    const activeHouseCount = new Set(
      flocks.map((f) => (f as any).houseId).filter(Boolean),
    ).size;

    const poultry: PoultryOperationalData = {
      status:
        activeFlockCount === 0 || totalBirds === 0 ? "warning" : "healthy",
      activeHouses: activeHouseCount || 0,
      activeFlocks: activeFlockCount,
      totalBirds,
      alerts: diseaseAlerts.filter((alert) => alert.severity !== "low").length,
      trend:
        totalBirds > 0
          ? { current: totalBirds, previous: totalBirds }
          : undefined,
    };

    const dairyOps: DairyOperationalData = {
      status:
        (dairy?.healthAlertsToday?.length || 0) > 0 ? "warning" : "healthy",
      activeHerds: dairy?.activeCows || 0,
      totalAnimals: dairy?.totalCows || 0,
      dailyMilkYield: dairy?.totalYesterdayLitres || 0,
      healthStatus:
        dairy?.healthAlertsToday?.length > 0
          ? `${dairy.healthAlertsToday.length} active issue(s)`
          : "Stable",
      alerts: dairy?.healthAlertsToday?.length || 0,
      trend:
        dairy?.totalYesterdayLitres !== undefined
          ? {
              current: dairy.totalYesterdayLitres,
              previous: dairy.avgYieldPerCow || dairy.totalYesterdayLitres,
            }
          : undefined,
    };

    const activeCycles = cropsSummary.reduce(
      (sum, row) => sum + (Number(row.count) || 0),
      0,
    );
    const uniqueCropTypes = new Set(cropsSummary.map((row) => row.cropType))
      .size;
    const totalCropYield = cropsSummary.reduce(
      (sum, row) => sum + (Number(row.totalYieldKg) || 0),
      0,
    );

    const crops: CropsOperationalData = {
      status: activeCycles > 0 ? "healthy" : "warning",
      activePlots: uniqueCropTypes || 0,
      plantedHectares: activeCycles || 0,
      activeCycles,
      pestPressure: "Low",
      alerts: 0,
      trend:
        totalCropYield > 0
          ? {
              current: totalCropYield,
              previous: totalCropYield,
            }
          : undefined,
    };

    const inventoryOps: InventoryOperationalData = {
      status:
        (inventory?.criticalStock || 0) > 0
          ? "critical"
          : (inventory?.lowStock || 0) > 2
            ? "warning"
            : "healthy",
      totalItems: inventory?.totalItems || 0,
      lowStock: inventory?.lowStock || 0,
      criticalStock: inventory?.criticalStock || 0,
      reorderCount: inventory?.itemsNeedingReorder?.length || 0,
      alerts: inventoryAlerts.filter((alert) => alert.severity !== "info")
        .length,
      trend:
        (inventory?.lowStock || 0) > 0 || (inventory?.criticalStock || 0) > 0
          ? {
              current: inventory?.lowStock || 0,
              previous: inventory?.lowStock || 0,
            }
          : undefined,
    };

    const mappedDiseaseAlerts: DashboardAlertItem[] = diseaseAlerts.map(
      (alert) => ({
        id: alert.id,
        diseaseName: alert.diseaseName,
        severity:
          alert.severity === "critical" || alert.severity === "high"
            ? alert.severity
            : alert.severity === "medium"
              ? "medium"
              : "low",
        hostType: alert.hostType,
        hostTarget: alert.hostTarget || "Farm",
        triggeredAt:
          typeof alert.triggeredAt === "string"
            ? alert.triggeredAt
            : alert.triggeredAt?.toISOString() || new Date().toISOString(),
        isRead: alert.isRead,
      }),
    );

    const combinedCriticalIssues = [
      ...mappedDiseaseAlerts
        .filter(
          (item) => item.severity === "critical" || item.severity === "high",
        )
        .map((item) => ({
          id: item.id,
          severity: item.severity,
          title: item.diseaseName,
          context: `Detected on ${item.hostType}`,
          affectedItem: item.hostTarget,
          recommendedAction: "Review recommendation and resolve immediately.",
          actionHref: "/dashboard/alerts",
          actionLabel: "Review alert",
          timestamp: item.triggeredAt,
        })),
      ...inventoryAlerts
        .filter(
          (item) => item.severity === "critical" || item.severity === "warning",
        )
        .map((item) => ({
          id: item.id,
          severity: item.severity === "critical" ? "critical" : "high",
          title: `${item.itemName} stock alert`,
          context: item.details || item.message,
          affectedItem: item.itemName,
          recommendedAction:
            "Inspect inventory and replenish stock if required.",
          actionHref: "/dashboard/inventory",
          actionLabel: "Review stock",
          timestamp:
            typeof item.createdAt === "string"
              ? item.createdAt
              : item.createdAt?.toISOString() || new Date().toISOString(),
        })),
    ];

    const unreadAlertCount = mappedDiseaseAlerts.filter(
      (item) => !item.isRead,
    ).length;
    const criticalAlertCount = mappedDiseaseAlerts.filter(
      (item) => item.severity === "critical" || item.severity === "high",
    ).length;
    const highInventoryAlertCount = inventoryAlerts.filter(
      (item) => item.severity === "warning" || item.severity === "critical",
    ).length;

    return {
      flocks,
      inventory: inventory || {
        totalItems: 0,
        lowStock: 0,
        criticalStock: 0,
        totalValue: 0,
        itemsNeedingReorder: [],
      },
      finance: finance || {
        period: currentPeriod,
        totalRevenue: 0,
        totalCosts: 0,
        grossProfit: 0,
        profitMargin: 0,
        accountsPayable: 0,
        accountsReceivable: 0,
      },
      activeFlockCount,
      totalBirds,
      totalRevenue: income,
      totalProfit: netProfit,
      avgProfitMargin: profitMargin,
      poultry,
      dairy: dairyOps,
      crops,
      inventoryOps,
      diseaseAlerts: mappedDiseaseAlerts,
      inventoryAlerts,
      criticalIssues: combinedCriticalIssues,
      alerts: {
        total: mappedDiseaseAlerts.length + inventoryAlerts.length,
        critical: criticalAlertCount + highInventoryAlertCount,
        high: highInventoryAlertCount,
        unread: unreadAlertCount,
      },
    } as DashboardIntegratedData;
  }, [
    flocks,
    inventory,
    finance,
    dairy,
    cropsSummary,
    diseaseAlerts,
    inventoryAlerts,
    currentPeriod,
    financialHealth,
  ]);

  const defaultData: DashboardIntegratedData = {
    flocks: [],
    inventory: {
      totalItems: 0,
      lowStock: 0,
      criticalStock: 0,
      totalValue: 0,
      itemsNeedingReorder: [],
    },
    finance: {
      period: currentPeriod,
      totalRevenue: 0,
      totalCosts: 0,
      grossProfit: 0,
      profitMargin: 0,
      accountsPayable: 0,
      accountsReceivable: 0,
    },
    activeFlockCount: 0,
    totalBirds: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgProfitMargin: 0,
    poultry: {
      status: "healthy",
      activeHouses: 0,
      activeFlocks: 0,
      totalBirds: 0,
      alerts: 0,
    },
    dairy: {
      status: "healthy",
      activeHerds: 0,
      totalAnimals: 0,
      dailyMilkYield: 0,
      healthStatus: "Unknown",
      alerts: 0,
    },
    crops: {
      status: "healthy",
      activePlots: 0,
      plantedHectares: 0,
      activeCycles: 0,
      pestPressure: "Unknown",
      alerts: 0,
    },
    inventoryOps: {
      status: "healthy",
      totalItems: 0,
      lowStock: 0,
      criticalStock: 0,
      reorderCount: 0,
      alerts: 0,
    },
    diseaseAlerts: [],
    inventoryAlerts: [],
    criticalIssues: [],
    alerts: {
      total: 0,
      critical: 0,
      high: 0,
      unread: 0,
    },
  };

  const data = dashboardData || defaultData;

  return {
    ...data,
    flocks: data.flocks || [],
    inventory: data.inventory,
    finance: data.finance,
    financialHealth,
    totals: {
      income: data.totalRevenue || 0,
      expenses: data.finance?.totalCosts || 0,
      netProfit: data.totalProfit || 0,
      totalBirds: data.totalBirds || 0,
      activeFlocks: data.activeFlockCount || 0,
    },
    alerts: data.alerts,
    isLoading,
    hasData:
      (data.flocks?.length || 0) > 0 ||
      (data.inventory?.totalItems || 0) > 0 ||
      (data.diseaseAlerts?.length || 0) > 0 ||
      (data.inventoryAlerts?.length || 0) > 0,
  };
}
