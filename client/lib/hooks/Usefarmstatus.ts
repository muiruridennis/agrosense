/**
 * useFarmStatus
 *
 * Answers a single question: "What is the current state of my farm right now?"
 *
 * Deliberately separate from useIntegratedDashboard.
 * - useIntegratedDashboard: KPIs, production analytics, financial totals
 * - useFarmStatus:          Operational state — what is wrong, what needs attention
 *
 * Data sources (6 endpoints, all available today):
 *   1. GET /finance/farms/{id}/health           → financial viability score
 *   2. GET /farms/{id}/health-summary           → active animal health issues
 *   3. GET /farms/{id}/inventory/current        → stock levels & runout dates
 *   4. GET /farms/{id}/alerts                   → disease risk alerts
 *   5. GET /dairy/farms/{id}/summary            → dairy operational state
 *   6. GET /farms/{id}/recommendations          → top action items
 *
 * Cache strategy:
 *   - Financial health:   10 min  (calculated monthly, slow-moving)
 *   - Health summary:      2 min  (event-driven, can change quickly)
 *   - Inventory:           5 min  (recalculated on consumption events)
 *   - Disease alerts:     10 min  (daily job @ 6 AM, stale by design)
 *   - Dairy summary:       5 min  (per-record update)
 *   - Recommendations:    10 min  (daily advisory job)
 */

import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiEnvelope } from "../api/client";
import type { FinancialHealthData } from "./useIntegratedDashboard";

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// These type the raw API responses exactly as the backend returns them.
// ─────────────────────────────────────────────────────────────────────────────

/** /farms/{id}/health-summary */
export interface HealthSummaryResponse {
  totalActive: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCondition: Record<string, number>;
  totalCost: number;
  totalLoss: number;
  animalsUnderWithdrawal?: number;
}

/** Single item from /farms/{id}/inventory/current */
export interface InventoryCurrentItem {
  id: string;
  farmId: string;
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  daysSupply: number | null;
  estimatedRunoutDate: string | null;
  status: "CRITICAL" | "LOW" | "ADEQUATE" | "EXCESS" | string;
  latestExpiryDate: string | null;
  minStockLevel: number;
  avgDailyConsumption: number | null;
}

/** Single item from /farms/{id}/alerts */
export interface DiseaseAlertResponse {
  id: string;
  diseaseName: string;
  severity: "critical" | "high" | "medium" | "low";
  hostType: string;
  hostTarget: string;
  recommendation?: string;
  triggeredAt: string;
  isRead: boolean;
}

/** /dairy/farms/{id}/summary */
export interface DairySummaryResponse {
  totalCows: number;
  activeCows: number;
  cowsInMilk: number;
  avgYieldPerCow: number;
  totalYesterdayLitres: number;
  cowsPregnant: number;
  healthAlertsToday: string[];
  activeMastitusCases: number;
  activeLamenessCases: number;
}

/** Single item from /farms/{id}/recommendations */
export interface RecommendationResponse {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  source: string;
  expiresAt: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED / PRESENTATION TYPES
// What the hook returns to the UI — clean, computed, ready to render.
// ─────────────────────────────────────────────────────────────────────────────

export type FarmStatusLevel = "healthy" | "warning" | "critical" | "unknown";

export interface FinancialStatus {
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  trend: "improving" | "stable" | "declining";
  statusLevel: FarmStatusLevel;
  /** Top 2 action items from the backend, empty array if none */
  actionItems: string[];
}

export interface HealthStatus {
  totalActiveIssues: number;
  critical: number;
  high: number;
  medium: number;
  treatmentCost: number;
  animalsUnderWithdrawal: number;
  statusLevel: FarmStatusLevel;
}

export interface CriticalStockItem {
  itemId: string;
  itemName: string;
  daysSupply: number;
  estimatedRunoutDate: string | null;
  status: "CRITICAL" | "LOW";
}

export interface StockStatus {
  criticalCount: number;
  lowCount: number;
  criticalItems: CriticalStockItem[];
  statusLevel: FarmStatusLevel;
}

export interface DiseaseStatus {
  totalAlerts: number;
  critical: number;
  high: number;
  /** Most severe unread alert for the banner, null if none */
  topAlert: DiseaseAlertResponse | null;
  /** ISO string of when the disease engine last ran */
  lastEvaluated: string | null;
  statusLevel: FarmStatusLevel;
}

export interface LivestockStatus {
  dairy: {
    totalCows: number;
    cowsInMilk: number;
    dailyYieldLitres: number;
    pregnantCows: number;
    healthAlerts: number;
    statusLevel: FarmStatusLevel;
  } | null;
  /** Poultry data comes from useIntegratedDashboard — not duplicated here */
  hasDairyData: boolean;
}

export interface FarmStatusRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  source: string;
}

/** The complete shape returned by useFarmStatus */
export interface FarmStatusData {
  financial: FinancialStatus | null;
  health: HealthStatus | null;
  stock: StockStatus | null;
  disease: DiseaseStatus | null;
  livestock: LivestockStatus | null;
  recommendations: FarmStatusRecommendation[];

  /**
   * Overall farm status level — the highest severity across all signals.
   * Use this to drive the alert banner and the section header badge.
   */
  overallStatus: FarmStatusLevel;

  /**
   * Timestamp of the most recently fetched signal.
   * Show this in the UI: "Last updated 09:41 AM"
   */
  lastUpdated: Date | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// Centralized for cache invalidation from other hooks/mutations.
// ─────────────────────────────────────────────────────────────────────────────

export const farmStatusKeys = {
  all:             (farmId: string) => ["farmStatus", farmId]             as const,
  financialHealth: (farmId: string) => ["farmStatus", farmId, "financial"] as const,
  healthSummary:   (farmId: string) => ["farmStatus", farmId, "health"]    as const,
  inventory:       (farmId: string) => ["farmStatus", farmId, "inventory"] as const,
  diseaseAlerts:   (farmId: string) => ["farmStatus", farmId, "disease"]   as const,
  dairy:           (farmId: string) => ["farmStatus", farmId, "dairy"]     as const,
  recommendations: (farmId: string) => ["farmStatus", farmId, "recs"]      as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Same unwrap pattern as useIntegratedDashboard — handles envelope or raw */
function unwrap<T>(response: ApiEnvelope<T> | T | null | undefined): T | null {
  if (!response) return null;
  if (typeof response === "object" && "data" in (response as object)) {
    return (response as ApiEnvelope<T>).data ?? null;
  }
  return response as T;
}

function deriveFinancialStatus(raw: FinancialHealthData): FinancialStatus {
  const score = raw.overallScore ?? 0;

  const statusLevel: FarmStatusLevel =
    raw.riskLevel === "critical" || score < 30 ? "critical"
    : raw.riskLevel === "high"   || score < 50 ? "warning"
    : "healthy";

  const trend: FinancialStatus["trend"] =
    raw.revenueTrend > 0 && raw.profitTrend > 0  ? "improving"
    : raw.revenueTrend < 0 || raw.profitTrend < 0 ? "declining"
    : "stable";

  return {
    score,
    riskLevel: raw.riskLevel,
    trend,
    statusLevel,
    actionItems: raw.actionItems?.slice(0, 2) ?? [],
  };
}

function deriveHealthStatus(raw: HealthSummaryResponse): HealthStatus {
  const { critical = 0, high = 0, medium = 0 } = raw.bySeverity ?? {};

  const statusLevel: FarmStatusLevel =
    critical > 0 ? "critical"
    : high > 0   ? "warning"
    : medium > 0 ? "warning"
    : raw.totalActive > 0 ? "warning"
    : "healthy";

  return {
    totalActiveIssues: raw.totalActive,
    critical,
    high,
    medium,
    treatmentCost: raw.totalCost ?? 0,
    animalsUnderWithdrawal: raw.animalsUnderWithdrawal ?? 0,
    statusLevel,
  };
}

function deriveStockStatus(items: InventoryCurrentItem[]): StockStatus {
  const criticalItems: CriticalStockItem[] = items
    .filter((i) => i.status === "CRITICAL" || i.status === "LOW")
    .map((i) => ({
      itemId: i.itemId,
      itemName: i.itemName,
      daysSupply: i.daysSupply ?? 0,
      estimatedRunoutDate: i.estimatedRunoutDate,
      status: i.status as "CRITICAL" | "LOW",
    }))
    // Most urgent first
    .sort((a, b) => a.daysSupply - b.daysSupply);

  const criticalCount = criticalItems.filter((i) => i.status === "CRITICAL").length;
  const lowCount      = criticalItems.filter((i) => i.status === "LOW").length;

  const statusLevel: FarmStatusLevel =
    criticalCount > 0 ? "critical"
    : lowCount > 0    ? "warning"
    : "healthy";

  return {
    criticalCount,
    lowCount,
    criticalItems,
    statusLevel,
  };
}

function deriveDiseaseStatus(alerts: DiseaseAlertResponse[]): DiseaseStatus {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const high     = alerts.filter((a) => a.severity === "high").length;

  // Pick the most severe unread alert for the top-of-screen banner
  const topAlert =
    alerts.find((a) => a.severity === "critical" && !a.isRead) ??
    alerts.find((a) => a.severity === "high"     && !a.isRead) ??
    null;

  // Disease engine runs daily at 6 AM — surface when it last ran
  const lastEvaluated =
    alerts.length > 0
      ? alerts.reduce((latest, a) =>
          a.triggeredAt > latest ? a.triggeredAt : latest,
          alerts[0].triggeredAt,
        )
      : null;

  const statusLevel: FarmStatusLevel =
    critical > 0 ? "critical"
    : high > 0   ? "warning"
    : alerts.length > 0 ? "warning"
    : "healthy";

  return {
    totalAlerts: alerts.length,
    critical,
    high,
    topAlert,
    lastEvaluated,
    statusLevel,
  };
}

function deriveLivestockStatus(dairy: DairySummaryResponse | null): LivestockStatus {
  if (!dairy) {
    return { dairy: null, hasDairyData: false };
  }

  const healthAlerts = dairy.healthAlertsToday?.length ?? 0;

  const statusLevel: FarmStatusLevel =
    dairy.activeMastitusCases > 0  ? "critical"
    : dairy.activeLamenessCases > 0 ? "warning"
    : healthAlerts > 0             ? "warning"
    : "healthy";

  return {
    dairy: {
      totalCows:        dairy.totalCows,
      cowsInMilk:       dairy.cowsInMilk,
      dailyYieldLitres: dairy.totalYesterdayLitres,
      pregnantCows:     dairy.cowsPregnant,
      healthAlerts,
      statusLevel,
    },
    hasDairyData: true,
  };
}

/**
 * Roll up all individual status levels into one overall level.
 * critical > warning > unknown > healthy
 */
function deriveOverallStatus(signals: (FarmStatusLevel | null | undefined)[]): FarmStatusLevel {
  const levels = signals.filter(Boolean) as FarmStatusLevel[];
  if (levels.includes("critical")) return "critical";
  if (levels.includes("warning"))  return "warning";
  if (levels.length === 0)         return "unknown";
  return "healthy";
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useFarmStatus(farmId: string | undefined): {
  data: FarmStatusData;
  isLoading: boolean;
  /** True if at least one query is in-flight (others may have data) */
  isPartiallyLoaded: boolean;
  /** True if every query errored — show full error state */
  isError: boolean;
  /** Per-signal errors for graceful per-card degradation */
  errors: {
    financial: Error | null;
    health: Error | null;
    stock: Error | null;
    disease: Error | null;
    dairy: Error | null;
    recommendations: Error | null;
  };
  /** Manually re-fetch all six signals */
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const enabled = !!farmId;
  const currentPeriod = new Date().toISOString().slice(0, 7);

  // Run all six queries in parallel via useQueries.
  // Each has its own cache key, TTL, and error state — they are independent.
  const results = useQueries({
    queries: [
      // 0 — Financial health
      {
        queryKey: farmStatusKeys.financialHealth(farmId ?? ""),
        queryFn: async () => {
          const env = await apiClient.get<FinancialHealthData>(
            `/finance/farms/${farmId}/health`,
          );
          return unwrap(env);
        },
        enabled,
        staleTime: 10 * 60 * 1000,
        retry: 2,
      },

      // 1 — Health summary
      {
        queryKey: farmStatusKeys.healthSummary(farmId ?? ""),
        queryFn: async () => {
          const env = await apiClient.get<HealthSummaryResponse>(
            `/farms/${farmId}/health-summary`,
          );
          return unwrap(env);
        },
        enabled,
        staleTime: 2 * 60 * 1000,
        retry: 2,
      },

      // 2 — Inventory current
      {
        queryKey: farmStatusKeys.inventory(farmId ?? ""),
        queryFn: async () => {
          const env = await apiClient.get<InventoryCurrentItem[]>(
            `/farms/${farmId}/inventory/current`,
          );
          return unwrap(env) ?? [];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        retry: 2,
      },

      // 3 — Disease alerts
      {
        queryKey: farmStatusKeys.diseaseAlerts(farmId ?? ""),
        queryFn: async () => {
          const env = await apiClient.get<DiseaseAlertResponse[]>(
            `/farms/${farmId}/alerts`,
          );
          return unwrap(env) ?? [];
        },
        enabled,
        staleTime: 10 * 60 * 1000, // Disease engine runs daily @ 6 AM — staleness is by design
        retry: 2,
      },

      // 4 — Dairy summary
      {
        queryKey: farmStatusKeys.dairy(farmId ?? ""),
        queryFn: async () => {
          const env = await apiClient.get<DairySummaryResponse>(
            `/dairy/farms/${farmId}/summary`,
          );
          return unwrap(env);
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        retry: 2,
      },

      // 5 — Recommendations (top 5, unread first)
      {
        queryKey: farmStatusKeys.recommendations(farmId ?? ""),
        queryFn: async () => {
          const env = await apiClient.get<RecommendationResponse[]>(
            `/farms/${farmId}/recommendations?limit=5&sort=priority`,
          );
          return unwrap(env) ?? [];
        },
        enabled,
        staleTime: 10 * 60 * 1000,
        retry: 2,
      },
    ],
  });

  const [
    financialQuery,
    healthQuery,
    inventoryQuery,
    diseaseQuery,
    dairyQuery,
    recsQuery,
  ] = results;

  // Derive presentation-layer data from raw responses
  const data = useMemo<FarmStatusData>(() => {
    const financial = financialQuery.data
      ? deriveFinancialStatus(financialQuery.data)
      : null;

    const health = healthQuery.data
      ? deriveHealthStatus(healthQuery.data)
      : null;

    const stock = inventoryQuery.data
      ? deriveStockStatus(inventoryQuery.data)
      : null;

    const disease = diseaseQuery.data
      ? deriveDiseaseStatus(diseaseQuery.data)
      : null;

    const livestock = deriveLivestockStatus(dairyQuery.data ?? null);

    const recommendations: FarmStatusRecommendation[] = (
      recsQuery.data ?? []
    ).map((r) => ({
      id:       r.id,
      priority: r.priority,
      title:    r.title,
      source:   r.source,
    }));

    const overallStatus = deriveOverallStatus([
      financial?.statusLevel,
      health?.statusLevel,
      stock?.statusLevel,
      disease?.statusLevel,
      livestock.dairy?.statusLevel,
    ]);

    // The most recent fetch timestamp across all successful queries
    const fetchedAts = results
      .map((q) => q.dataUpdatedAt)
      .filter((t) => t > 0);

    const lastUpdated =
      fetchedAts.length > 0
        ? new Date(Math.max(...fetchedAts))
        : null;

    return {
      financial,
      health,
      stock,
      disease,
      livestock,
      recommendations,
      overallStatus,
      lastUpdated,
    };
  }, [
    financialQuery.data,
    healthQuery.data,
    inventoryQuery.data,
    diseaseQuery.data,
    dairyQuery.data,
    recsQuery.data,
    results,
  ]);

  // isLoading: true only on first load when there's no cached data yet
  const isLoading = results.every((q) => q.isLoading);

  // isPartiallyLoaded: at least one query is still fetching, but others have data
  const isPartiallyLoaded = !isLoading && results.some((q) => q.isFetching);

  // isError: every single query failed — show full error state
  const isError = results.every((q) => q.isError);

  const errors = {
    financial:       (financialQuery.error as Error | null) ?? null,
    health:          (healthQuery.error   as Error | null) ?? null,
    stock:           (inventoryQuery.error as Error | null) ?? null,
    disease:         (diseaseQuery.error  as Error | null) ?? null,
    dairy:           (dairyQuery.error    as Error | null) ?? null,
    recommendations: (recsQuery.error     as Error | null) ?? null,
  };

  const refetch = () => {
    results.forEach((q) => q.refetch());
  };

  return { data, isLoading, isPartiallyLoaded, isError, errors, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// INVALIDATION HELPERS
// Call these from mutations to immediately reflect changes in Farm Status.
//
// Usage:
//   const queryClient = useQueryClient()
//   await mutation()
//   invalidateFarmStatusHealth(queryClient, farmId)
// ─────────────────────────────────────────────────────────────────────────────

export function invalidateFarmStatusHealth(
  queryClient: ReturnType<typeof useQueryClient>,
  farmId: string,
) {
  queryClient.invalidateQueries({ queryKey: farmStatusKeys.healthSummary(farmId) });
}

export function invalidateFarmStatusStock(
  queryClient: ReturnType<typeof useQueryClient>,
  farmId: string,
) {
  queryClient.invalidateQueries({ queryKey: farmStatusKeys.inventory(farmId) });
}

export function invalidateFarmStatusAll(
  queryClient: ReturnType<typeof useQueryClient>,
  farmId: string,
) {
  queryClient.invalidateQueries({ queryKey: farmStatusKeys.all(farmId) });
}