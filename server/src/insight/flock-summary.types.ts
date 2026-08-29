import { FlockType } from '../flock/enums';

export interface FlockSummaryAge {
  days: number;
  weeks: number;
  display: string;
}

export interface FlockSummaryFlock {
  id: string;
  name: string | null;
  breed: string;
  type: FlockType;
  status: string | null;
  stage: string | null;
  currentCount: number;
  initialCount: number;
  age: FlockSummaryAge;
}

export interface FlockSummaryProduction {
  latestRecordDate: string | null;
  isLatestRecordToday: boolean;
  latestRecordEggs: number | null;
  latestProductionRatePercent: number | null;
  populationAtStartOfProductionDay: number | null;
  avgEggsPerDay7d: number | null;
  totalEggsCollected: number;
  trayBreakdown: {
    fullTrays: number;
    looseEggs: number;
    display: string;
  } | null;
}

export interface FlockSummaryFeed {
  latestRecordDate: string | null;
  latestRecordFeedKg: number | null;
  totalFeedConsumedKg: number;
  feedPerBirdGramsLatest: number | null;
}

export interface FlockSummaryHealth {
  totalMortality: number;
  totalCulls: number;
  populationLoss: number;
  mortalityPercent: number;
  cullingPercent: number;
  survivalRatePercent: number;
}

export interface FlockSummaryGrowth {
  available: boolean;
  reason?: string;
  currentAverageWeightKg?: number;
  weightGainKg?: number | null;
  firstWeighedOn?: string | null;
  latestWeighedOn?: string | null;
}

export interface FlockSummary {
  flock: FlockSummaryFlock;
  production: FlockSummaryProduction;
  feed: FlockSummaryFeed;
  health: FlockSummaryHealth;
  growth: FlockSummaryGrowth;
  recordsLogged: number;
}
