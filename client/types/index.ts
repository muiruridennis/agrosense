export interface User {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  role: "farmer" | "agronomist" | "admin";
  isPhoneVerified: boolean;
  preferredLanguage: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface RegisterData {
  fullName: string;
  phoneNumber: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: User;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  activeAlerts: number;
  incomeChange: number;
  expensesChange: number;
}

export interface RecentActivity {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: "income" | "expense";
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
}
export interface FarmSummary {
  id: string;

  createdAt: string;
  updatedAt: string;

  name: string;
  description: string;

  areaHectares: number;

  country: string;
  region: string;
  subRegion: string;

  geoPoint: {
    type: "Point";
    coordinates: [number, number];
  };

  boundary: null | Record<string, unknown>;

  timezone: string;

  ownerId: string;

  plots: unknown[];
  animals: unknown[];
}

export interface KpiCard {
  label: string;
  value: string | number;
  subLabel: string;
  trend?: { value: number; positive: boolean };
  domain?: "crop" | "livestock" | "ledger" | "advisory";
}

export interface DiseaseAlertItem {
  id: string;
  diseaseName: string;
  hostType: "crop" | "livestock";
  hostTarget: string;
  severity: "low" | "medium" | "high" | "critical";
  triggeredAt: string;
  isRead: boolean;
}

export interface RecommendationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  expiresAt: string;
}

export interface RecentRecord {
  id: string;
  recordType: string;
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  recordedAt: string;
}

export type RecordType =
  | "expense"
  | "income"
  | "treatment"
  | "feed"
  | "harvest"
  | "labor"
  | "equipment";

export type RecordCategory =
  | "seed"
  | "fertilizer"
  | "pesticide"
  | "irrigation"
  | "veterinary"
  | "animal_feed"
  | "transport"
  | "storage"
  | "labor"
  | "equipment"
  | "other_expense"
  | "crop_sale"
  | "livestock_sale"
  | "dairy"
  | "eggs"
  | "other_income";

export interface FarmRecord {
  id: string;
  recordType: RecordType;
  category: RecordCategory;
  amount: number;
  currency: string;
  recordedAt: string;
  description: string | null;
  cropCycleId: string | null;
  animalId: string | null;
  metadata: Record<string, unknown> | null;
  clientId: string | null;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface CreateRecordInput {
  recordType: RecordType;
  category: RecordCategory;
  amount: number;
  currency?: string;
  recordedAt: string;
  description?: string;
  cropCycleId?: string;
  animalId?: string;
  metadata?: Record<string, unknown>;
  clientId?: string;
}

export type UpdateRecordInput = Partial<CreateRecordInput>;

export interface WeatherDay {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  humidity: number;
  weatherCode: number;
}

export interface WeatherData {
  current: {
    temperatureMean: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
  };
  daily: WeatherDay[];
}
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface FarmBoundary {
  type: string;
  coordinates: number[][][];
}
export interface FarmMember {
  id: string;

  userId: string;
  farmId: string;

  role: FarmMemberRole;

  assignedHouseIds: string[] | null;

  isActive: boolean;

  joinedAt: string;

  createdBy: string;
  updatedBy: string | null;

  removedAt: string | null;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface Cow {
  id: string;

  farmId: string;

  tagId: string;

  name: string | null;

  type: string;

  breed: string;

  dateOfBirth: string | null;

  dateAcquired: string | null;

  status: string;

  dateLeft: string | null;

  currentWeightKg: number | null;

  lastWeighedAt: string | null;

  lactationNumber: number | null;

  isCurrentlyLactating: boolean;

  daysInMilk: number | null;

  expectedNextHeatDate: string | null;

  notes: string | null;

  metadata: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;
}
export interface StockItem {
  id: string;

  farmId: string;

  category: string;

  name: string;

  description: string | null;

  unit: string;

  minStockLevel: number;

  optimalStockDays: number;

  isActive: boolean;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}
export interface Farm {
  id: string;
  name: string;
  description: string | null;

  areaHectares: number;

  country: string;
  region: string;
  subRegion: string | null;
  timezone: string;

  ownerId: string;

  geoPoint: GeoPoint | null;
  boundary: FarmBoundary | null;

  plots: Plot[];

  members: FarmMember[];

  poultryHouses: PoultryHouse[];

  cows: Cow[];

  ruminants: any[];

  stockItems: StockItem[];

  createdAt: string;
  updatedAt: string;
}

export interface Plot {
  id: string;
  name: string;
  areaHectares: number;
  soilType: string;
  soilPhLevel: number | null;
  farmId: string;
  notes: string | null;
  cropCycles: CropCycleSummary[];
  createdAt: string;
}

export interface CropCycleSummary {
  id: string;
  cropType: string;
  variety: string | null;
  currentStage: string;
  status: string;
  plantedAt: string;
}

export interface CreateFarmInput {
  name: string;
  description?: string;
  areaHectares: number;
  country: string;
  region: string;
  subRegion?: string;
  timezone?: string;
  location?: { latitude: number; longitude: number };
}

export type UpdateFarmInput = Partial<CreateFarmInput>;

export interface CreatePlotInput {
  name: string;
  areaHectares: number;
  soilType?: string;
  soilPhLevel?: number;
  notes?: string;
}

export type UpdatePlotInput = Partial<CreatePlotInput>;

export interface Crop {
  id: string;
  cropType: string;
  variety: string | null;
  plotId: string;
  farmId: string;
  status: "planned" | "planted" | "growing" | "mature" | "harvested";
  currentStage: string;
  plantedAt: string;
  expectedHarvestAt: string | null;
  harvestedAt: string | null;
  description: string | null;
  estimatedYield: number | null;
  yieldUnit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCropInput {
  cropType: string;
  variety?: string;
  plotId: string;
  status?: "planned" | "planted" | "growing" | "mature" | "harvested";
  currentStage?: string;
  plantedAt?: string;
  expectedHarvestAt?: string;
  description?: string;
  estimatedYield?: number;
  yieldUnit?: string;
}
// ============================================
// Farm Member Roles and related types
// ============================================

export enum FarmMemberRole {
  OWNER = "owner",
  MANAGER = "manager",
  WORKER = "worker",
}

export const getRoleDisplayName = (role: FarmMemberRole): string => {
  switch (role) {
    case FarmMemberRole.OWNER:
      return "Farm Owner";
    case FarmMemberRole.MANAGER:
      return "Farm Manager";
    case FarmMemberRole.WORKER:
      return "Farm Worker";
    default:
      return "Unknown";
  }
};

// Reuse the existing FarmSummary defined earlier; provide a wrapper for membership responses
export interface FarmWithRole extends FarmSummary {
  role: FarmMemberRole;
}

export interface FarmMembershipResponse {
  farm: FarmSummary;
  role: string | FarmMemberRole;
  isActive: boolean;
  joinedAt: string;
  assignedHouseIds?: string[] | null;
  notes?: string | null;
}
export interface PoultryRecord {
  id: string;
  flockId: string;
  recordDate: string;

  mortality: number;
  culls: number;

  feedConsumedKg: number;
  feedType: string | null;
  waterConsumedLitres: number;

  sickBirds: number;
  medication: string | null;

  temperatureCelsius: number | null;

  morningEggs: number | null;
  eveningEggs: number | null;
  brokenEggs: number | null;
  dirtyEggs: number | null;

  avgBodyWeightKg: number | null;
  sampleSize: number | null;
  uniformityPercent: number | null;
  productionRatePercent: number | null;

  feedConversionRatio: number | null;

  liveBirdsAfterRecord: number;

  feedCost: number;
  eggRevenue: number;
  mortalityCost: number;

  healthRiskScore: number;

  createdAt: string;
  updatedAt: string;
}

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
  createdAt: string;
  updatedAt: string;
  submittedById: string;
  submittedBy: User;
  status: "draft" | "submitted" | "reviewed" | "flagged";
  reviewNote?: string;
  reviewedById?: string;
  reviewedAt?: string;
  brokenEggs?: number;
  dirtyEggs?: number;
  culls?: number;
  waterConsumption?: number;
  sickBirds?: number;
  morningEggs?: number;
  eveningEggs?: number;
  feedType?: string;
  uniformityPercent?: number;
  productionRatePercent?: number;
  feedConversionRatio?: number;
  sampleSize?: number;
  avgBodyWeightKg?: number;
  feedCost?: number;
  eggRevenue?: number;
  mortalityCost?: number;
  healthRiskScore?: number;
  mortality;
}

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
    status: "OPTIMAL" | "DECLINING";
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
    healthStatus: "HEALTHY" | "AT_RISK" | "CRITICAL";
    profitabilityStatus: "PROFITABLE" | "UNPROFITABLE";
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
    status: "GOOD" | "POOR";
  };
  production: {
    actual: number;
    status: "GOOD" | "POOR";
  } | null;
  fcr: {
    actual: number;
    status: "GOOD" | "POOR";
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

// types/index.ts - Add these types

export interface PricingTier {
  id: string;
  farmId: string;
  version: number;
  status: 'active' | 'archived' | 'scheduled' | 'suspended';
  effectiveDate: string | null;
  archivedDate: string | null;
  feedCostPerKg: number;
  eggPricePerTray: number;
  broilerPricePerKg: number;
  mortalityCostPerBird: number;
  dayOldChickWeightKg: number;
  waterCostPerLitre: number | null;
  electricityCostPerUnit: number | null;
  createdBy: string;
  createdByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
  creationReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingHistory {
  id: string;
  pricingTierId: string;
  farmId: string;
  event: 'created' | 'activated' | 'archived' | 'suspended' | 'restored';
  prices: {
    feedCostPerKg: number;
    eggPricePerTray: number;
    broilerPricePerKg: number;
    mortalityCostPerBird: number;
  };
  eventReason: string | null;
  actedBy: string;
  actedByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
  eventDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingHistoryResponse {
  data: PricingHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreatePricingInput {
  feedCostPerKg: number;
  eggPricePerTray: number;
  broilerPricePerKg: number;
  mortalityCostPerBird: number;
  dayOldChickWeightKg?: number;
  reason: string;
  notes?: string;
}
