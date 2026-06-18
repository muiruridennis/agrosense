
export interface PoultryHouse {
  id: string;
  name: string;
  houseType: "open_sided" | "closed" | "free_range";
  capacity: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  farmId: string;
  flocks?: Flock[];
}

export interface Flock {
  id: string;
  houseId: string;
  type: "layers" | "broilers" | "kienyeji" | "unknown";
  status: "active" | "closed" | "planned";
  currentStage: "placed" | "brooding" | "growing" | "production" | "harvested";
  breed: string;
  initialCount: number;
  currentCount: number;
  placementDate: string;
  ageAtPlacementWeeks: number;
  targetWeightKg?: number;
  targetDays?: number;
  productionStartWeek?: number;
  expectedMortalityPercent?: number;
  expectedDailyFeedPerBirdGrams?: number;
  breakEvenTarget?: number;
  feedCostTotal: number;
  revenueTotal: number;
  netProfit: number;
  roiPercent: number;
  closedAt?: string;
  depletionReason?: string;
  notes?: string;
  sales?: Array<{
    buyer: string;
    quantity: number;
    saleDate: string;
    totalAmount: number;
    pricePerBird: number;
    paymentStatus: string;
    receiptNumber: string;
  }>;
}

export interface CreateHouseInput {
  name: string;
  houseType: string;
  capacity: number;
  notes?: string;
}

export interface CreateFlockInput {
  breed: string;
  type: "layers" | "broilers";
  initialCount: number;
  placementDate: string;
  ageAtPlacementWeeks: number;
  productionStartWeek?: number;
  notes?: string;
}

export interface FlockRecord {
  id: string;
  flockId: string;
  recordDate: string;
  mortalityCount?: number;
  feedConsumption?: number;
  eggProduction?: number;
  avgWeight?: number;
  notes?: string;
}
// app/dashboard/farms/[farmId]/poultry/types/index.ts

export interface FlockSummary {
  flock: {
    id: string;
    breed: string;
    type: string;
    stage: string;
    status: string;
    ageInDays: number;
    placementDate: string;
    initialCount: number;
    currentCount: number;
    survivedCount: number;
  };
  biology: {
    totalMortality: number;
    mortalityRate: number;
    healthRiskScore: number;
    sickBirdsLast7Days: number;
  };
  production: {
    avgProductionRate: number;
    totalEggsLast7Days: number;
    status: 'OPTIMAL' | 'DECLINING';
  } | null;
  finance: {
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    roi: number;
    feedCostPerBirdPerDay: string;
  };
  operations: {
    pendingRecordReviews: number;
    recordsSubmittedLast7Days: number;
    avgFeedPerDay: string;
  };
  forecast: {
    ageInDays: number;
    projectedDaysToHarvest: number;
    projectedFeedCost: number;
    projectedMortality: number;
    projectedRemainingBirds: number;
  };
  summary: {
    healthStatus: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
    profitabilityStatus: 'PROFITABLE' | 'UNPROFITABLE';
    actionRequired: boolean;
  };
}

export interface FlockPerformance {
  flock: {
    breed: string;
    type: string;
  };
  mortality: {
    actual: number;
    expected: number;
    status: 'GOOD' | 'POOR';
  };
  production: {
    actual: number;
    status: 'GOOD' | 'POOR';
  } | null;
  fcr: {
    actual: number;
    status: 'GOOD' | 'POOR';
  } | null;
}

export interface FlockForecast {
  ageInDays: number;
  projectedDaysToHarvest: number;
  projectedFeedCost: number;
  projectedMortality: number;
  projectedRemainingBirds: number;
  message?: string;
}