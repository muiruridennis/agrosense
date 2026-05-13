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
  geoPoint: { type: "Point"; coordinates: [number, number] } | null;
  plots: Plot[];
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

export type UpdateCropInput = Partial<CreateCropInput>;
