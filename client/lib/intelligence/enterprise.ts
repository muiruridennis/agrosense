import { ModuleRiskAssessment } from "@/types/enterprise";

export type HealthSeverity = "low" | "medium" | "high" | "critical";
export type OperationalStatus = "healthy" | "warning" | "critical";

export interface FlockSummaryDetail {
  id: string;
  breed: string;
  type: string;
  currentStage: string;
  status: string;
  initialCount: number;
  currentCount: number;
  revenueTotal: number;
  feedCostTotal: number;
  netProfit: number;
  roiPercent: number;
  biology?: {
    mortalityRate: number;
    healthRiskScore: number;
  };
  production?: {
    avgProductionRate: number | null;
    status: string;
  } | null;
  forecast?: {
    projectedMortality: number;
    projectedFeedCost: number;
  };
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

export interface FinanceSummaryData {
  period: string;
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  accountsPayable: number;
  accountsReceivable: number;
  cashInflow?: number;
  cashOutflow?: number;
  netCashFlow?: number;
  poultryCount?: number | null;
  dairyCowCount?: number | null;
  smallRuminantCount?: number | null;
}

export interface FinanceComparisonData {
  currentMonth: FinanceSummaryData;
  previousMonth: FinanceSummaryData;
  yearToDate?: FinanceSummaryData;
  costsTrend: number;
  revenueTrend: number;
  profitTrend: number;
  insights: string[];
}

export interface DairySummaryData {
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

export interface DiseaseAlertEntity {
  id: string;
  diseaseName: string;
  severity: HealthSeverity;
  hostType: string;
  hostTarget: string;
  triggeredAt: string | Date;
  isRead: boolean;
  message?: string;
}

export interface BusinessImpact {
  projectedRevenueChange: number;
  projectedMarginChange: number;
  criticalPathItems: string[];
}

export function unwrapApiResponse<T>(response: any): T {
  if (response && typeof response === "object" && "data" in response) {
    return response.data as T;
  }
  return response as T;
}

export function clampStatusValue(value: number): OperationalStatus {
  if (value >= 0.7) return "critical";
  if (value >= 0.35) return "warning";
  return "healthy";
}

export function deriveMetricStatus(current: number, target: number) {
  if (target <= 0) return "red";
  const ratio = current / target;
  if (ratio >= 1) return "green";
  if (ratio >= 0.75) return "amber";
  return "red";
}

export function safePercentChange(current: number, previous: number) {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous === 0
  ) {
    return 0;
  }
  return (current - previous) / Math.abs(previous);
}

export function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function getOperationalStatusFromFactors(
  healthRiskScore: number,
  criticalAlerts: number,
  warningAlerts: number,
): OperationalStatus {
  if (criticalAlerts > 0 || healthRiskScore >= 60) return "critical";
  if (warningAlerts > 0 || healthRiskScore >= 35) return "warning";
  return "healthy";
}

export function buildPoultryModule(
  flockSummaries: FlockSummaryDetail[],
  diseaseAlerts: DiseaseAlertEntity[],
  totalRevenue: number,
): ModuleRiskAssessment {
  const poultryAlerts = diseaseAlerts.filter(
    (alert) => alert.hostType === "poultry",
  );
  const highAlerts = poultryAlerts.filter(
    (alert) => alert.severity === "high" || alert.severity === "critical",
  ).length;

  const revenue = flockSummaries.reduce(
    (sum, flock) => sum + (flock.revenueTotal || 0),
    0,
  );

  const avgMortality = average(
    flockSummaries.map((flock) => flock.biology?.mortalityRate ?? 0),
  );
  const avgHealthRisk = average(
    flockSummaries.map((flock) => flock.biology?.healthRiskScore ?? 0),
  );
  const avgProductionRate = average(
    flockSummaries
      .map((flock) => flock.production?.avgProductionRate ?? 0)
      .filter((value) => value > 0),
  );
  const avgFeedCost = average(
    flockSummaries.map((flock) => flock.finance?.feedCostPerBirdPerDay ?? 0),
  );

  const revenueContribution = totalRevenue > 0 ? revenue / totalRevenue : 0;
  const revenueTarget =
    revenueContribution > 0
      ? revenue / (1 + Math.max(0, avgHealthRisk / 100))
      : 0;
  const revenueVariance = safePercentChange(revenue, revenueTarget);

  const issueCount = poultryAlerts.length + flockSummaries.length * 0;
  const operationalStatus = getOperationalStatusFromFactors(
    avgHealthRisk,
    highAlerts,
    poultryAlerts.length - highAlerts,
  );

  const riskFactors: ModuleRiskAssessment["riskFactors"] = [];
  if (avgHealthRisk >= 50) {
    riskFactors.push({
      factor: "poultry_health_risk",
      severity: "high",
      impact: `Average flock health risk is ${avgHealthRisk.toFixed(0)}%. Immediate review required`,
      action: "Review flock health events and initiate treatment",
    });
  }
  if (avgMortality >= 4) {
    riskFactors.push({
      factor: "mortality_rate",
      severity: "high",
      impact: `Mortality rate is ${avgMortality.toFixed(1)}% across active flocks`,
      action: "Inspect housing and isolate affected batches",
    });
  }
  if (avgProductionRate > 0 && avgProductionRate < 75) {
    riskFactors.push({
      factor: "declining_production",
      severity: "medium",
      impact: `Average production rate is ${avgProductionRate.toFixed(1)}%, below target`,
      action: "Review feeding and egg collection schedules",
    });
  }
  if (avgFeedCost > 0 && avgFeedCost > 2.5) {
    riskFactors.push({
      factor: "feed_cost_pressure",
      severity: "medium",
      impact: `Feed cost per bird is ${avgFeedCost.toFixed(2)}; verify ration efficiency`,
      action: "Compare batch feed costs and optimize rations",
    });
  }
  if (highAlerts > 0) {
    riskFactors.push({
      factor: "disease_alerts",
      severity: "high",
      impact: `${highAlerts} poultry disease alerts need investigation`,
      action: "Open the disease alert dashboard and resolve issues",
    });
  }
  if (riskFactors.length === 0) {
    riskFactors.push({
      factor: "stable_operations",
      severity: "low",
      impact: "Poultry operations are currently stable",
      action: "Continue monitoring daily records",
    });
  }

  const keyMetrics = [
    {
      name: "Total Flocks",
      current: flockSummaries.length,
      target: flockSummaries.length || 1,
      unit: "count",
      status: "green",
    },
    {
      name: "Average Mortality",
      current: parseFloat(avgMortality.toFixed(1)),
      target: 3,
      unit: "%",
      status:
        deriveMetricStatus(3 - avgMortality, 3) === "green"
          ? "green"
          : avgMortality <= 4
            ? "amber"
            : "red",
    },
    {
      name: "Health Risk",
      current: parseFloat(avgHealthRisk.toFixed(0)),
      target: 30,
      unit: "%",
      status:
        avgHealthRisk <= 30 ? "green" : avgHealthRisk <= 55 ? "amber" : "red",
    },
    {
      name: "Feed cost/bird/day",
      current: parseFloat(avgFeedCost.toFixed(2)),
      target: 2.5,
      unit: "KES",
      status:
        avgFeedCost <= 2.5 ? "green" : avgFeedCost <= 3.5 ? "amber" : "red",
    },
  ];

  const recentIncidents = poultryAlerts.slice(0, 3).map((alert) => ({
    time:
      typeof alert.triggeredAt === "string"
        ? alert.triggeredAt
        : alert.triggeredAt?.toISOString() || "Unknown",
    description: alert.message || alert.diseaseName,
  }));

  return {
    key: "poultry",
    revenueContribution,
    revenueMonth: revenue,
    revenueTarget,
    revenueVariance,
    operationalStatus,
    riskFactors,
    keyMetrics,
    activeAlerts: poultryAlerts.length,
    recentIncidents,
  };
}

export function buildInventoryModule(
  stockItems: InventoryCurrentItem[],
  inventoryAlerts: { severity: string; message: string; itemName: string }[],
): ModuleRiskAssessment {
  const criticalStock = stockItems.filter(
    (item) => item.status === "critical",
  ).length;
  const lowStock = stockItems.filter(
    (item) =>
      item.status === "low" ||
      item.status === "low_stock" ||
      (item.daysSupply !== null && item.daysSupply <= item.minStockLevel),
  ).length;
  const expiryRisk = stockItems.filter((item) => {
    if (!item.latestExpiryDate) return false;
    const expiry = new Date(item.latestExpiryDate).getTime();
    const diffDays = (expiry - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
  }).length;
  const avgDaysSupply = average(
    stockItems.map((item) => item.daysSupply ?? 0).filter((value) => value > 0),
  );

  const revenueContribution = 0;
  const revenueMonth = 0;
  const revenueTarget = 0;
  const revenueVariance = 0;

  const operationalStatus =
    criticalStock > 0 || expiryRisk > 0
      ? "critical"
      : lowStock > 0
        ? "warning"
        : "healthy";

  const riskFactors: ModuleRiskAssessment["riskFactors"] = [];
  if (criticalStock > 0) {
    riskFactors.push({
      factor: "critical_stock",
      severity: "high",
      impact: `${criticalStock} items are in critical stock status`,
      action: "Replenish critical items immediately",
    });
  }
  if (lowStock > 0) {
    riskFactors.push({
      factor: "low_stock",
      severity: "medium",
      impact: `${lowStock} items are below safe inventory levels`,
      action: "Create purchase orders for low items",
    });
  }
  if (expiryRisk > 0) {
    riskFactors.push({
      factor: "expiry_risk",
      severity: "medium",
      impact: `${expiryRisk} items are expiring within 14 days`,
      action: "Use or replace expiring inventory",
    });
  }
  if (inventoryAlerts.length > 0) {
    riskFactors.push({
      factor: "inventory_alerts",
      severity: inventoryAlerts.some((alert) => alert.severity === "critical")
        ? "high"
        : "medium",
      impact: `${inventoryAlerts.length} active inventory alerts need review`,
      action: "Resolve inventory alerts and check reorder points",
    });
  }
  if (riskFactors.length === 0) {
    riskFactors.push({
      factor: "inventory_stable",
      severity: "low",
      impact: "Inventory levels are within safe thresholds",
      action: "Continue monitoring stock and expiry dates",
    });
  }

  const keyMetrics = [
    {
      name: "Critical stock",
      current: criticalStock,
      target: 0,
      unit: "items",
      status: criticalStock > 0 ? "red" : "green",
    },
    {
      name: "Low stock",
      current: lowStock,
      target: 0,
      unit: "items",
      status: lowStock > 0 ? "amber" : "green",
    },
    {
      name: "Avg days supply",
      current: parseFloat(avgDaysSupply.toFixed(1)),
      target:
        stockItems.length > 0
          ? average(stockItems.map((item) => item.optimalStockDays))
          : 0,
      unit: "days",
      status:
        avgDaysSupply >=
        average(stockItems.map((item) => item.optimalStockDays))
          ? "green"
          : avgDaysSupply > 0
            ? "amber"
            : "red",
    },
    {
      name: "Expiry risk",
      current: expiryRisk,
      target: 0,
      unit: "items",
      status: expiryRisk > 0 ? "red" : "green",
    },
  ];

  const recentIncidents = inventoryAlerts.slice(0, 3).map((alert) => ({
    time: new Date().toISOString(),
    description: `${alert.itemName}: ${alert.message}`,
  }));

  return {
    key: "inventory",
    revenueContribution,
    revenueMonth,
    revenueTarget,
    revenueVariance,
    operationalStatus,
    riskFactors,
    keyMetrics,
    activeAlerts: inventoryAlerts.length,
    recentIncidents,
  };
}

export function buildFinanceModule(
  finance: FinanceSummaryData,
  comparison: FinanceComparisonData | null,
): ModuleRiskAssessment {
  const revenueTrend = comparison?.revenueTrend ?? 0;
  const profitTrend = comparison?.profitTrend ?? 0;
  const costTrend = comparison?.costsTrend ?? 0;
  const payableRatio =
    finance.totalRevenue > 0
      ? finance.accountsPayable / finance.totalRevenue
      : 0;

  const operationalStatus =
    finance.profitMargin < 10 || revenueTrend < -10 || payableRatio > 0.25
      ? "critical"
      : finance.profitMargin < 18 || revenueTrend < 0 || costTrend > 10
        ? "warning"
        : "healthy";

  const riskFactors: ModuleRiskAssessment["riskFactors"] = [];
  if (revenueTrend < 0) {
    riskFactors.push({
      factor: "revenue_decline",
      severity: "high",
      impact: `Revenue is down ${Math.abs(revenueTrend).toFixed(1)}% from last period`,
      action: "Review sales and pricing strategy",
    });
  }
  const profitMarginValue = (() => {
    const value = Number(finance.profitMargin);
    return Number.isFinite(value) ? value : 0;
  })();

  if (profitTrend < 0 || profitMarginValue < 12) {
    riskFactors.push({
      factor: "margin_pressure",
      severity: "high",
      impact: `Profit margin is ${profitMarginValue.toFixed(1)}%`,
      action: "Revisit cost centers and reduce wastage",
    });
  }
  if (payableRatio > 0.25) {
    riskFactors.push({
      factor: "cash_flow_risk",
      severity: "medium",
      impact: `Payables are ${Math.round(payableRatio * 100)}% of monthly revenue`,
      action: "Prioritize payments and improve cash collections",
    });
  }
  if (costTrend > 10) {
    riskFactors.push({
      factor: "rising_costs",
      severity: "medium",
      impact: `Costs increased ${costTrend.toFixed(1)}% compared to previous period`,
      action: "Investigate major cost drivers",
    });
  }
  if (riskFactors.length === 0) {
    riskFactors.push({
      factor: "financial_stability",
      severity: "low",
      impact: "Financials are stable with manageable cost and revenue trends",
      action: "Continue monitoring cashflow and margins",
    });
  }

  const keyMetrics = [
    {
      name: "Profit margin",
      current: parseFloat(profitMarginValue.toFixed(1)),
      target: 20,
      unit: "%",
      status:
        profitMarginValue >= 20
          ? "green"
          : profitMarginValue >= 12
            ? "amber"
            : "red",
    },
    {
      name: "Revenue trend",
      current: parseFloat(revenueTrend.toFixed(1)),
      target: 0,
      unit: "%",
      status:
        revenueTrend >= 0 ? "green" : revenueTrend >= -10 ? "amber" : "red",
    },
    {
      name: "Cost trend",
      current: parseFloat(costTrend.toFixed(1)),
      target: 0,
      unit: "%",
      status: costTrend <= 0 ? "green" : costTrend <= 10 ? "amber" : "red",
    },
    {
      name: "Payables ratio",
      current: parseFloat((payableRatio * 100).toFixed(1)),
      target: 25,
      unit: "%",
      status:
        payableRatio <= 0.25 ? "green" : payableRatio <= 0.4 ? "amber" : "red",
    },
  ];

  const recentIncidents = (comparison?.insights ?? [])
    .slice(0, 3)
    .map((insight) => ({
      time: new Date().toISOString(),
      description: insight,
    }));

  return {
    key: "finance",
    revenueContribution: 0,
    revenueMonth: finance.totalRevenue,
    revenueTarget:
      comparison?.previousMonth.totalRevenue ?? finance.totalRevenue,
    revenueVariance: safePercentChange(
      finance.totalRevenue,
      comparison?.previousMonth.totalRevenue ?? finance.totalRevenue,
    ),
    operationalStatus,
    riskFactors,
    keyMetrics,
    activeAlerts: riskFactors.filter((item) => item.severity !== "low").length,
    recentIncidents,
  };
}

export function buildDairyModule(
  dairy: DairySummaryData | null,
  diseaseAlerts: DiseaseAlertEntity[],
): ModuleRiskAssessment {
  const dairyAlerts = diseaseAlerts.filter(
    (alert) => alert.hostType === "dairy",
  );
  const avgYield = dairy?.avgYieldPerCow ?? 0;
  const yieldStatus =
    avgYield >= 14 ? "healthy" : avgYield >= 10 ? "warning" : "critical";

  const operationalStatus =
    dairyAlerts.length > 0 || yieldStatus === "critical"
      ? "critical"
      : yieldStatus === "warning"
        ? "warning"
        : "healthy";

  const riskFactors: ModuleRiskAssessment["riskFactors"] = [];
  if (dairyAlerts.length > 0) {
    riskFactors.push({
      factor: "dairy_health_alerts",
      severity: "high",
      impact: `${dairyAlerts.length} unresolved dairy alerts`,
      action: "Review dairy alerts and treat affected animals",
    });
  }
  if (avgYield > 0 && avgYield < 10) {
    riskFactors.push({
      factor: "low_yield",
      severity: "medium",
      impact: `Average milk yield is ${avgYield.toFixed(1)} L/cow`,
      action: "Investigate nutrition and milking frequency",
    });
  }
  if ((dairy?.activeMastitusCases ?? 0) > 0) {
    riskFactors.push({
      factor: "mastitis_cases",
      severity: "high",
      impact: `${dairy?.activeMastitusCases} mastitis cases active`,
      action: "Treat infected cows and monitor hygiene",
    });
  }
  if (riskFactors.length === 0) {
    riskFactors.push({
      factor: "dairy_stable",
      severity: "low",
      impact: "Dairy herd is stable and production is normal",
      action: "Keep monitoring herd health",
    });
  }

  return {
    key: "dairy",
    revenueContribution: 0,
    revenueMonth: 0,
    revenueTarget: 0,
    revenueVariance: 0,
    operationalStatus,
    riskFactors,
    keyMetrics: [
      {
        name: "Active cows",
        current: dairy?.activeCows ?? 0,
        target: dairy?.totalCows ?? 1,
        unit: "count",
        status: dairy?.activeCows === dairy?.totalCows ? "green" : "amber",
      },
      {
        name: "Avg yield",
        current: parseFloat(avgYield.toFixed(1)),
        target: 14,
        unit: "L/cow",
        status:
          yieldStatus === "healthy"
            ? "green"
            : yieldStatus === "warning"
              ? "amber"
              : "red",
      },
      {
        name: "Pregnancies",
        current: dairy?.cowsPregnant ?? 0,
        target: Math.max(1, dairy?.totalCows ?? 1),
        unit: "count",
        status: "green",
      },
      {
        name: "Health issues",
        current: dairyAlerts.length,
        target: 0,
        unit: "alerts",
        status:
          dairyAlerts.length === 0
            ? "green"
            : dairyAlerts.length <= 2
              ? "amber"
              : "red",
      },
    ],
    activeAlerts: dairyAlerts.length,
    recentIncidents: dairyAlerts.slice(0, 3).map((alert) => ({
      time:
        typeof alert.triggeredAt === "string"
          ? alert.triggeredAt
          : alert.triggeredAt?.toISOString() || "Unknown",
      description: alert.message || alert.diseaseName,
    })),
  };
}

export function buildCropsModule(
  crops: CropSummaryRow[],
  diseaseAlerts: DiseaseAlertEntity[],
): ModuleRiskAssessment {
  const cropAlerts = diseaseAlerts.filter((alert) => alert.hostType === "crop");
  const totalCycles = crops.reduce((sum, row) => sum + (row.count || 0), 0);
  const totalYield = crops.reduce(
    (sum, row) => sum + (row.totalYieldKg || 0),
    0,
  );
  const avgYield = totalCycles > 0 ? totalYield / totalCycles : 0;

  const operationalStatus =
    cropAlerts.length > 0 || totalCycles === 0 ? "warning" : "healthy";
  const riskFactors: ModuleRiskAssessment["riskFactors"] = [];
  if (cropAlerts.length > 0) {
    riskFactors.push({
      factor: "crop_disease_alerts",
      severity: "high",
      impact: `${cropAlerts.length} crop alerts are active`,
      action: "Review crop alerts and implement protection measures",
    });
  }
  if (avgYield > 0 && avgYield < 200) {
    riskFactors.push({
      factor: "low_crop_yield",
      severity: "medium",
      impact: `Average cycle yield is ${avgYield.toFixed(1)} kg`,
      action: "Check crop nutrition and irrigation schedules",
    });
  }
  if (totalCycles === 0) {
    riskFactors.push({
      factor: "inactive_cropping",
      severity: "medium",
      impact: "No active crop cycles detected",
      action: "Plan next planting window",
    });
  }
  if (riskFactors.length === 0) {
    riskFactors.push({
      factor: "crop_stable",
      severity: "low",
      impact: "Crop operations are currently stable",
      action: "Maintain current crop management plans",
    });
  }

  return {
    key: "crops",
    revenueContribution: 0,
    revenueMonth: 0,
    revenueTarget: 0,
    revenueVariance: 0,
    operationalStatus,
    riskFactors,
    keyMetrics: [
      {
        name: "Active cycles",
        current: totalCycles,
        target: 1,
        unit: "count",
        status: totalCycles > 0 ? "green" : "red",
      },
      {
        name: "Avg yield",
        current: parseFloat(avgYield.toFixed(1)),
        target: 250,
        unit: "kg",
        status: avgYield >= 250 ? "green" : avgYield >= 150 ? "amber" : "red",
      },
      {
        name: "Total yield",
        current: totalYield,
        target: totalYield || 1,
        unit: "kg",
        status: "green",
      },
      {
        name: "Crop alerts",
        current: cropAlerts.length,
        target: 0,
        unit: "alerts",
        status: cropAlerts.length === 0 ? "green" : "red",
      },
    ],
    activeAlerts: cropAlerts.length,
    recentIncidents: cropAlerts.slice(0, 3).map((alert) => ({
      time:
        typeof alert.triggeredAt === "string"
          ? alert.triggeredAt
          : alert.triggeredAt?.toISOString() || "Unknown",
      description: alert.message || alert.diseaseName,
    })),
  };
}

export function buildBusinessImpact(
  finance: FinanceSummaryData,
  comparison: FinanceComparisonData | null,
  modules: ModuleRiskAssessment[],
): BusinessImpact {
  const projectedRevenueChange = comparison ? comparison.revenueTrend / 100 : 0;
  const projectedMarginChange = comparison
    ? safePercentChange(
        finance.profitMargin,
        comparison.previousMonth.profitMargin,
      )
    : 0;

  const criticalItems = modules
    .filter((module) => module.operationalStatus !== "healthy")
    .map((module) => {
      switch (module.key) {
        case "poultry":
          return "Poultry health and production";
        case "inventory":
          return "Inventory replenishment";
        case "finance":
          return "Profitability and cashflow";
        case "dairy":
          return "Dairy health and yield";
        case "crops":
          return "Crop protection and yield";
        default:
          return module.key;
      }
    });

  return {
    projectedRevenueChange,
    projectedMarginChange,
    criticalPathItems: Array.from(new Set(criticalItems)).slice(0, 3),
  };
}
