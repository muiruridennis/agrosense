import {
  useActiveFlocks,
  useInventoryCurrent,
  useInventorySummary,
  useStockAlerts,
  useFinanceSummary,
  useFinancialComparison,
  useDairySummary,
  useCropSummary,
  useFarmAlerts,
} from "./useIntegratedDashboard";
import {
  buildPoultryModule,
  buildInventoryModule,
  buildFinanceModule,
  buildDairyModule,
  buildCropsModule,
  buildBusinessImpact,
} from "../intelligence/enterprise";

export function useEnterpriseRiskAssessment(farmId: string | undefined) {
  const { data: flocks = [], isLoading: flocksLoading } =
    useActiveFlocks(farmId);

  const { data: stockItems = [], isLoading: stockLoading } =
    useInventoryCurrent(farmId);
  const { data: inventorySummary, isLoading: invSummaryLoading } =
    useInventorySummary(farmId);
  const { data: inventoryAlerts = [], isLoading: invAlertsLoading } =
    useStockAlerts(farmId);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const prev = new Date();
  prev.setMonth(prev.getMonth() - 1);
  const previousPeriod = prev.toISOString().slice(0, 7);

  const { data: finance, isLoading: financeLoading } = useFinanceSummary(
    farmId,
    currentPeriod,
  );
  const { data: financeComparison, isLoading: financeCompLoading } =
    useFinancialComparison(farmId, currentPeriod, previousPeriod);

  const { data: dairy = null, isLoading: dairyLoading } =
    useDairySummary(farmId);
  const { data: crops = [], isLoading: cropsLoading } = useCropSummary(farmId);

  const { data: diseaseAlerts = [], isLoading: alertsLoading } =
    useFarmAlerts(farmId);

  // Map incoming flock shape to the intelligence utility shape (best-effort)
  const flocksAny = flocks as any[];
  const stockItemsAny = stockItems as any[];
  const inventoryAlertsAny = inventoryAlerts as any[];
  const diseaseAlertsAny = diseaseAlerts as any[];
  const financeAny = finance as any;
  const dairyAny = dairy as any;
  const cropsAny = crops as any[];

  const flockDetails = (flocksAny || []).map((f: any) => ({
    id: f.id,
    breed: f.breed,
    type: f.type,
    currentStage: f.currentStage,
    status: f.status,
    initialCount: f.initialCount ?? 0,
    currentCount: f.currentCount ?? 0,
    revenueTotal: f.revenueTotal ?? 0,
    feedCostTotal: f.feedCostTotal ?? 0,
    netProfit: f.netProfit ?? 0,
    roiPercent: f.roiPercent ?? 0,
    biology: {
      mortalityRate: f.mortalityRate ?? f.mortality ?? 0,
      healthRiskScore: f.healthRiskScore ?? 0,
    },
    production: {
      avgProductionRate: f.avgProductionRate ?? null,
      status: f.productionStatus ?? "unknown",
    },
  }));

  const invAlertsMapped = (inventoryAlertsAny || []).map((a: any) => ({
    severity: a.severity ?? "warning",
    message: a.message ?? a.details ?? "",
    itemName: a.itemName ?? a.itemId ?? "unknown",
  }));

  const poultryModule = buildPoultryModule(
    flockDetails,
    diseaseAlertsAny || [],
    financeAny?.totalRevenue ?? (0 as number),
  );
  const inventoryModule = buildInventoryModule(
    stockItemsAny || [],
    invAlertsMapped,
  );
  const financeModule = financeAny
    ? buildFinanceModule(financeAny, (financeComparison as any) ?? null)
    : null;
  const dairyModule = buildDairyModule(
    dairyAny ?? null,
    diseaseAlertsAny || [],
  );
  const cropsModule = buildCropsModule(cropsAny || [], diseaseAlertsAny || []);

  const modules = [poultryModule, dairyModule, cropsModule, inventoryModule];
  if (financeModule) modules.push(financeModule);

  const businessImpact = financeAny
    ? buildBusinessImpact(
        financeAny,
        (financeComparison as any) ?? null,
        modules as any,
      )
    : {
        projectedRevenueChange: 0,
        projectedMarginChange: 0,
        criticalPathItems: [],
      };

  const isLoading = [
    flocksLoading,
    stockLoading,
    invSummaryLoading,
    invAlertsLoading,
    financeLoading,
    financeCompLoading,
    dairyLoading,
    cropsLoading,
    alertsLoading,
  ].some(Boolean);

  return {
    modules,
    businessImpact,
    isLoading,
  };
}
